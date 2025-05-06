/**
 * Handle Handlebars templates and helpers.
 */
import path from "path";
import Handlebars from "handlebars";

import * as logs from "./logs.ts";
import config from "./config.ts";
import { fileExists, listFilesInDir, readFileContent } from "./files.ts";

export interface TemplatesInstance {
	getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate>;
}

export default async function templates(): Promise<TemplatesInstance> {
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
	const partialsFolder = config.templatesFolder("partials");

	if (!fileExists(partialsFolder)) {
		return;
	}
	const files = await listFilesInDir(partialsFolder);

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

	const helpers = await import(helperImportPath);

	logs.start(`Registering template helpers`);
	for (let key in helpers) {
		if (typeof helpers[key] === "function") {
			Handlebars.registerHelper(key, helpers[key]);
			logs.success(`Template helper registered: ${key}`);
		}
	}
}
