<!--
nav_max: 1
-->
# Asset Pipeline

Asset pipelines can get very complicated and very opinionated. To keep things simple, the only processing Shromp does by default
is appending the content hash to the file name, to prevent cache issues.

To support more complex content processing, Shromp allows defining an asset pipeline file that can change the content of styles and scripts files before saving them.

You can define the path for this asset pipeline file in `shromp.toml`. It should be a javascript file and export a method following the contract bellow:

```javascript
export default function processAsset(content, assetType, filePath) {
	return "new content ";
}
```

The method receives the following arguments:
- `content`: The original content of the file
- `assetType`: either `style` or `script`. Images are not supported at the moment.
- `filePath`: path to the source file.

Return:

The method should return the new modified content. You can also return `false` to skip processing and use the original content.

## Example

Here is an example processing CSS files with postcss.

```javascript
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'


export default async function processAsset(content, assetType, filePath) {
  if (assetType === "style") {
    return postcss([autoprefixer])
      .process(content)
      .then(result =>  result.css);
  }
  return false; // skip processing for files other than styles
}
```
