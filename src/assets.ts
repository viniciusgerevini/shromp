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

type AssetFolder = "styles" | "scripts";

interface ImageAssetMap {
	[originalName: string]: string;
}

export interface SiteAssets {
	styles: string[];
	scripts: string[];
	images: ImageAssetMap;
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
		images: await createTargetImagesWithHash(),
	}
}

async function createTargetAssetsWithHash(assetFolder: AssetFolder): Promise<string[]> {
	if (!fileExists(config.siteAssetsFolder(assetFolder))) {
		return [];
	}

	const files = await listFilesInDir(config.siteAssetsFolder(assetFolder));

	return Promise.all(files.map(async (file: string) => {
		return createTargetFileWithHash(file, assetFolder);
	}));
}

async function createTargetFileWithHash(file: string, assetFolder: AssetFolder ): Promise<string> {
	const content = await readFileContent(config.siteAssetsFolder(assetFolder, file));
	const hash = generateHashForContent(content);
	const targetName = getNameWithHash(file, hash);
	const targetPath = config.outputFolder("assets", assetFolder, targetName);
	await createFile(targetPath, content);
	const fileUrl = `${config.baseUrl()}assets/${assetFolder}/${targetName}`;
	logs.success(`Asset file created ${fileUrl}`);
	return fileUrl;
}

async function createTargetImagesWithHash(): Promise<ImageAssetMap> {
	if (!fileExists(config.siteAssetsFolder("images"))) {
		return {};
	}

	const files = await listFilesInDir(config.siteAssetsFolder("images"));

	const images: ImageAssetMap = {};

	for (let file of files) {
		const url = await copyTargetImageWithHash(file);
		images[file] = url;
	}

	return images;
}

async function copyTargetImageWithHash(file: string): Promise<string> {
	const hash = await generateHashForFile(config.siteAssetsFolder("images", file));
	const targetName = getNameWithHash(file, hash);
	const fileUrl = `${config.baseUrl()}assets/images/${targetName}`;
	await copyTo(
		config.siteAssetsFolder("images", file),
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
