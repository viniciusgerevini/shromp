/**
 * This module handle asset files (i.e. styles, frontend scripts).
 */
import path from "node:path";
import config from "./config.ts";
import { createFile, generateHashForContent, listFilesInDir, readFileContent } from "./files.ts";

type AssetFolder = "styles" | "scripts";

export interface SiteAssets {
	styles: string[];
	scripts: string[];
}

export async function compileSiteAssets(): Promise<SiteAssets> {
	console.log("Compiling assets");
	// NOTE: The only thing being done at the moment is generating a hash to append to the file name
	// to prevents issues with caching.
	// Some people might feel the urge to implement minification and some other optimisations. That
	// should happen in this file, ideally exposed vai a hook.
	return {
		styles: await createTargetAssetsWithHash("styles"),
		scripts: await createTargetAssetsWithHash("scripts"),
	}
}

async function createTargetAssetsWithHash(assetFolder: AssetFolder): Promise<string[]> {
	const files = await listFilesInDir(config.siteAssetsFolder(assetFolder));

	return Promise.all(files.map(async (file: string) => {
		return createTargetFileWithHash(file, assetFolder);
	}));
}

async function createTargetFileWithHash(file: string, assetFolder: AssetFolder ): Promise<string> {
	const content = await readFileContent(config.siteAssetsFolder(assetFolder, file));
	const hash = generateHashForContent(content);
	const ext = path.extname(file);
	const basename = path.basename(file, ext);
	const targetName = `${basename}.${hash}${ext}`;
	const targetPath = config.outputFolder("assets", assetFolder, targetName);
	await createFile(targetPath, content);
	const fileUrl = `${config.baseUrl()}assets/${assetFolder}/${targetName}`;
	console.log(`Asset file created ${fileUrl}`);
	return fileUrl;
}
