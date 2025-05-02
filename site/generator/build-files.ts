import { ContentAnchor, ContentNode } from "./content-convertion.ts";
import config from "./config.ts";
import { copyTo, createFile, listFilesInDir } from "./files.ts";
import Templates from "./templates.ts";
import { compileSiteAssets, SiteAssets } from "./assets.ts";

interface ContentData {
	title: string;
	content: string;
	locale: string;
	version?: string;
	template: string | undefined;
	childLinks: NavigationLink[];
}

type ContentCache = { [key:string]: ContentData };

interface NavigationLink {
	title: string;
	path: string;
	level: number;
	children?: NavigationLink[];
}

type NavigationLinksForLocale = {[locale: string]: NavigationLink };

export async function createSiteFromContent(content: ContentNode): Promise<void> {
	const contentCache: ContentCache = {};

	const navigationLinksByLocale = createNavigationTree(content, contentCache);

	const assets = await compileSiteAssets();

	await createPages(contentCache, navigationLinksByLocale, assets);
	await updateVersionsFiles(navigationLinksByLocale);
}

function createNavigationTree(content: ContentNode, contentCache: ContentCache): NavigationLinksForLocale {
	// TODO: allow disabling locale folder
	const navigationLinksByLocale: NavigationLinksForLocale = {};

	for (let localeFolder of content.nestedContent) {
		const rootContent: ContentNode = {
			title: localeFolder.title,
			pathSection: localeFolder.pathSection,
			htmlContent: localeFolder.htmlContent,
			anchors: localeFolder.anchors,
			nestedContent: localeFolder.nestedContent,
			isIndex: localeFolder.isIndex,
		};

		// TODO: allow disabling version
		rootContent.pathSection += `/${config.versionToPublish()}`;

		navigationLinksByLocale[localeFolder.pathSection] = createNavigationLinks({
			content: rootContent,
			contentCache,
			locale: localeFolder.pathSection,
			version: config.versionToPublish(),
			basePath: "",
		});
	}

	return navigationLinksByLocale;
}

interface CreateNavigationLinksParams {
	content: ContentNode;
	contentCache: ContentCache;
	locale: string;
	version?: string;
	basePath?: string;
}

function createNavigationLinks({ content, contentCache, locale, version, basePath = "" } : CreateNavigationLinksParams): NavigationLink {
	const thisPath = `${basePath}/${content.pathSection}`;
	const filePath = content.isIndex ? `${thisPath}/index.html` : `${thisPath}.html`;

	const mapAnchor = (anchor: ContentAnchor): NavigationLink => {
		return {
			title: anchor.name,
			path: `${filePath}#${anchor.id}`,
			level: anchor.level,
			children: [],
		}
	};

	const localLinks: NavigationLink[] = [];

	const anchorStack: Array<Array<NavigationLink>> = [localLinks];
	let currentLevel = 2;

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

	const children = content.nestedContent.map(
		(c) => createNavigationLinks({ content: c, contentCache, locale, version, basePath: thisPath })
	);

	if (content.htmlContent) {
		contentCache[filePath] = {
			title: content.title,
			content: content.htmlContent,
			locale,
			version,
			template: content.template,
			childLinks: children,
		};
	}

	return {
		title: content.title,
		path: filePath,
		level: 1,
		children: localLinks.concat(children),
	};
}

async function createPages(
	contentCache: ContentCache,
	navigationLinksByLocale: NavigationLinksForLocale,
	assets: SiteAssets,
): Promise<void> {
	const templates = await Templates();

	for (const [filePath, content] of Object.entries(contentCache)) {
		console.log("Generating page ", filePath);

		const template = await templates.getTemplate(content.template || config.defaultPageTemplate());

		const pageContent = template({
			pageTitle: content.title,
			mainContent: content.content,
			navigationMenu: navigationLinksByLocale[content.locale],
			locale: content.locale,
			version: content.version,
			currentFilePath: filePath,
			childLinks: content.childLinks,
			assets,
		});
		await createFile(config.outputFolder(filePath), pageContent);
	}
}

export async function copyImages(): Promise<void> {
	await copyTo(config.sourceFolder("assets", "images"), config.outputFolder("assets", "images"));
}

async function updateVersionsFiles(navigationLinksByLocale: NavigationLinksForLocale): Promise<void> {
	const versions = await getAllVersions(navigationLinksByLocale);
	const versionsFilePath = config.outputFolder("versions.json");

	console.log(`Creating versions file ${versionsFilePath}`)

	await createFile(versionsFilePath, JSON.stringify({ versions }));
}

async function getAllVersions(navigationLinksByLocale: NavigationLinksForLocale): Promise<string[]> {
	const versions: Set<string> = new Set();

	for (let locale of Object.keys(navigationLinksByLocale)) {
		const versionsForLocale = await listFilesInDir(config.outputFolder(locale));
		for (let version of versionsForLocale) {
			versions.add(version);
		}
	}
	versions.add(config.versionToPublish());

	return Array.from(versions);
}


// TODO: PENDING TASKS
// TODO
// - not found page and custom pages
