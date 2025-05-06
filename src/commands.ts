import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyImages, createSiteFromContent } from './build-files.ts';
import config, { loadConfig } from "./config.ts";
import { generateHtmlForTree } from './content-conversion.ts';
import { copyTo, createFolderIfRequired, getFileTree, pathRelativeToProcess } from './files.ts';
import * as progressReporter from './progress-reporter.ts';

export async function build(configFile?: string): Promise<void> {
	await loadConfig(configFile);

	try {
		progressReporter.init("Reading source files");
		const tree = await getFileTree(config.sourceFolder(), { excludeEmptyFolders: true });
		progressReporter.success();
		progressReporter.start("Converting Markdown to HTML");
		const contentTree = await generateHtmlForTree(tree);
		progressReporter.success();
		progressReporter.start("Creating pages");
		await createSiteFromContent(contentTree);
		progressReporter.start("Copying images folder");
		await copyImages();
		progressReporter.success();
		
		progressReporter.logShrimplySuccess("Build complete");
		progressReporter.log(`Check ${config.outputFolder()}`);
	} catch (e) {
		progressReporter.error()
		throw e;
	}
}

export async function init(targetDirectory: string | undefined): Promise<void> {
	try {
		progressReporter.init("Creating project files");

		if (targetDirectory) {
			progressReporter.start("Target directory does not exist. Creating it");
			await createFolderIfRequired(pathRelativeToProcess(targetDirectory));
			progressReporter.success();
		}
		progressReporter.start("Creating project files");

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

		progressReporter.success();
		progressReporter.logShrimplySuccess("Project files created");
		progressReporter.log("- Check shromp.toml for config.");
		progressReporter.log("- Run `shromp build` to generate HTML files");
	} catch (e: any) {
		progressReporter.error()
		throw e;
	}
}
