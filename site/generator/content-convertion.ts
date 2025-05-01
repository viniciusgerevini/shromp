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
		};
		if (sourceNode.hasIndex) {
			const indexNode = await generateContentForFile(path.join(sourceNode.path, "index.md"));
			dirContentNode.title = indexNode.title!;
			dirContentNode.htmlContent = indexNode.htmlContent;
			dirContentNode.anchors = indexNode.anchors;
			dirContentNode.isIndex = true;
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
}

async function generateContentForFile(filePath: string): Promise<ContentForFileResult> {
	const content = await readFileContent(filePath);

	let title: string | undefined = undefined;

	const mkd = new Marked();

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
		if (heading.level === 1 && !title) {
			title = heading.text;
			// TODO configure heading depth allowing nesting for anchors
			// config global and per file
		} else if (heading.level <= 3) {
			anchors.push({ id: heading.id, name: heading.text, level: heading.level });
		}
	}

	return {
		title,
		htmlContent,
		anchors,
	}
}

// FIXME: this is a bit coupled with the step to read files on files.ts
// Keeping it here for now, but it probably needs more thought
function transformLinkToTarget(link: string): string {
	return link.replaceAll(/\/[0-9]+\-/g, '/').replace(".md", ".html");
}
