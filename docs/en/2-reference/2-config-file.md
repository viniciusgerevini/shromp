# shromp.toml


| Property |Default | Description |
|-- 20%  --|-- 20% -|-----60%-----|
|`base_url`| Default: "/"| Overwrite base URL for assets. Useful when hosting files in any location other than the root. |
|`source_folder`| Default: "./docs/" | Folder where the source markdown files are located |
|`output_folder`| Default: "./public/" | Folder where the generated HTML files should be saved |
|`theme_folder`| Default: "./default-theme/" | Folder where site theme handlebars templates are located |
|`default_page_template`| Default: "page" | Default template used for pages |
|`generate_doc_index`| Default: false | Can disable doc index generation even when index.md is present |
|`enable_versions`| Default: true | Include version in the URL |
|`version_to_publish`| Default: "1.0.0" | Documentation version (files will be nested in this folder) |
|`enable_locales`| Default: true | When enabled the first folder level are the locales roots and each locale root has independent navigation |
|`default_locale`| Default: "en" | Default site locale. Used in doc index and when enable locales is disabled |

