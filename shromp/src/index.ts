import { generateHtmlForTree } from './content-convertion.ts';
import { getFileTree } from './files.ts';
import { copyImages, createSiteFromContent } from './build-files.ts';

import config from "./config.ts";

try {
	console.log("===== Reading source files =====");
	const tree = await getFileTree(config.sourceFolder(), { excludeEmptyFolders: true });
	console.log("===== Converting Markdown to HTML =====");
	const contentTree = await generateHtmlForTree(tree);
	console.log("===== Creating pages =====");
	await createSiteFromContent(contentTree);
	console.log("===== Copying images folder. =====");
	await copyImages();
	console.log("===== Process complete. =====");
	console.log(`Check ${config.outputFolder()}`);
} catch (err) {
	console.error(err);
}

// TODO:
// - make shromp a CLI tool.
//     - change .env to be a shromp-config.json (or cjson? or toml?)
//     - index accept args
//     - cli options
//        - init (generate files shrom-config, shromp-theme)
//        - eject (? maybe. Expose shromp files)
//        - build -- version-to-publish
// - breadcrumbs example
// - brand default-theme as shromp
