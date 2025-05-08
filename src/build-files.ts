/**
 * Module responsible for generating the target files.
 */
import path from "node:path";
import { ContentAnchor, ContentNode } from "./content-conversion.ts";
import config from "./config.ts";
import { copyTo, createFile, fileExists, listFilesInDir } from "./files.ts";
import Templates, { TemplatesInstance } from "./templates.ts";
import { compileSiteAssets, SiteAssets } from "./assets.ts";
import * as logs from "./logs.ts";

interface ContentData {
	title: string;
	content: string;
	locale: string;
	version?: string;
	template: string | undefined;
	metadata: ContentNode["metadata"];
	childLinks: NavigationLink[];
	url: string;
}

type ContentCache = { [key:string]: ContentData };

interface NavigationLink {
	title: string;
	path: string;
	level: number;
	children?: NavigationLink[];
}

export function isNavigationLinksForLocale(node: NavigationLink | NavigationLinksForLocale): node is NavigationLinksForLocale {
	return (node as NavigationLink).path === undefined;
}

type NavigationLinksForLocale = {[locale: string]: NavigationLink };

export async function createSiteFromContent(content: ContentNode): Promise<void> {
	const contentCache: ContentCache = {};

	const navigationLinks = config.areLocalesEnabled() ?
		createNavigationTreeForLocale(content, contentCache) :
		createNavigationTreeForRoot(content, contentCache);

	const assets = await compileSiteAssets();

	const templates = await Templates();

	if (content.isIndex) {
		await createDocIndexPage(content, assets, templates);
	}

	logs.start("Creating pages");

	await createPages(contentCache, navigationLinks, assets, templates);

	if (config.isVersioningEnabled()) {
		await updateVersionsFiles(isNavigationLinksForLocale(navigationLinks) ? navigationLinks : "/");
	}
}

async function createDocIndexPage(content: ContentNode, assets: SiteAssets, templates: TemplatesInstance): Promise<void> {
	if (!config.shouldGenerateDocIndex()) {
		logs.warn('There is an index present for the root folder, but shromp is configured to skip generation.')
		return;
	}
	const indexPath = path.join("/", "index.html");

	logs.start("Creating root index");

	await createPage(indexPath, {
		template: content.template,
		pageTitle: content.title,
		mainContent: content.htmlContent,
		currentFilePath: config.baseUrl(indexPath),
		metadata: content.metadata,
		locale: config.defaultLocale(),
		version: config.isVersioningEnabled() ? config.versionToPublish() : undefined,
		assets,
		baseUrl: config.baseUrl(),
	}, templates);

	logs.success("Root index created");
}

function createNavigationTreeForLocale(content: ContentNode, contentCache: ContentCache): NavigationLinksForLocale {
	const navigationLinksByLocale: NavigationLinksForLocale = {};

	for (let localeFolder of content.nestedContent) {

		navigationLinksByLocale[localeFolder.pathSection] = createNavigationTree(
			localeFolder,
			contentCache,
			localeFolder.pathSection
		);
	}

	return navigationLinksByLocale;
}

function createNavigationTreeForRoot(content: ContentNode, contentCache: ContentCache): NavigationLink {
	const rootContent: ContentNode = {
		...content,
		pathSection: "/",
	};

	return createNavigationTree(rootContent, contentCache);
}

function createNavigationTree(
	content: ContentNode,
	contentCache: ContentCache,
	locale: string = config.defaultLocale()
): NavigationLink {
	const rootContent: ContentNode = {
		...content
	};

	if (config.isVersioningEnabled()) {
		rootContent.pathSection = path.join(rootContent.pathSection, config.versionToPublish());
	}

	return createNavigationLinks({
		content: rootContent,
		contentCache,
		locale,
		version: config.versionToPublish(),
		basePath: "/",
	});
}

interface CreateNavigationLinksParams {
	content: ContentNode;
	contentCache: ContentCache;
	locale: string;
	version?: string;
	basePath?: string;
}

