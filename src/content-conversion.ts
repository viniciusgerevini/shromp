/** Module responsible for converting files from markdown to HTML. */
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList } from "marked-gfm-heading-id";
import extendedTables from "marked-extended-tables";

import { DirNode, FileNode, isDirNode, pathRelativeToProcess, readFileContent } from "./files.ts";
import config from './config.ts';
import { AssetMap } from './assets.ts';
import path from 'node:path';

export interface ContentNode { title: string;
	pathSection: string;
	htmlContent: string | null;
	anchors: ContentAnchor[];
	nestedContent: ContentNode[];
	isIndex: boolean;
	template?: string;
	doNotShowInNavigation: boolean;
	metadata: ContentMetadata["keys"];
}

export interface ContentAnchor {
	id: string;
	name: string;
	level: number;
}

/**
 * Walk the tree converting markdown content to HTML and indexing titles and anchors
 */
export async function generateHtmlForTree(tree: DirNode, contentImages: AssetMap = {}): Promise<ContentNode> {
	return contentForNode(tree, contentImages);
}

async function contentForNode(sourceNode: DirNode | FileNode, contentImages: AssetMap): Promise<ContentNode> {
	if (isDirNode(sourceNode)) {
		const dirContentNode: ContentNode = {
			title: sourceNode.name,
			pathSection: sourceNode.name,
			htmlContent: null,
			anchors: [],
			nestedContent: [],
			isIndex: false,
			doNotShowInNavigation: false,
			metadata: {},
			template: undefined,
		};
		if (sourceNode.hasIndex) {
			const indexNode = await convertFileContent(pathRelativeToProcess(sourceNode.path, "index.md"), contentImages);
			dirContentNode.title = indexNode.title!;
			dirContentNode.htmlContent = indexNode.htmlContent;
			dirContentNode.anchors = indexNode.anchors;
			dirContentNode.isIndex = true;
			dirContentNode.template = indexNode.template;
			dirContentNode.doNotShowInNavigation = indexNode.doNotShowInNavigation;
			dirContentNode.metadata = indexNode.metadata;
		}

		dirContentNode.nestedContent = await Promise.all(sourceNode.children.map(
			(c) => contentForNode(c, contentImages),
		));

		return dirContentNode;
	}

	const contentNode = await convertFileContent(pathRelativeToProcess(sourceNode.path), contentImages);

	return {
		...contentNode,
		pathSection: sourceNode.name,
		title: contentNode.title || sourceNode.name,
		nestedContent: [],
		isIndex: false,
	};
}

interface ContentForFileResult {
	title: string | undefined;
	htmlContent: string;
	anchors: ContentAnchor[];
	template: string | undefined;
	doNotShowInNavigation: boolean;
	metadata: ContentMetadata["keys"];
}

async function convertFileContent(filePath: string, contentImages: AssetMap): Promise<ContentForFileResult> {
	const content = await readFileContent(filePath);

	let headingAnchorsMaxLevel = 3;
	let title: string | undefined = undefined;
	let template: string | undefined = undefined;
	let doNotShowInNavigation: boolean = false;
	let metadata: ContentMetadata["keys"] = {};

	const mkd = new Marked();

	mkd.use({ hooks: {
		preprocess(markdown: string): string | Promise<string> {
			const meta = extractMetadata(markdown);
			if (meta) {
				metadata = meta.keys;

				if (metadata.page_title) {
					title = metadata.page_title;
				}
				if (metadata.template) {
					template = metadata.template;
					delete metadata.template;
				}
				if (metadata.nav_max || metadata.nav_max === 0) {
					headingAnchorsMaxLevel = metadata.nav_max;
				}
				if (metadata.hidden) {
					doNotShowInNavigation = metadata.hidden;
				}
				if (meta.contentToRemove) {
					return markdown.replace(meta.contentToRemove, "");
				}
			}

			return markdown;
		}
	}});

	mkd.use(gfmHeadingId({ prefix: config.anchorPrefix() }));
	mkd.use(extendedTables());
	mkd.use({
		renderer: {
			link(link): string | false {
				if (!link.href.startsWith(".")) {
					return false;
				}

				return `<a href="${transformLinkToTarget(link.href)}">${link.text}</a>`;
			},
			image(img): string | false {
				if (!img.href.startsWith(".")) {
					return false;
				}

				let absoluteLinkToFile = img.href.replaceAll(/(\.\.\/)+/g, "/");

				if (path.dirname(absoluteLinkToFile).startsWith("/assets/images")) {
					const fileName = path.basename(absoluteLinkToFile);
					if (contentImages[fileName]) {
						absoluteLinkToFile = contentImages[fileName];
					}
				}

				let targetPath = config.baseUrl(absoluteLinkToFile);
				let shouldCentralize = false;

				if (targetPath.includes("?center")) {
					targetPath = targetPath.replace("?center", "");
					shouldCentralize = true;
				}

				return `<img src="${targetPath}" alt="${img.text}" ${shouldCentralize ? 'class="img-center"' : ''}/>`
			},
		}
	});

	const htmlContent: string = mkd.parse(content) as string;

	const anchors: ContentAnchor[] = [];

	for (let heading of getHeadingList()) {
		if (heading.level === 1) {
			if (!title) {
				title = heading.text;
			}
		} else if (heading.level <= headingAnchorsMaxLevel) {
			anchors.push({ id: heading.id, name: heading.text, level: heading.level });
		}
	}

	return {
		title,
		htmlContent,
		anchors,
		template,
		doNotShowInNavigation,
		metadata,
	}
}

function transformLinkToTarget(link: string): string {
	return link.replaceAll(/\/[0-9]+\-/g, '/').replace(".md", ".html").replace(".html#", `.html#${config.anchorPrefix()}`);
}

interface ContentMetadata {
	contentToRemove: string;
	keys: { [key: string]: any };
}

function extractMetadata(content: string): ContentMetadata | undefined {
	const m = /^<!--[^<]+-->\n/s.exec(content);
	if (!m) {
		return;
	}

	const metadata: ContentMetadata = {
		contentToRemove: m[0],
		keys: {},
	};

	const lines = m[0].split("\n");
	const relevantLines = lines.slice(1, lines.length - 1);

	for (let line of relevantLines) {
		const [key, value] = line.split(":");
		if (key.startsWith("-")) {
			continue;
		}
		const metadataKey = key.trim();
		const metadataRawValue = value ? value.trim() : "true";

		metadata.keys[metadataKey] = parseMetadataValue(metadataRawValue); 
	}

	return metadata;
}

function parseMetadataValue(value: string) {
	if (value.match(/[/^\d+$/]/)) {
		return parseFloat(value);
	}
	if (value === "false" || value === "true") {
		return value === "true";
	}
	return value;
}
