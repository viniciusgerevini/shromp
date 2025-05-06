import { program } from 'commander';
import { build } from './commands.ts';
import { fileExists } from './files.ts';

program
	.name("shromp")
	.description("A chill docs/static site generator")
	.version("0.0.1"); // TODO check how to define this based on package.json

program
	.command("init")
	.description("Initialize a shromp project with boilerplate files.")
	.action(() => {
		console.log("INIIIIT");
		//TODO: init (generate files shromp config, shromp-theme, docs folder with samples)
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
