/**
 * Handle Handlebars templates and helpers.
 */
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
	// Helper to return the initial state for the navigation menu, such as
	// which menu item should be expanded or not when loading the page
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
			return "loaded-expanded";
		}
		return "collapsed";
	});

	// Helper to return the "current" class when the navigation link refers to the
	// current file
	Handlebars.registerHelper("getNavClassWhenCurrent", function (navLink: string, currentFile: string) {
		return navLink === currentFile ? "current" : "";
	});

	// TODO maybe provide a way to define custom helpers at project level
}
