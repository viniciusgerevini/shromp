/**
 * Handle Handlebars templates and helpers.
 */
import path from "path";
import Handlebars from "handlebars";

import config from "./config.ts";
import { fileExists, listFilesInDir, readFileContent } from "./files.ts";

export default async function templates() {
  await registerHelpers();
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

async function registerHelpers() {
	const helperImportPath = config.templatesFolder("helpers.js");

	if (!fileExists(helperImportPath)) {
		return;
	}

	const helpers = await import("../" + helperImportPath);

	for (let key in helpers) {
		if (typeof helpers[key] === "function") {
			console.log("Registering template helper:", key);
			Handlebars.registerHelper(key, helpers[key]);
		}
	}
}
