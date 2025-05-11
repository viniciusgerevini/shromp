import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyImages, createSiteFromContent } from './build-files.ts';
import config, { loadConfig } from "./config.ts";
import { generateHtmlForTree } from './content-conversion.ts';
import { copyTo, createFolderIfRequired, getFileTree, pathRelativeToProcess } from './files.ts';
import * as logs from "./logs.ts";

export async function build(configFile: string, tag: string, outputFolder: string): Promise<void> {
	await loadConfig(configFile);

	config.setVersionToPublish(tag);
	config.setOutputFolder(outputFolder);

	logs.start("Reading source files");
	const tree = await getFileTree(config.sourceFolder(), { excludeEmptyFolders: true });
	logs.start("Copying content images");
	const contentImages = await copyImages();
	logs.start("Converting Markdown to HTML");
	const contentTree = await generateHtmlForTree(tree, contentImages);
	logs.start("Creating target files");
	await createSiteFromContent(contentTree);
	
	logs.logShrimplySuccess("Build complete");
	logs.info(`Your new files are at ${config.outputFolder()}`);
}

interface InitOptions {
	includeSampleContent: boolean;
}

export async function init(targetDirectory: string | undefined, options: InitOptions): Promise<void> {
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

	if (options.includeSampleContent) {
		await copyTo(
			path.resolve(__dirname, "../docs"),
			pathRelativeToProcess(destination, "docs")
		);
	} else {
		logs.warn("Skipping content copy because --no-content flag was provided.");
	}

	logs.logShrimplySuccess("Project files created");
	logs.info("- Check shromp.toml for config.");
	logs.info("- Run `shromp build` to generate HTML files");
}
