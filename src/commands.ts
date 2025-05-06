import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyImages, createSiteFromContent } from './build-files.ts';
import config, { loadConfig } from "./config.ts";
import { generateHtmlForTree } from './content-conversion.ts';
import { copyTo, createFolderIfRequired, getFileTree, pathRelativeToProcess } from './files.ts';
import * as logs from "./logs.ts";

export async function build(configFile?: string): Promise<void> {
	await loadConfig(configFile);

	logs.start("Reading source files");
	const tree = await getFileTree(config.sourceFolder(), { excludeEmptyFolders: true });
	logs.start("Converting Markdown to HTML");
	const contentTree = await generateHtmlForTree(tree);
	logs.start("Creating target files");
	await createSiteFromContent(contentTree);
	logs.start("Copying images folder");
	await copyImages();
	
	logs.logShrimplySuccess("Build complete");
	logs.info(`Check ${config.outputFolder()}`);
}

export async function init(targetDirectory: string | undefined): Promise<void> {
	logs.start("Creating project files");

	if (targetDirectory) {
		logs.info("If target directory does not exist it will be created");
		await createFolderIfRequired(pathRelativeToProcess(targetDirectory));
	}

	const destination = targetDirectory || "";
	const __dirname = dirname(fileURLToPath(import.meta.url));

	await copyTo(
		path.resolve(__dirname, "../shromp.toml"),
		pathRelativeToProcess(destination, "shromp.toml")
	);
	await copyTo(
		path.resolve(__dirname, "../default-theme"),
		pathRelativeToProcess(destination, "default-theme")
	);
	await copyTo(
		path.resolve(__dirname, "../docs"),
		pathRelativeToProcess(destination, "docs")
	);

	logs.logShrimplySuccess("Project files created");
	logs.info("- Check shromp.toml for config.");
	logs.info("- Run `shromp build` to generate HTML files");
}
