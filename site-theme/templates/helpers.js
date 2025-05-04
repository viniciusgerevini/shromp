/**
*
* You can define custom Handlebars helpers in this file.
* Any method exported in this file will be available as a
* helper of same name in your hbs templates.
*
* For more info about helpers, check handlebars' docs
* https://handlebarsjs.com/guide/expressions.html#helpers
*
*/

// Helper to return the initial state for the navigation menu, such as
// which menu item should be expanded or not when loading the page
export function getNavCurrentState(navLink, currentFile) {
	// skip anchors as they can't be expanded
	if (navLink.includes("#")) {
		return "no-expand";
	}

	const navLinkWithoutIndex = navLink.replace("/index.html", "");
	const currentFileWithoutIndex = currentFile.replace("/index.html", "");

	if (currentFileWithoutIndex.split("/").length === 2) {
		return;
	}

	if (currentFileWithoutIndex.includes(navLinkWithoutIndex)) {
		return "loaded-expanded";
	}
	return "collapsed";
}

// Helper to return the "current" class when the navigation link refers to the
// current file
export function getNavClassWhenCurrent(navLink, currentFile) {
	return navLink === currentFile ? "current" : "";
};
