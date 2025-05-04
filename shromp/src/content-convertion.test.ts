import { describe, it, afterEach } from 'node:test';
import * as assert from "node:assert";
import { DirNode } from './files.ts';
import { createRequire } from 'node:module';
import { generateHtmlForTree } from './content-convertion.ts';

const require = createRequire(import.meta.url);
const mockFs = require("mock-fs");

describe('content', () => {
	afterEach(() => {
		mockFs.restore();
	});

	describe("#generateHtmlForTree", () => {
		it('returns content transpiled to HTML', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: false,
				children: [
					{
						name: 'somefile',
						path: 'docs/somefile.md',
					},
				]
			};

			mockFs({
				'./docs': { 'somefile.md': '# Some File\n with content' },
			});

			const expectedContentTree = {
				title: 'docs',
				pathSection: 'docs',
				htmlContent: null,
				anchors: [],
				nestedContent: [{
					title: 'Some File',
					pathSection: 'somefile',
					htmlContent: '<h1 id="aid-some-file">Some File</h1>\n<p> with content</p>\n',
					anchors: [],
					nestedContent: [],
					isIndex: false,
					template: undefined,
				}],
				isIndex: false,
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('returns H1 as title and H2s as anchors', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: false,
				children: [
					{
						name: 'somefile',
						path: 'docs/somefile.md',
					},
				]
			};

			mockFs({
				'./docs': { 'somefile.md': '# Some File\n with content\n## A secondary title\n## Another secondary title' },
			});

			const expectedContentTree = {
				title: 'docs',
				pathSection: 'docs',
				htmlContent: null,
				isIndex: false,
				anchors: [],
				nestedContent: [{
					title: 'Some File',
					pathSection: 'somefile',
					htmlContent: '<h1 id="aid-some-file">Some File</h1>\n'+
						'<p> with content</p>\n'+
						'<h2 id="aid-a-secondary-title">A secondary title</h2>\n'+
						'<h2 id="aid-another-secondary-title">Another secondary title</h2>\n',
					anchors: [
						{ id: 'aid-a-secondary-title', name: 'A secondary title', level: 2 },
						{ id: 'aid-another-secondary-title', name: 'Another secondary title', level: 2 },
					],
					nestedContent: [],
					isIndex: false,
					template: undefined,
				}]
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('returns index content as directory content', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFs({
				'./docs': { 'index.md': '# Doc index File\n with content\n## A secondary title\n## Another secondary title' },
			});

			const expectedContentTree = {
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="aid-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n'+
					'<h2 id="aid-a-secondary-title">A secondary title</h2>\n'+
					'<h2 id="aid-another-secondary-title">Another secondary title</h2>\n',
				anchors: [
					{ id: 'aid-a-secondary-title', name: 'A secondary title', level: 2 },
					{ id: 'aid-another-secondary-title', name: 'Another secondary title', level: 2 },
				],
				nestedContent: [],
				isIndex: true,
				template: undefined,
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('uses node name as title when content has no heading', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: false,
				children: [
					{
						name: 'somefile',
						path: 'docs/somefile.md',
					},
				]
			};

			mockFs({
				'./docs': { 'somefile.md': 'Some file with no heading' },
			});

			const expectedContentTree = {
				title: 'docs',
				pathSection: 'docs',
				htmlContent: null,
				anchors: [],
				nestedContent: [{
					title: 'somefile',
					pathSection: 'somefile',
					htmlContent: '<p>Some file with no heading</p>\n',
					anchors: [],
					nestedContent: [],
					isIndex: false,
					template: undefined,
				}],
				isIndex: false,
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('uses custom title from metadata', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFs({
				'./docs': { 'index.md': '<!--\ntitle: Banana\n-->\n# Doc index File\n with content' },
			});

			const expectedContentTree = {
				title: 'Banana',
				pathSection: 'docs',
				htmlContent: '<h1 id="aid-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				anchors: [],
				nestedContent: [],
				isIndex: true,
				template: undefined,
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('does not include anchors for headers above max navigation defined in metadata', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFs({
				'./docs': { 'index.md': '<!--\nheadings-nav-max-level: 2\n-->\n# Index File\n with content\n## include \n### do not include' },
			});

			const expectedContentTree = {
				title: 'Index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="aid-index-file">Index File</h1>\n'+
					'<p> with content</p>\n' +
					'<h2 id="aid-include">include</h2>\n'+
					'<h3 id="aid-do-not-include">do not include</h3>\n',
				anchors: [
					{ id: 'aid-include', name: 'include', level: 2 },
				],
				nestedContent: [],
				isIndex: true,
				template: undefined,
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('sets template prop via metadata', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFs({
				'./docs': { 'index.md': '<!--\ntemplate: test-template\n-->\n# Doc index File\n with content' },
			});

			const expectedContentTree = {
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="aid-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				anchors: [],
				nestedContent: [],
				isIndex: true,
				template: "test-template",
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});
	});
});
