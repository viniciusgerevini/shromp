import { copyImages, createSiteFromContent } from './build-files.ts';
import config, { loadConfig } from "./config.ts";
import { generateHtmlForTree } from './content-conversion.ts';
import { getFileTree } from './files.ts';
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
		console.log("\n🦐🦐🦐🦐 Process complete 🦐🦐🦐🦐\n");
		console.log(`Check ${config.outputFolder()}`);
	} catch (e) {
		progressReporter.error()
		throw e;
	}
}
