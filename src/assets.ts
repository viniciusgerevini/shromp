/**
 * This module handle asset files (i.e. styles, frontend scripts).
 */
import path from "node:path";
import config from "./config.ts";
import {
	copyTo,
	createFile,
	fileExists,
	generateHashForContent,
	generateHashForFile,
	listFilesInDir,
	readFileContent
} from "./files.ts";
import * as logs from "./logs.ts";

type AssetFolder = "styles" | "scripts" | "images" | "content/images";

export interface AssetMap {
	[originalName: string]: string;
}

export interface SiteAssets {
	styles: AssetMap;
	scripts: AssetMap;
	images: AssetMap;
}

export async function compileSiteAssets(): Promise<SiteAssets> {
	// NOTE: The only thing being done at the moment is generating a hash to append to the file name
	// to prevents issues with caching.
	// Some people might feel the urge to implement minification and some other optimisations. That
	// should happen in this file, ideally exposed vai a hook.
	logs.start("Compiling theme asset");

	return {
		styles: await createTargetAssetsWithHash("styles"),
		scripts: await createTargetAssetsWithHash("scripts"),
		images: await createTargetAssetsWithHash("images"),
	}
}

export async function createTargetAssetsWithHash(assetFolder: AssetFolder): Promise<AssetMap> {
	const rootFolder = assetFolder === "content/images" ? config.sourceFolder("assets", "images") : config.themeAssetsFolder(assetFolder);

	if (!fileExists(rootFolder)) {
		return {};
	}
	const files = await listFilesInDir(rootFolder);

	const assets: AssetMap = {};

	if (assetFolder === "images" || assetFolder === "content/images") {
		for (let file of files) {
			assets[file] = await copyTargetImageWithHash(file, assetFolder, rootFolder);
		}
		return assets;
	}

	for (let file of files) {
			assets[file] = await createTargetFileWithHash(file, assetFolder);
	}

	return assets;
}

async function createTargetFileWithHash(file: string, assetFolder: AssetFolder ): Promise<string> {
	const content = await readFileContent(config.themeAssetsFolder(assetFolder, file));
	const hash = generateHashForContent(content);
	const targetName = getNameWithHash(file, hash);
	const targetPath = config.outputFolder("assets", assetFolder, targetName);
	await createFile(targetPath, content);
	const fileUrl = `${config.baseUrl()}assets/${assetFolder}/${targetName}`;
	logs.success(`Asset file created ${fileUrl}`);
	return fileUrl;
}

async function copyTargetImageWithHash(file: string, assetFolder: string, sourceRoot: string): Promise<string> {
	const sourceFilePath = path.join(sourceRoot, file);
	const hash = await generateHashForFile(sourceFilePath);
	const targetName = getNameWithHash(file, hash);
	const fileUrl = `${config.baseUrl()}assets/${assetFolder}/${targetName}`;
	const targetSubFolder = assetFolder.split("/").join(path.sep); // make sure path separator is OS specific
	await copyTo(
		sourceFilePath,
		config.outputFolder("assets", targetSubFolder, targetName)
	);

	logs.success(`Asset file created ${fileUrl}`);

	return fileUrl;
}

function getNameWithHash(file: string, hash: string): string {
	const ext = path.extname(file);
	const basename = path.basename(file, ext);
	return `${basename}.${hash}${ext}`;
}
