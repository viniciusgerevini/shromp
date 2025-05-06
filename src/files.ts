/**
 * This module is responsible for interacting with the file system
 */
import { Dirent, existsSync } from 'node:fs';
import crypto from "crypto";
import {
	FileHandle,
	cp,
	mkdir,
	open,
	readdir,
	writeFile,
} from 'node:fs/promises';

import * as path from "node:path";

export interface DirNode {
	name: string;
	path: string;
	children: (DirNode|FileNode)[];
	hasIndex: boolean;
}

export interface FileNode {
	name: string;
	path: string;
}

interface GetFileTreeOptions {
	excludeEmptyFolders?: boolean;
}

/**
 * Return a file tree representation with all the relevant markdown files and folders.
 */
export async function getFileTree(dirPath: string, options: GetFileTreeOptions = {}): Promise<DirNode> {
	const thisDir: DirNode = {
		name: sanitizeName(path.basename(dirPath)),
		path: pathRelativeToProcess(dirPath),
		children: [],
		hasIndex: false,
	};

	const files = await readdir(pathRelativeToProcess(dirPath), { withFileTypes: true });

	for (const file of files) {
		if (file.isDirectory()) {
			const childFolder = await getFileTree(getFilePath(file), options);
			if (options.excludeEmptyFolders && (childFolder.children.length === 0 && !childFolder.hasIndex)) {
				continue;
			}
			thisDir.children.push(childFolder);
		} else if (path.extname(file.name) === ".md") {
				if (file.name === "index.md") {
					thisDir.hasIndex = true;
				} else {
					thisDir.children.push({
						name: sanitizeName(file.name),
						path: getFilePath(file),
					});
				}
		}
	}

	return thisDir;
}

function getFilePath(file: Dirent): string {
	return path.join(file.parentPath, file.name);
}

/**
 * removes number prefix and extension
 **/
function sanitizeName(fileName: string): string {
	return path.parse(fileName.replace(/^[0-9]+\-/, '')).name;
}

/**
 * Type guard to identify dir nodes
 **/
export function isDirNode(node: DirNode | FileNode): node is DirNode {
  return (node as DirNode).children !== undefined;
}

export async function readFileContent(filePath: string): Promise<string> {
	let filehandle: FileHandle|undefined = undefined;
	try {
		filehandle = await open(filePath, 'r');
		return filehandle.readFile({ encoding: "utf8" });
	} finally {
		await filehandle?.close();
	} 
}

async function createFolderIfRequired(folderPath: string): Promise<void> {
	await mkdir(folderPath, { recursive: true });
}

export async function createFile(filePath: string, content: string): Promise<void> {
	await createFolderIfRequired(path.dirname(filePath));
	await writeFile(filePath, content);
}

export async function listFilesInDir(dirPath: string): Promise<string[]> {
	return readdir(dirPath);
}

export async function copyTo(fromPath: string, toPath: string): Promise<void> {
	await cp(fromPath, toPath, { recursive: true });
}

export function generateHashForContent(content: string, length: number = 5): string {
	return crypto.createHash('shake256', { outputLength: length}).update(content).digest('hex');
}

export function fileExists(filePath: string): boolean {
	return existsSync(pathRelativeToProcess(filePath));
}

export function pathRelativeToProcess(filePath: string, ...args: string[]): string {
	const cwd = path.isAbsolute(filePath) ? "" : process.cwd();

	if (args.length) {
		return path.join(cwd,filePath, ...args);
	}
	return path.join(cwd, filePath);
}
