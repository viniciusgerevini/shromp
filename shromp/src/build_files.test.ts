import { describe, it, afterEach } from 'node:test';
// import * as assert from "node:assert";
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// const mockFs = require("mock-fs");

describe("Build Target files", () => {
	afterEach(() => {
	// 	mockFs.restore();
	});

	it.todo("creates navigation tree with all content");
	it.todo("generates assets with hashed name");

	it.todo("crates doc index when available");
	it.todo("does not create doc index when configuration is set to false");

	it.todo("create pages with right info and template");
	// info:
	// - right template (default when not set, or custom)
	// - right page title
	// - include all vars (mainContent, navigationmenu, locale, version, currentFilePath, childLinks, metadata);
	// - use templates
});
