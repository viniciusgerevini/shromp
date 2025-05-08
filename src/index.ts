#!/usr/bin/env node
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { build, init } from './commands.ts';
import { fileExists, readFileContent } from './files.ts';
import * as logs from "./logs.ts";

async function getPackageVersion(): Promise<string> {
	try {
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const version =  JSON.parse(
			await readFileContent(path.resolve(__dirname, "../package.json"))
		).version;

		return version;
	} catch (e) {
		return "";
	}
}

program
	.name("shromp")
	.description("A chill static docs/site generator")
	.version(await getPackageVersion());

program
	.command("init")
	.description("Initialize a shromp project with boilerplate files.")
	.option("-d, --directory <path>", "target directory")
	.action(async (options) => {
		try {
			await init(options.directory);
		} catch (e: any) {
			program.error(e.message);
		}
	});

program
	.command("build")
	.description("build files")
	.option("-c, --config <path to shromp.toml>", "shromp config file")
	.option("-v, --version <string>", "Overrides version_to_publish property from shromp.toml")
 	.action(async (options) => {
		if (options.config && !fileExists(options.config)) {
			logs.error(`Config file ${options.config} does not exist`);
			program.error("");
		}
		try {
			await build(options.config);
		} catch(e: any) {
			logs.error(e.message);
			program.error("");
		}
	});

program.parse();
