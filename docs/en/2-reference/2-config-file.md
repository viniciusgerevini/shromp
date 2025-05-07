# shromp.toml


| Property | Description |
|--50%--|----50%-----|
|`base_url`| Overwrite base URL for assets. Useful when hosting files in any location other than the root.<br/> Default: "/"|
|`source_folder`| Folder where the source markdown files are located<br/>Default: `./docs/` |
|`output_folder`| Folder where the generated HTML files should be saved<br/>Default: `./public/` |
|`theme_folder`| Folder where site theme handlebars templates are located<br/>Default: `./default-theme/` |
|`default_page_template`| Default template used for pages<br/>Default: `page` |
|`generate_doc_index`| Can disable doc index generation even when index.md is present<br/>Default: `false` |
|`enable_versions`| Include version in the URL<br/>Default: `true` |
|`version_to_publish`| Documentation version (files will be nested in this folder)<br/>Default: `1.0.0` |
|`enable_locales`| When enabled the first folder level are the locales roots and each locale root has independent navigation<br/>Default: `true` |
|`default_locale`| Default site locale. Used in doc index and when enable locales is disabled<br/>Default: `en` |

