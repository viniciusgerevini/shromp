import { describe, it, afterEach, beforeEach, mock, Mock } from 'node:test';
import * as assert from 'node:assert';
import mockFs from 'mock-fs';
import config, { loadConfig } from './config.ts';
import { fileExists } from './files.ts';
import * as assetsModule from './assets.ts';


describe('Assets', async () => {
	const filesModule = await import('./files.ts');
	// mock fs does not support cp :/
	let cpToMock: Mock<typeof filesModule.copyTo>;
	let createTargetAssetsWithHash: typeof assetsModule.createTargetAssetsWithHash;
	let filesMock: Mock<any>;

	cpToMock = mock.fn()
	cpToMock.mock.mockImplementation(async function(_from, _to): Promise<void> {});

	beforeEach(async () => {
		cpToMock = mock.fn()
		cpToMock.mock.mockImplementation(async function(_from, _to): Promise<void> {});

		filesMock = mock.module('./files.ts', {
			namedExports: {
				...filesModule,
				copyTo: async (from: string, to: string) => {
					await cpToMock(from, to);
				},
			},
		});

		({ createTargetAssetsWithHash } = await import('./assets.ts'));
	});

	afterEach(() => {
		mockFs.restore();
		filesMock.restore();
		cpToMock.mock.restore();
	});

	describe('#createTargetAssetsWithHash', () => {
		it('creates theme styles target with hash', async () => {
			mockFs({
				[config.themeAssetsFolder('styles', 'test.css')]: 'content 1',
				[config.themeAssetsFolder('styles', 'test2.css')]: 'content 2',
				[config.themeAssetsFolder('styles', 'test3.css')]: 'content 3',
			});

			const result = await createTargetAssetsWithHash('styles');

			assert.deepEqual(result, {
				'test.css': '/assets/styles/test.bea1859e35.css',
				'test2.css': '/assets/styles/test2.671a8c3fcc.css',
				'test3.css': '/assets/styles/test3.bc6789bd60.css',
			});

			for (let f of Object.values(result)) {
				assert.equal(fileExists(config.outputFolder(f)), true);
			}
		});

		it('creates theme scripts target with hash', async () => {
			mockFs({
				[config.themeAssetsFolder('scripts', 'test.js')]: 'content 1',
				[config.themeAssetsFolder('scripts', 'test2.js')]: 'content 2',
			});

			const result = await createTargetAssetsWithHash('scripts');

			assert.deepEqual(result, {
				'test.js': '/assets/scripts/test.bea1859e35.js',
				'test2.js': '/assets/scripts/test2.671a8c3fcc.js',
			});

			for (let f of Object.values(result)) {
				assert.equal(fileExists(config.outputFolder(f)), true);
			}
		});

		it('creates theme images target with hash', async () => {
			const imageContent1 = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
			const imageContent2 = Buffer.from([8, 6, 7, 6, 4, 1, 9]);

			mockFs({
				[config.themeAssetsFolder('images', 'test.png')]: imageContent1,
				[config.themeAssetsFolder('images', 'test2.png')]: imageContent2,
			});

			const result = await createTargetAssetsWithHash('images');

			assert.deepEqual(result, {
				'test.png': '/assets/images/test.cc5d61b405.png',
				'test2.png': '/assets/images/test2.ea000a0243.png',
			});

			assert.equal(cpToMock.mock.calls.length === 2, true);

			let calls = 0;
			for (let [fileName, outputPath] of Object.entries(result)) {
				assert.deepEqual(cpToMock.mock.calls[calls].arguments, [
					config.themeAssetsFolder('images', fileName),
					config.outputFolder(outputPath)
				]);
				calls += 1;
			}
		});

		it('creates content images target with hash', async () => {
			const imageContent1 = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
			const imageContent2 = Buffer.from([8, 6, 7, 6, 4, 1, 9]);

			mockFs({
				[config.sourceFolder('assets', 'images', 'test.png')]: imageContent1,
				[config.sourceFolder('assets', 'images', 'test2.png')]: imageContent2,
			});

			const result = await createTargetAssetsWithHash('content/images');

			assert.deepEqual(result, {
				'test.png': '/assets/content/images/test.cc5d61b405.png',
				'test2.png': '/assets/content/images/test2.ea000a0243.png',
			});

			assert.equal(cpToMock.mock.calls.length === 2, true)

			let calls = 0;
			for (let [fileName, outputPath] of Object.entries(result)) {
				assert.deepEqual(cpToMock.mock.calls[calls].arguments, [
					config.sourceFolder('assets', 'images', fileName),
					config.outputFolder(outputPath)
				]);
				calls += 1;
			}
		});


		it('returns empty when source folder not found', async () => {
			mockFs({});

			assert.deepEqual(await createTargetAssetsWithHash('styles'), {});
			assert.deepEqual(await createTargetAssetsWithHash('scripts'), {});
			assert.deepEqual(await createTargetAssetsWithHash('images'), {});
			assert.deepEqual(await createTargetAssetsWithHash('content/images'), {});
		});
	});

	describe('#compileSiteAssets', () => {
		let compileSiteAssets: typeof assetsModule.compileSiteAssets;

		beforeEach(async () => {
			({ compileSiteAssets } = await import('./assets.ts'));
		});

		it('compile all assets in theme', async () => {
			mockFs({
				[config.themeAssetsFolder('styles', 'test.css')]: 'content 1',
				[config.themeAssetsFolder('styles', 'test2.css')]: 'content 2',
				[config.themeAssetsFolder('scripts', 'test.js')]: 'content 1',
				[config.themeAssetsFolder('scripts', 'test2.js')]: 'content 2',
				[config.themeAssetsFolder('images', 'test.png')]: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
				[config.themeAssetsFolder('images', 'test2.png')]: Buffer.from([8, 6, 7, 6, 4, 1, 9]),
			});
			const result = await compileSiteAssets();

			assert.deepEqual(result, {
				styles: {
					'test.css': '/assets/styles/test.bea1859e35.css',
					'test2.css': '/assets/styles/test2.671a8c3fcc.css',
				},
				scripts: {
					'test.js': '/assets/scripts/test.bea1859e35.js',
					'test2.js': '/assets/scripts/test2.671a8c3fcc.js',
				},
				images: {
					'test.png': '/assets/images/test.cc5d61b405.png',
					'test2.png': '/assets/images/test2.ea000a0243.png',
				}
			});
		});

		it('returns empty when folder does not exist', async () => {
			mockFs({});
			const result = await compileSiteAssets();

			assert.deepEqual(result, {
				styles: {},
				scripts: {},
				images: {},
			});
		});
	});

	describe('asset pipeline', async () => {
		let assetPipelineModuleMock: Mock<any>;
		let pipelineMock: Mock<assetsModule.PipelineFunction>;
		let createTargetAssetsWithHash: typeof assetsModule.createTargetAssetsWithHash;
		let registerAssetPipeline: typeof assetsModule.registerAssetPipeline;

		beforeEach(async () => {
			await loadConfig();
			pipelineMock = mock.fn();

			assetPipelineModuleMock = mock.module(config.assetPipelinePath(), {
				defaultExport: (content: string, type: any, path: string) => {
					return pipelineMock(content, type, path);
				}
			});

			({ createTargetAssetsWithHash, registerAssetPipeline } = await import('./assets.ts'));

			await registerAssetPipeline();
		});

		afterEach(async () => {
			mockFs.restore();
			assetPipelineModuleMock.restore();
			pipelineMock.mock.restore();
			await registerAssetPipeline();
		});

		it('uses assets pipeline when import is defined', async () => {
			const originalContent = 'content 1';
			const sourceStyleFile = config.themeAssetsFolder('styles', 'test.css');
			const sourceScriptFile = config.themeAssetsFolder('scripts', 'test.js');

			pipelineMock.mock.mockImplementation(async () => {
				return "processed content";
			});

			mockFs({
				[sourceStyleFile]: originalContent,
				[sourceScriptFile]: originalContent,
			});

			const resultStyle = await createTargetAssetsWithHash('styles');
			const resultScript = await createTargetAssetsWithHash('scripts');
			// I'm being lazy here and instead of reading the content saved to match
			// the content passed, I'm just checking the hash of the file, which 
			// is also fine, given it should be reliable.
			assert.deepEqual(resultStyle, {
				'test.css': '/assets/styles/test.a2e3b23872.css',
			});
			assert.deepEqual(resultScript, {
				'test.js': '/assets/scripts/test.a2e3b23872.js',
			});
			assert.deepEqual(pipelineMock.mock.calls[0].arguments, [
				originalContent,
				'style',
				sourceStyleFile,
			]);
			assert.deepEqual(pipelineMock.mock.calls[1].arguments, [
				originalContent,
				'script',
				sourceScriptFile,
			]);

			assert.equal(fileExists(config.outputFolder(resultStyle['test.css'])), true);
			assert.equal(fileExists(config.outputFolder(resultScript['test.js'])), true);
		});

		it('uses original content when asset pipeline returns false', async () => {
			pipelineMock.mock.mockImplementation(async () => {
				return false;
			});

			mockFs({
				[config.themeAssetsFolder('styles', 'test.css')]: 'content 1',
			});

			const result = await createTargetAssetsWithHash('styles');

			assert.deepEqual(result, {
				'test.css': '/assets/styles/test.bea1859e35.css',
			});

			for (let f of Object.values(result)) {
				assert.equal(fileExists(config.outputFolder(f)), true);
			}
		});
	});
});
