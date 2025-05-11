<!--
nav_max: 1
-->
# Site info (shromp-site.toml)

Site info file. Holds basic info about the site.

Should be located at `<content_folder>/shromp-site.toml`.

The data from this file will be available to the theme templates as `site`.


## Properties

| Property | Description |
|--50%--|----50%-----|
|`title`| Site title. Themes will use this appended to the page title and in OG meta tags.|
|`description`| Site description. Themes will use this in the description meta tag.<br/>Pages can override this by setting `description` in the metadata. |
|`keywords`| Site keywords. Themes will use this in the keywords meta tag.<br/>Pages can override this by setting `keywords` in the metadata. |
|`image`| Site image. Themes will use this for the social thumbnail.<br/>If you use an image name from the assets folder, it will use the correct hashed URL. If you use a full path, it will be used as-is.<br/>Pages can override this by setting `page_image` as metadata|
|`url`| Site URL. Themes can use this for the social info.|
|`[locales.<locale>]`| Section that allows override any of the info above for a given locale.|

Besides the properties above, any other property you include in this file will be available inside the `site` object in the templates.

## Example

```toml
title = "Shromp"
description = "A chill static site/docs generator that shrimply works"
keywords="site generator,static site"
image = "icon.png"
url="https://thisisvini.com/shromp"

[locales.es]
title = "El camarón"
description = "same thing, but in spanish"

[locales.pt_BR]
description = ""

```

Notes:
- The locales section is optional
- All properties are optional. There is no fallback if they are not defined.
- Options not included in the `[locales.es]` locale section will use the value from the default definition.
