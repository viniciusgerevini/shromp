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
			};

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});
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
			}],
			isIndex: false,
		};

		const contentTree = await generateHtmlForTree(fileTree);

		assert.deepEqual(contentTree, expectedContentTree);
	});
});
