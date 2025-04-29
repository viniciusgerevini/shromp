import path from "node:path";
import { Marked } from 'marked';
import { gfmHeadingId, getHeadingList } from "marked-gfm-heading-id";

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

	// TODO remove after part of version control
	// // vanila way to get headings
	// const renderer = {
	// 	heading({tokens, depth}: any): string | false {
	// 		if (depth === 1 && !title) {
	// 			title = getFirstTextTokenValue(tokens);
	// 		} else if (depth === 2) {
	// 			anchors.push(createContentAnchorFromText(getFirstTextTokenValue(tokens)!));
	// 		}
	// 		return false;
	// 	},
	// };

	const mkd = new Marked();
	mkd.use(gfmHeadingId({ prefix: "aid-" }));
	// mkd.use({ renderer });

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

// function getFirstTextTokenValue(tokens: { type: string, text: string }[]): string | undefined {
// 	for (let token of tokens) {
// 		if (token.type === "text") {
// 			return token.text;
// 		}
// 	}
// }
//
// function createContentAnchorFromText(text: string): ContentAnchor {
// 	return {
// 		id: text.toLowerCase().replaceAll(/\s+/g, "-"), // TODO better sanitization
// 		name: text,
// 	}
// }
