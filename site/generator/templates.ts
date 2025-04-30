import path from "path";
import Handlebars from "handlebars";

import config from "./config.ts";
import { listFilesInDir, readFileContent } from "./files.ts";

export default async function templates() {
	await loadPartials();

	const templates: {[templateName: string]: HandlebarsTemplateDelegate} = {};

	return {
		async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
			if (!templates[templateName]) {
				templates[templateName] = Handlebars.compile(await readFileContent(path.join(config.templatesFolder, `${templateName}.hbs`)));
			}
			return templates[templateName];
		}
	}
}

async function loadPartials() {
	const files = await listFilesInDir(path.join(config.templatesFolder, "partials"));

	for (let file of files) {
		if (path.extname(file) !== ".hbs") {
			continue;
		}
		const fileContent = await readFileContent(path.join(config.templatesFolder, "partials", file));
		const partialName = path.basename(file, ".hbs");
		Handlebars.registerPartial(partialName, fileContent);
	}
}

// function registerHelpers() {
	// Handlebars.registerHelper("sideNavigation", (links: any) {
	// 	console.log("links");
	// });
  // handlebars.registerHelper('fullUrl', (uri) => {
  //   return `${config.get('base_url')}${uri || ''}`
  // });
	//
  // handlebars.registerHelper('pagination', (currentPage, numberOfPages, base) => {
  //   if (numberOfPages < 2) {
  //     return ''
  //   }
  //   const baseUrl = base ? `${base}/` : '/'
  //   const link = (number) => number < 1 ? baseUrl: `${baseUrl}page/${number}`
  //   const links = []
  //   let prev = ''
  //   let next = ''
  //
  //   if (currentPage > 1) {
  //     prev = `<a class="prev" href="${link(currentPage - 1)}">&larr; Prev</a>`
  //   }
  //
  //   if (currentPage < numberOfPages) {
  //     next = `<a class="next" href="${link(currentPage + 1)}">Next &rarr;</a>`
  //   }
  //
  //   for (let i = 1; i < numberOfPages + 1; i++) {
  //     links.push(`<a class="${i === currentPage ? 'current' : ''}" href="${link(i)}">${i}</a>`)
  //   }
  //
  //   return `<nav class="pagination" role="navigation">${prev}<div class="page-nums">${links.join('')}</div>${next}</nav>`
  // });
  // handlebars.registerHelper('isodd', (value) => {
  //   return value % 2 !== 0;
  // });
// }
