import { program } from 'commander';
import { build, init } from './commands.ts';
import { fileExists } from './files.ts';

program
	.name("shromp")
	.description("A chill docs/static site generator")
	.version("0.0.1"); // TODO check how to define this based on package.json

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
 	.action(async (options) => {
		if (options.config && !fileExists(options.config)) {
			program.error(`Error: Config file ${options.config} does not exist`);
		}
		try {
			await build(options.config);
		} catch(e: any) {
			program.error(e.message);
		}
	});

program.parse();
