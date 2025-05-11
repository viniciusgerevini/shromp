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

type PipelineAssetType = 'style' | 'script';

export type PipelineFunction = (content: string, type: PipelineAssetType, path: string) => Promise<string | false>;

let pipeline: PipelineFunction;

export async function compileSiteAssets(): Promise<SiteAssets> {
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
	if (!pipeline) {
		await registerAssetPipeline();
	}

	const sourcePath = config.themeAssetsFolder(assetFolder, file);
	let content = await readFileContent(sourcePath);
	const processedContent = await pipeline(
		content,
		assetFolder === 'styles' ? 'style' : 'script',
		sourcePath,
	);

	if (processedContent !== false) {
		content = processedContent;
	}

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

export async function registerAssetPipeline() {
	const pipelinePath = config.assetPipelinePath();

	if (pipelinePath === "" || !fileExists(pipelinePath)) {
		pipeline = async () => false;
		return;
	}

	const pipelineImport = await import(pipelinePath);

	if (!pipelineImport.default) {
		logs.warn("Pipeline file exists, but does not export a default method");
		pipeline = async () => false;
		return;
	}

	pipeline = pipelineImport.default;
}

