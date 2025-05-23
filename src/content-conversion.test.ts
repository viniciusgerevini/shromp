import { describe, it, afterEach, beforeEach, mock, Mock } from 'node:test';
import * as assert from "node:assert";
import { DirNode, pathRelativeToProcess, readFileContent } from './files.ts';
import { ContentNode, generateHtmlForTree as generateHtmlForTreeOriginal } from './content-conversion.ts';
import config from './config.ts';

describe('Content conversion', async () => {
	let readFileContentMock: Mock<typeof readFileContent> = mock.fn();
	let generateHtmlForTree: typeof generateHtmlForTreeOriginal;

	const fileTsNamedExports = await import('./files.ts');
	let fileTsMock = mock.module("./files", {
		namedExports: {
			...fileTsNamedExports,
			readFileContent: readFileContentMock,
		},
	});

	beforeEach(async () => {
		({ generateHtmlForTree } = await import("./content-conversion.ts"));
	});

	afterEach(() => {
		fileTsMock.restore();
		readFileContentMock.mock.restore();
	});

	function testNode(content: Partial<ContentNode>): ContentNode {
		return {
				title: 'file',
				pathSection: 'file',
				htmlContent: null,
				anchors: [],
				doNotShowInNavigation: false,
				nestedContent: [],
				isIndex: false,
				metadata: {},
				template: undefined,
				...content,
				...(content.title && !content.pathSection ? { pathSection: content.title } : {}),
		};
	}

	const mockFileRead = (path: string, fileContent: string) => {
		readFileContentMock.mock.mockImplementation(async (filePath) => {
			if (filePath === pathRelativeToProcess(path)) {
				return fileContent;
			}
			throw new Error("Test file read not mocked!");
		});
	};

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
			const fileContent = '# Some File\n with content';

			mockFileRead("docs/somefile.md", fileContent);

			const expectedContentTree = testNode({
				title: 'docs',
				nestedContent: [testNode({
					title: 'Some File',
					pathSection: 'somefile',
					htmlContent: '<h1 id="sp-some-file">Some File</h1>\n<p> with content</p>\n',
				})],
			});

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

			mockFileRead(
				'docs/somefile.md',
				'# Some File\n with content\n## A secondary title\n## Another secondary title'
			);

			const expectedContentTree = testNode({
				title: 'docs',
				nestedContent: [testNode({
					title: 'Some File',
					pathSection: 'somefile',
					htmlContent: '<h1 id="sp-some-file">Some File</h1>\n'+
						'<p> with content</p>\n'+
						'<h2 id="sp-a-secondary-title">A secondary title</h2>\n'+
						'<h2 id="sp-another-secondary-title">Another secondary title</h2>\n',
					anchors: [
						{ id: 'sp-a-secondary-title', name: 'A secondary title', level: 2 },
						{ id: 'sp-another-secondary-title', name: 'Another secondary title', level: 2 },
					],
				})]
			});

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

			mockFileRead(
				'docs/index.md',
				'# Doc index File\n with content\n## A secondary title\n## Another secondary title'
			);

			const expectedContentTree = testNode({
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n'+
					'<h2 id="sp-a-secondary-title">A secondary title</h2>\n'+
					'<h2 id="sp-another-secondary-title">Another secondary title</h2>\n',
				anchors: [
					{ id: 'sp-a-secondary-title', name: 'A secondary title', level: 2 },
					{ id: 'sp-another-secondary-title', name: 'Another secondary title', level: 2 },
				],
				isIndex: true,
			});

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

			mockFileRead(
				'docs/somefile.md',
				'Some file with no heading'
			);

			const expectedContentTree = testNode({
				title: 'docs',
				nestedContent: [testNode({
					title: 'somefile',
					pathSection: 'somefile',
					htmlContent: '<p>Some file with no heading</p>\n',
				})],
			});

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

			mockFileRead(
				'docs/index.md',
				'<!--\npage_title: Banana\n-->\n# Doc index File\n with content'
			);

			const expectedContentTree = testNode({
				title: 'Banana',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				isIndex: true,
				metadata: { page_title: 'Banana' },
			});

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

			mockFileRead(
				'docs/index.md',
				'<!--\nnav_max: 2\n-->\n# Index File\n with content\n## include \n### do not include'
			);

			const expectedContentTree = testNode({
				title: 'Index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-index-file">Index File</h1>\n'+
					'<p> with content</p>\n' +
					'<h2 id="sp-include">include</h2>\n'+
					'<h3 id="sp-do-not-include">do not include</h3>\n',
				anchors: [
					{ id: 'sp-include', name: 'include', level: 2 },
				],
				isIndex: true,
				metadata: { nav_max: 2 },
			});

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

			mockFileRead(
				'docs/index.md',
				'<!--\ntemplate: test-template\n-->\n# Doc index File\n with content'
			);

			const expectedContentTree = testNode({
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				isIndex: true,
				template: 'test-template',
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('set doNotShowInNavigation via metadata', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'<!--\nhidden: true\n-->\n# Doc index File\n with content'
			);

			const expectedContentTree = testNode({
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				doNotShowInNavigation: true,
				isIndex: true,
				metadata: { hidden: true },
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it('allows setting custom metadata', async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'<!--\nsomething_else: value\nthis_should_be_true\n-->\n# Doc index File\n with content'
			);

			const expectedContentTree = testNode({
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> with content</p>\n',
				isIndex: true,
				metadata: { something_else: "value", this_should_be_true: true },
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});


		it("transforms links to target paths", async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'# Doc index File\n [another page](../01-page.md) [external link](https://thisisvini.com)\n' +
				'[link-with-anchor](../01-page.md#further-down)'
			);

			const expectedContentTree = testNode({
				title: 'Doc index File',
				pathSection: 'docs',
				htmlContent: '<h1 id="sp-doc-index-file">Doc index File</h1>\n'+
					'<p> <a href="../page.html">another page</a> <a href="https://thisisvini.com">external link</a>\n' +
					'<a href="../page.html#sp-further-down">link-with-anchor</a></p>\n',
				isIndex: true,
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it("transforms images paths to target folder", async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'![some image](../../../assets/images/image.png) ![image 2](/absolute.png)'
			);

			const expectedContentTree = testNode({
				title: undefined,
				pathSection: 'docs',
				htmlContent: `<p><img src="${config.baseUrl('/assets/images/image.png')}" alt="some image" /> <img src="${config.baseUrl('/absolute.png')}" alt="image 2"></p>\n`,
				isIndex: true,
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it("transforms images using path from asset map", async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'![some image](../../../assets/images/image.png)'
			);

			const contentImages = {
				"image.png": "/assets/images/content-with-hash.png",
			};

			const expectedContentTree = testNode({
				title: undefined,
				pathSection: 'docs',
				htmlContent: `<p><img src="${config.baseUrl(contentImages["image.png"])}" alt="some image" /></p>\n`,
				isIndex: true,
			});

			const contentTree = await generateHtmlForTree(fileTree, contentImages);

			assert.deepEqual(contentTree, expectedContentTree);
		});

		it("adds centralize styling to image when center parameter used", async () => {
			const fileTree: DirNode = {
				name: 'docs',
				path: './docs',
				hasIndex: true,
				children: []
			};

			mockFileRead(
				'docs/index.md',
				'![some image](../assets/image.png?center)'
			);

			const expectedContentTree = testNode({
				title: undefined,
				pathSection: 'docs',
				htmlContent: '<p><img src="/assets/image.png" alt="some image" class="img-center"/></p>\n',
				isIndex: true,
			});

			const contentTree = await generateHtmlForTree(fileTree);

			assert.deepEqual(contentTree, expectedContentTree);
		});
	});
});
