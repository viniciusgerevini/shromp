import { describe, it, afterEach } from 'node:test';
import * as assert from "node:assert";
import { createFile, DirNode, generateHashForContent, getFileTree, listFilesInDir, pathRelativeToProcess, readFileContent } from './files.ts';

import mockFs from "mock-fs";

describe('files', () => {
	afterEach(() => {
		mockFs.restore();
	});

	describe("#getFileTree", () => {
		it('returns tree with directories and md files', async () => {
			mockFs({
				'./docs': {
					'en': {
						'somefile.md': 'file content',
						'somefolder': {
							'index.md': 'file content',
						},
					},
					'fr': {},
				},
			});

			const tree = await getFileTree("./docs");

			const expectedTree: DirNode = {
				name: 'docs',
				path: pathRelativeToProcess('./docs'),
				hasIndex: false,
				children: [
					{
						name: 'en',
						path: pathRelativeToProcess('docs/en'),
						hasIndex: false,
						children: [
							{
								name: 'somefile',
								path: pathRelativeToProcess('docs/en/somefile.md'),
							},
							{
								name: 'somefolder',
								path: pathRelativeToProcess('docs/en/somefolder'),
								hasIndex: true,
								children: [],
							},
						],
					},
					{
						name: 'fr',
						path: pathRelativeToProcess('docs/fr'),
						children: [],
						hasIndex: false,
					}
				]
			};

			assert.deepEqual(tree, expectedTree);
		});

		it('returns tree with sanitized names', async () => {
			mockFs({
				'./docs': {
					'1-en': {
						'1-somefile.md': 'file content',
						'2-somefolder': {
							'index.md': 'file content',
						},
					},
					'20-fr': {},
				},
			});

			const tree = await getFileTree("./docs");

			const expectedTree = {
				name: 'docs',
				path: pathRelativeToProcess('./docs'),
				hasIndex: false,
				children: [
					{
						name: 'en',
						path: pathRelativeToProcess('docs/1-en'),
						hasIndex: false,
						children: [
							{
								name: 'somefile',
								path: pathRelativeToProcess('docs/1-en/1-somefile.md'),
							},
							{
								name: 'somefolder',
								path: pathRelativeToProcess('docs/1-en/2-somefolder'),
								hasIndex: true,
								children: [],
							},
						],
					},
					{
						name: 'fr',
						path: pathRelativeToProcess('docs/20-fr'),
						hasIndex: false,
						children: [],
					}
				]
			};

			assert.deepEqual(tree, expectedTree);
		});

		it('returns only md files', async () => {
			mockFs({
				'./docs': {
					'1-somefile.md': 'file content',
					'2-somefile.txt': 'file content',
					'somefile.txt': 'file content',
					'someotherfile.md': 'file content',
				},
			});

			const tree = await getFileTree("./docs");

			const expectedTree = {
				name: 'docs',
				path: pathRelativeToProcess('./docs'),
				hasIndex: false,
				children: [
					{
						name: 'somefile',
						path: pathRelativeToProcess('docs/1-somefile.md'),
					},
					{
						name: 'someotherfile',
						path: pathRelativeToProcess('docs/someotherfile.md'),
					},
				]
			};

			assert.deepEqual(tree, expectedTree);
		});

		it('fails when error reading file sytem', async () => {
			mockFs({
				'./docs': {},
			});

			try {
				await getFileTree("./docs-2");
				assert.fail("Expected to fail");
			} catch (e: any) {
				assert.match(e.message, /^ENOENT.*/);
			}
		});

		it('excludes empty folders when excludeEmptyFolders option is true', async () => {
			mockFs({
				'./docs': {
					'en': {
						'somefile.md': 'file content',
						'somefolder': {},
					},
					'fr': {
						'somefolder': {
							'someOtherFolder': {},
						},
					},
				},
			});

			const tree = await getFileTree("./docs", { excludeEmptyFolders: true });

			const expectedTree = {
				name: 'docs',
				path: pathRelativeToProcess('./docs'),
				hasIndex: false,
				children: [
					{
						name: 'en',
						path: pathRelativeToProcess('docs/en'),
						hasIndex: false,
						children: [
							{
								name: 'somefile',
								path: pathRelativeToProcess('docs/en/somefile.md'),
							},
						],
					},
				]
			};

			assert.deepEqual(tree, expectedTree);
		});
	})

	describe("#readFileContent", () => {
		it("returns file content", async () => {
			const testFileContent ='this is the content of the test file';
			mockFs({
				'./docs': {
					'somefile.md': testFileContent,
				},
			});

			const result = await readFileContent("./docs/somefile.md");

			assert.equal(result, testFileContent);
		});

		it('fails when error reading file content', async () => {
			mockFs({
				'./docs': {},
			});

			try {
				await readFileContent("./docs/somefile.md");
				assert.fail("Expected to fail");
			} catch (e: any) {
				assert.match(e.message, /^ENOENT.*/);
			}
		});
	});

	describe("#createFile", () => {
		it("creates file and folders recursively", async () => {
			const testFileContent ='this is the content of the new test file';
			const filePath = "./docs-new/new_file.md";
			mockFs({
				'./docs': {},
			});

			await createFile(filePath, testFileContent)
			const result = await readFileContent(filePath);

			assert.equal(result, testFileContent);
		});
	});

	describe("#listFilesInDir", () => {
		it("returns all file names in directory", async () => {
			mockFs({
				'./docs': {
					'banana': 'some content',
					'apple': 'some content',
					'pineapple': 'some content',
				},
			});
			const files = await listFilesInDir("./docs");
			assert.deepEqual(files, ["apple", "banana", "pineapple"]);
		});
	});

	describe("#generateHashForContent", () => {
		it("generates a short hash for content", () => {
			assert.equal(generateHashForContent("content"), "e8eea478e0");
			assert.equal(generateHashForContent("content", 10), "e8eea478e010638d2b0a");
		});
	});
});
