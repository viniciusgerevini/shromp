import path from "node:path";
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList } from "marked-gfm-heading-id";
import extendedTables from "marked-extended-tables";

import { DirNode, FileNode, isDirNode, readFileContent } from "./files.ts";

export interface ContentNode {
	title: string;
	pathSection: string;
	htmlContent: string | null;
	anchors: ContentAnchor[];
	nestedContent: ContentNode[];
	isIndex: boolean;
	template?: string;
	doNotShowInNavigation: boolean;
}

export interface ContentAnchor {
	id: string;
	name: string;
	level: number;
}

/**
 * Walk the tree converting markdown content to HTML and indexing titles and anchors
 */
export async function generateHtmlForTree(tree: DirNode): Promise<ContentNode> {
	return contentForNode(tree);
}

async function contentForNode(sourceNode: DirNode | FileNode): Promise<ContentNode> {
	if (isDirNode(sourceNode)) {
		const dirContentNode: ContentNode = {
			title: sourceNode.name,
			pathSection: sourceNode.name,
			htmlContent: null,
			anchors: [],
			nestedContent: [],
			isIndex: false,
			doNotShowInNavigation: false,
		};
		if (sourceNode.hasIndex) {
			const indexNode = await generateContentForFile(path.join(sourceNode.path, "index.md"));
			dirContentNode.title = indexNode.title!;
			dirContentNode.htmlContent = indexNode.htmlContent;
			dirContentNode.anchors = indexNode.anchors;
			dirContentNode.isIndex = true;
			dirContentNode.template = indexNode.template;
		}

		dirContentNode.nestedContent = await Promise.all(sourceNode.children.map(contentForNode));

		return dirContentNode;
	}

	const contentNode = await generateContentForFile(sourceNode.path);

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
}

async function generateContentForFile(filePath: string): Promise<ContentForFileResult> {
	const content = await readFileContent(filePath);

	let headingAnchorsMaxLevel = 3;
	let title: string | undefined = undefined;
	let template: string | undefined = undefined;
	let doNotShowInNavigation: boolean = false;

	const mkd = new Marked();

	mkd.use({ hooks: {
		preprocess(markdown: string): string | Promise<string> {
			if (markdown.startsWith("<!--")) {
				const metadata = extractMetadata(markdown);

				if (metadata.title) {
					title = metadata.title;
				}
				if (metadata.template) {
					template = metadata.template;
				}
				if (metadata.headingNavMaxLevel || metadata.headingNavMaxLevel === 0) {
					headingAnchorsMaxLevel = metadata.headingNavMaxLevel;
				}
				if (metadata.doNotShowInNavigation) {
					doNotShowInNavigation = metadata.doNotShowInNavigation;
				}
				if (metadata.contentToRemove) {
					return markdown.replace(metadata.contentToRemove, "");
				}
			}

			return markdown;
		}

	}});

	mkd.use(gfmHeadingId({ prefix: "aid-" }));
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
				let targetPath = img.href.replaceAll(/\.\.\/+/g, "/");
				let shouldCentralize = false;

				if (targetPath.includes("?center")) {
					targetPath = targetPath.replace("?center", "");
					shouldCentralize = true;
				}

				return `<img src="${targetPath}" alt="${img.text}" ${shouldCentralize ? 'class="img-center"' : ''} />`
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
	}
}

// FIXME: this is a bit coupled with the step to read files on files.ts
// Keeping it here for now, but it probably needs more thought
function transformLinkToTarget(link: string): string {
	return link.replaceAll(/\/[0-9]+\-/g, '/').replace(".md", ".html");
}

interface ContentMetadata {
	template?: string;
	title?: string;
	headingNavMaxLevel?: number;
	contentToRemove?: string;
	doNotShowInNavigation?: boolean;
}

function extractMetadata(content: string): ContentMetadata {
	const m = /^<!--[^<]+-->\n/s.exec(content);
	if (!m) {
		return {};
	}
	const metadata: ContentMetadata = {};
	const lines = m[0].split("\n");
	const relevantLines = lines.slice(1, lines.length - 1);

	for (let line of relevantLines) {
		const [key, value] = line.split(":");

		if (key.trim() === "template") {
			metadata.template = value.trim();
			continue;
		}

		if (key.trim() === "title") {
			metadata.title = value.trim();
			continue;
		}

		if (key.trim() === "headings-nav-max-level") {
			metadata.headingNavMaxLevel = parseInt(value.trim());
		}

		if (key.trim() === "do-not-show-in-nav") {
			metadata.doNotShowInNavigation = value.trim() === "true";
		}
	}
	metadata.contentToRemove = m[0];
	return metadata;
}