function createNavigationLinks({ content, contentCache, locale, version, basePath = "" } : CreateNavigationLinksParams): NavigationLink {
	const thisPath = path.join(basePath, content.pathSection);
	const filePath = content.isIndex ? path.join(thisPath, "index.html") : `${thisPath}.html`;
	const routeUrl = config.baseUrl(filePath);

	const mapAnchor = (anchor: ContentAnchor): NavigationLink => {
		return {
			title: anchor.name,
			path: `${routeUrl}#${anchor.id}`,
			level: anchor.level,
			children: [],
		}
	};

	const localLinks: NavigationLink[] = [];

	const anchorStack: Array<Array<NavigationLink>> = [localLinks];
	let currentLevel = content.anchors.length ? content.anchors[0].level : 2 ;

	for (let anchor of content.anchors) {
		const currentList = anchorStack[anchorStack.length - 1];
		const anchorAsLink = mapAnchor(anchor);

		if (anchor.level === currentLevel) {
			currentList.push(anchorAsLink);
			continue;
		}

		if (anchor.level > currentLevel) {
			const lastAnchorToNest = currentList[currentList.length - 1].children!; 
			anchorStack.push(lastAnchorToNest);
			lastAnchorToNest.push(anchorAsLink);
		} else {
			anchorStack.pop();
			const lastListToNext = anchorStack[anchorStack.length - 1];
			lastListToNext.push(anchorAsLink);
		}
		currentLevel = anchor.level;
	};

	const children = content.nestedContent.reduce<NavigationLink[]>((links , c) => {
		const link = createNavigationLinks({ content: c, contentCache, locale, version, basePath: thisPath });

		if (!c.doNotShowInNavigation) {
			links.push(link);
		}

		return links;
	}, []);

	if (content.htmlContent) {
		contentCache[filePath] = {
			title: content.title,
			content: content.htmlContent,
			locale,
			version,
			template: content.template,
			childLinks: children,
			metadata: content.metadata,
			url: routeUrl,
		};
	}

	return {
		title: content.title,
		path: routeUrl,
		level: 1,
		children: localLinks.concat(children),
	};
}

async function createPages(
	contentCache: ContentCache,
	navigationLinks: NavigationLinksForLocale | NavigationLink,
	assets: SiteAssets,
	templates: TemplatesInstance,
): Promise<void> {

	for (const [filePath, content] of Object.entries(contentCache)) {
		await createPage(filePath, {
			template: content.template,
			pageTitle: content.title,
			mainContent: content.content,
			navigationMenu: isNavigationLinksForLocale(navigationLinks) ? navigationLinks[content.locale] : navigationLinks,
			locale: content.locale,
			version: config.isVersioningEnabled() ? content.version : undefined,
			currentFilePath: content.url,
			childLinks: content.childLinks,
			metadata: content.metadata,
			assets,
			baseUrl: config.baseUrl(),
		}, templates);
		logs.success(`Page created ${filePath}`);
	}
}

async function createPage(filePath: string, content: any, templates: TemplatesInstance): Promise<void> {
	const template = await templates.getTemplate(content.template || config.defaultPageTemplate());
	const pageContent = template(content);
	await createFile(config.outputFolder(filePath), pageContent);
}

export async function copyImages(): Promise<void> {
	if (!fileExists(config.sourceFolder("assets", "images"))) {
		return;
	}

	await copyTo(config.sourceFolder("assets", "images"), config.outputFolder("assets", "images"));
}

async function updateVersionsFiles(navigationLinksByLocale: NavigationLinksForLocale | string ): Promise<void> {
	const versions = await getAllVersions(navigationLinksByLocale);

	const versionsFilePath = config.outputFolder("versions.json");

	logs.start(`Creating versions file ${versionsFilePath}`);

	await createFile(versionsFilePath, JSON.stringify({ versions }));

	logs.success("Versions file created");
}

async function getAllVersions(root: NavigationLinksForLocale | string): Promise<string[]> {
	const versions: Set<string> = new Set();

	if (typeof root === "string") {
		await loadItemNamesFromFolder(root, versions);
	} else {
		for (let locale of Object.keys(root)) {
			await loadItemNamesFromFolder(locale, versions);
		}
	}

	versions.add(config.versionToPublish());

	return Array.from(versions);
}

async function loadItemNamesFromFolder(rootFolder: string, items: Set<string>): Promise<void> {
	const itemsInFolder = await listFilesInDir(config.outputFolder(rootFolder));

	for (let item of itemsInFolder) {
		items.add(item);
	}
}


