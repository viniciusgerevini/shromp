import { describe, it, afterEach } from 'node:test';
import * as assert from 'node:assert';
import mockFs from 'mock-fs';
import config, { loadConfig } from './config.ts';
import { pathRelativeToProcess } from './files.ts';


describe('config', () => {
	afterEach(() => {
		mockFs.restore();
	});

	describe('load config from file', () => {
		it('loads config file', async () => {
			const shrompConfig =`
base_url="/shromp"
source_folder="../shromp-source/"
output_folder="../shromp-public/"
theme_folder="./shromp-theme/"
generate_doc_index=true
enable_versions=false
version_to_publish="shromp-version"
enable_locales=false
default_locale="shromp-locale"
anchor_prefix="pppp-"
`;

			mockFs({ './custom/shromp.toml': shrompConfig });

			await loadConfig('./custom/shromp.toml');

			assert.equal(config.baseUrl(), '/shromp');
			assert.equal(config.sourceFolder(), pathRelativeToProcess('../shromp-source/'));
			assert.equal(config.outputFolder(), pathRelativeToProcess('../shromp-public/'));
			assert.equal(config.templatesFolder(), pathRelativeToProcess('shromp-theme/templates'));
			assert.equal(config.themeAssetsFolder(), pathRelativeToProcess('shromp-theme/assets'));
			assert.equal(config.shouldGenerateDocIndex(), true);
			assert.equal(config.isVersioningEnabled(), false);
			assert.equal(config.areLocalesEnabled(), false);
			assert.equal(config.versionToPublish(), 'shromp-version');
			assert.equal(config.defaultLocale(), 'shromp-locale');
			assert.equal(config.anchorPrefix(), 'pppp-');
		});

		it('loads config from template config file', async () => {
			const shrompConfig =`
theme_folder="./shromp-theme/"
`;
			const shrompThemeConfig =`
default_template="banana"
`;

			mockFs({
				'./custom/shromp.toml': shrompConfig,
				'./shromp-theme/shromp-theme.toml': shrompThemeConfig,
			});

			await loadConfig('./custom/shromp.toml');

			assert.equal(config.defaultPageTemplate(), 'banana');
		});


		it('loads shromp.toml by default', async () => {
			mockFs({ './shromp.toml': 'base_url="/defo-from-shromp"' });

			await loadConfig();

			assert.equal(config.baseUrl(), "/defo-from-shromp");

		});

		it('ignores config file if file does not exist', async () => {
			try {
				await loadConfig('./this_file_definitely_doesnt_exist');
			} catch (e) {
				console.log(e);
				throw new Error("Should not fail when trying to load config from non existing file");
			}
		});

		it('fails if config file is in wrong format', async () => {
			mockFs({ './shromp.toml': '{$dsa==fs}' });
			try {
				await loadConfig('./shromp.toml');
				throw new Error("expected to fail");
			} catch (e) {
				console.log(e);
				assert.equal((e as Error).name, 'SyntaxError');
			}
		});
	});

	it('uses right defaults', async () => {
		// making sure config is clean by providing a file that does not exist
		await loadConfig("./some-file");

		assert.equal(config.baseUrl(), '/');
		assert.equal(config.sourceFolder(), pathRelativeToProcess('./docs/'));
		assert.equal(config.outputFolder(), pathRelativeToProcess('./public/'));
		assert.equal(config.templatesFolder(), pathRelativeToProcess('default-theme/templates'));
		assert.equal(config.themeAssetsFolder(), pathRelativeToProcess('default-theme/assets'));
		assert.equal(config.defaultPageTemplate(), 'page');
		assert.equal(config.shouldGenerateDocIndex(), false);
		assert.equal(config.isVersioningEnabled(), true);
		assert.equal(config.areLocalesEnabled(), true);
		assert.equal(config.versionToPublish(), '1.0.0');
		assert.equal(config.defaultLocale(), 'en');
		assert.equal(config.anchorPrefix(), 'sp-');
	});

	it('sets version', async () => {
		// making sure config is clean by providing a file that does not exist
		await loadConfig("./some-file");

		config.setVersionToPublish("anything");

		assert.equal(config.versionToPublish(), 'anything');
	});

	it('sets output folder', async () => {
		// making sure config is clean by providing a file that does not exist
		await loadConfig("./some-file");

		config.setOutputFolder("/another-one");

		assert.equal(config.outputFolder(), '/another-one');
	});


	it('joins paths correctly for path configs', async () => {
		// making sure config is clean by providing a file that does not exist
		await loadConfig("./some-file");
		
		assert.equal(
			config.templatesFolder("this", "should", "work"),
			pathRelativeToProcess("default-theme/templates/this/should/work"));
	});

	it('returns base url with subpaths', async () => {
		await loadConfig("./some-file");

		assert.equal(
			config.baseUrl("this", "should/", "work//"),
			"/this/should/work/"
		);
	});
});
