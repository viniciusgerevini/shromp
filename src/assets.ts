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

type AssetFolder = "styles" | "scripts" | "images";

interface AssetMap {
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

async function createTargetAssetsWithHash(assetFolder: AssetFolder): Promise<AssetMap> {
	if (!fileExists(config.themeAssetsFolder(assetFolder))) {
		return {};
	}
	const files = await listFilesInDir(config.themeAssetsFolder(assetFolder));

	const assets: AssetMap = {};

	if (assetFolder === "images") {
		for (let file of files) {
			assets[file] = await copyTargetImageWithHash(file);
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

async function copyTargetImageWithHash(file: string): Promise<string> {
	const hash = await generateHashForFile(config.themeAssetsFolder("images", file));
	const targetName = getNameWithHash(file, hash);
	const fileUrl = `${config.baseUrl()}assets/images/${targetName}`;
	await copyTo(
		config.themeAssetsFolder("images", file),
		config.outputFolder("assets", "images", targetName)
	);
	logs.success(`Asset file created ${fileUrl}`);

	return fileUrl;
}

function getNameWithHash(file: string, hash: string): string {
	const ext = path.extname(file);
	const basename = path.basename(file, ext);
	return `${basename}.${hash}${ext}`;
}
