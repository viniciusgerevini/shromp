import * as path from "node:path";

import { ContentNode } from "./content-convertion.ts";
import config from "./config.ts";
import { createFile } from "./files.ts";

// TODO maybe use dotenv for config

interface ContentData {
	content: string;
	locale: string;
	version?: string;
}

type ContentCache = { [key:string]: ContentData };

export async function createSiteFromContent(content: ContentNode): Promise<void> {
	const contentCache: ContentCache = {};

	const navigationLinksByLocale: {[locale: string]: NavigationLink} = {};

	for (let localeFolder of content.nestedContent) {
		const rootContent: ContentNode = {
			title: localeFolder.title,
			pathSection: localeFolder.pathSection,
			htmlContent: localeFolder.htmlContent,
			anchors: localeFolder.anchors,
			nestedContent: localeFolder.nestedContent,
			isIndex: localeFolder.isIndex,
		};

		// TODO should support version folders?
		// - version folders should ignore version to publish
		// - maybe implement a single-version, mult-version source prop
		if (config.versionToPublish) {
			rootContent.pathSection += `/${config.versionToPublish}`;
		}

		// TODO: clean version folder before generating new files
		console.log(localeFolder.pathSection);

		navigationLinksByLocale[localeFolder.pathSection] = createNavigationLinks({
			content: rootContent,
			contentCache,
			locale: localeFolder.pathSection,
			version: config.versionToPublish,
			basePath: "",
		});
	}

	for (const [key, value] of Object.entries(contentCache)) {
		console.log(key, value.content.slice(0, 5));
		await createPageFile(key, value, navigationLinksByLocale[value.locale]);
	}

	// TODO:
	// create navigation tree and link mappings
	// replace markdown links to final ones
	//    - OK this is nasty, because at this point we don't have access to the source
	//    anymore. Probably this should be done in the content conversion step.
	//    here is my current idea
	//     - markdown files are linked to the actual markdown file
	//     - on convertion, generate an reference id for each file (this is important to unify relative paths)
	//     - on this step, map reference ids to original path, and replace them when inserting content
}


interface NavigationLink {
	title: string;
	path: string;
	level: number;
	children?: NavigationLink[];
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
	const localLinks: NavigationLink[] = content.anchors.map((anchor) => {
		return {
			title: anchor.name,
			path: `${filePath}#${anchor.id}`,
			level: anchor.level,
		};
	});

	if (content.htmlContent) {
		contentCache[filePath] = { content: content.htmlContent, locale, version };
	}

	return {
		title: content.title,
		path: filePath,
		level: 1,
		children: localLinks.concat(content.nestedContent.map(
			(c) => createNavigationLinks({ content: c, contentCache, locale, version, basePath: thisPath })
		)),
	};
}

async function createPageFile(filePath: string, content: ContentData, navigation: NavigationLink) {
	// TODO generate content from template
	// TODO use handlebars templates
	console.log(config.output_folder);
	await createFile(path.join(config.output_folder, filePath), content.content);
	// TODO create folders for file path
}
