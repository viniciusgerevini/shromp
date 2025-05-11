/**
 * This is an example of an asset pipeline file.
 *
 * This file should have a method as default export, which will receive
 * the asset content and should return either the modified content, or
 * false, if original content should be kept.
 *
 * - content: content string
 * - assetType: 'style', 'script'
 * - filePath: original asset file path
 *
 * Note: images are not supported at the moment.
 */
export default function processAsset(content, assetType, filePath) {
	//console.log("Processing ", filePath);
	//
	//if (assetType === 'style') {
	//	// do style stuff, like post-css
	//} else {
	//	// do js stuff
	//}
	//
	//console.log("Content: " + content.slice(0, 10));

	return false; // returning false for skipping processing
}
