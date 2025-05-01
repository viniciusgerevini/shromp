import path from "path";
import Handlebars from "handlebars";

import config from "./config.ts";
import { listFilesInDir, readFileContent } from "./files.ts";

export default async function templates() {
  registerHelpers();
	await loadPartials();

	const templates: {[templateName: string]: HandlebarsTemplateDelegate} = {};

	return {
		async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
			if (!templates[templateName]) {
				templates[templateName] = Handlebars.compile(await readFileContent(config.templatesFolder(`${templateName}.hbs`)));
			}
			return templates[templateName];
		}
	}
}

async function loadPartials() {
	const files = await listFilesInDir(config.templatesFolder("partials"));

	for (let file of files) {
		if (path.extname(file) !== ".hbs") {
			continue;
		}
		const fileContent = await readFileContent(config.templatesFolder("partials", file));
		const partialName = path.basename(file, ".hbs");
		Handlebars.registerPartial(partialName, fileContent);
	}
}

function registerHelpers() {
	Handlebars.registerHelper("getNavCurrentState", (navLink: string, currentFile: string) => {
		// skip anchors as they can't be expanded
		if (navLink.includes("#")) {
			return "no-expand";
		}

		const navLinkWithoutIndex = navLink.replace("/index.html", "");
		const currentFileWithoutIndex = currentFile.replace("/index.html", "");

		if (currentFileWithoutIndex.split("/").length === 2) {
			return;
		}

		if (currentFileWithoutIndex.includes(navLinkWithoutIndex)) {
			return "expanded loaded-expanded";
		}
		return "collapsed";
	});

	Handlebars.registerHelper("getNavClassWhenCurrent", function (navLink: string, currentFile: string) {
		return navLink === currentFile ? "current" : "";
	});
}
