import path from "node:path";
import config from "./config.ts";
import { createFile, generateHashForContent, listFilesInDir, readFileContent } from "./files.ts";

export interface SiteAssets {
	styles: string[];
	scripts: string[];
}

export async function compileSiteAssets(): Promise<SiteAssets> {
	console.log("Compiling assets");
	return {
		styles: await createTargetAssetsWithHash("styles"),
		scripts: await createTargetAssetsWithHash("scripts"),
	}
}

async function createTargetAssetsWithHash(assetFolder: "styles" | "scripts"): Promise<string[]> {
	const files = await listFilesInDir(config.siteAssetsFolder(assetFolder));

	return Promise.all(files.map(async (file: string) => {
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
	}));
}
