# Themes and templates

While the `/docs` folder holds the content for the site, the `/theme` folder holds the layout. Shromp uses [Handlebars](https://handlebarsjs.com/) to organise and re-use layouts. 

## Configuring a theme

You can set your current theme configuration in the `shromp.toml` file, using the following properties:

- `theme_folder="./default-theme/"` -- folder where the theme is located
- `default_page_template="page"` -- default template to use

## Folder structure

The theme folder usually looks like this:

```text
- theme/
    assets/
        scripts/
            *.js
        styles/
            *.css
        images/
            *
    templates/
        partials/
            *.hbs
        *.hbs
        helpers.js
    shromp-theme.toml
```

I'll explain each one of these items in the next sections.

## shromp-theme.toml

This file should be in the root of your theme. It hold theme specific configuration:

| Property | Description |
|--50%--|----50%-----|
| `default_template` | Default template to use for content with custom template not set.<br/>Default: `page` |

## Templates

Check the [Handlebars documentation](https://handlebarsjs.com/guide/) for syntax and features. Usually a handlebars file looks like this:

```hbs
<ul class="people_list">
  {{#each people}}
    <li>{{this}}</li>
  {{/each}}
</ul>
```
### Partials

> Handlebars allows for template reuse through partials. Partials are normal Handlebars templates that may be called directly by other templates.

In Shromp, partials should be defined in the `<theme>/templates/partials/` folder. To use a partial, just include `{{ > partial_name }}` to your template file. Here is an example with a page that re-uses header, footer and side navigation:

```hbs
{{> header }}
{{> side-navigation }}
<main class="content page-doc with-menu" role="main">
	{{{ mainContent }}}
</main>
{{> footer }}
```

Check the [partials documentation](https://handlebarsjs.com/guide/partials.html) for more features.

### Helpers

> Helpers can be used to implement functionality that is not part of the Handlebars language itself.

Shromp allows you to define custom headers by including them in the `<theme>/templates/helpers.js` file. Just implement and export the function and it will be available as a helper with same name. For example:

The helper definition:

```javascript
// Helper to return the "current" class when the navigation link refers to the
// current file
export function getNavClassWhenCurrent(navLink, currentFile) {
	return navLink === currentFile ? "current" : "";
};
```

In the template, you can use the helper like this:

```hbs
<ul>
  {{#each links}}
      <li class="nav-item {{getNavClassWhenCurrent path @root.currentFilePath}}">
           <a href="{{path}}">{{title}}</a>
      </li>
  {{/each}}
</ul>
```
The result will be:

```html
<ul>
  <li class="nav-item">
    <a href="/another-page">Another page</a>
  </li>
  <li class="nav-item current">
    <a href="/this-page">This page</a>
  </li>
  <li class="nav-item">
    <a href="/another-page">Another page</a>
  </li>
</ul>
```

Check the Handlebar's [helpers documentation](https://handlebarsjs.com/guide/expressions.html#helpers) for more examples and features.

### Data available in the templates

Shromp provides a way for you to send metadata from your markdown content to your template by using the metadata block, as describe on the [/docs folder documentation](./1-docs.md#metadata).

Some of this data is used to configure the template, but you can also pass custom data. To define metadata in your page, create a comment block as the first thing in your markdown file. This block should contain one property per line. Here is an example:

```markdown
<!--
page_title: This is a custom title
template: custom_template
nav_max: 3
hidden: true
this_is_a_custom_metadata: custom value
another_custom_metadata: 123
custom_flag_option
-->
# Page's title
...
```

#### Template configuration metadata

| Metadata      |   Description    |
|---40%---|---70%---|
|`template: <template_name>`| Define which template to use for this content. When omitted, the default template will be used|
|`page_title: <text>`| By default, the page title is the first H1 in your markdown document. You can use this property to override that value. For example, your main heading might be "Getting started", but you want your page title to be "Introduction".|

#### Navigation menu metadata

The next section will cover which data is made available to your template by default. One of the most useful one is the `navigationMenu`, which can be used to build your site's navigation and breadcrumbs.

The navigationMenu has the following contract:

``` typescript
interface NavigationLink {
	title: string;
	path: string;
	level: number;
	children?: NavigationLink[];
}
```
Child pages and headings are nested, forming a navigation tree. For the following folder structure:
```text
- docs/
    en/
      1.0/
        1-intro/
            index.md
        index.md
```
THe result tree might look like this:

```javascript
{
  title: "Home page",
  path: "/en/1.0",
  level: 1,
  children: [
    {
      title: "Home page", // this is the page title
      path: "/en/1.0/index.html",
      children: [
        {
          title: "A H2 heading",
          path: "/en/1.0/another-page#sp-h2-heading",
          level: 2,
          children: [],
        },
        {
          title: "Intro page",
          path: "/en/1.0/intro.html",
          level: 1,
          children: [
            {
              title: "A H2 heading",
              path: "/en/1.0/intro.html#sp-h2-heading",
              level: 2,
              children: [
                {
                  title: "A H3 heading",
                  path: "/en/1.0/intro.html#sp-h3-heading",
                  level: 3,
                  children: [],
                },
              ],
            },
          ],
        }
      ]
    }
  ]
}
```

These metadata options are related to the navigation tree:

| Metadata | Description |
|--- 40% ---|--- 70% ---|
|`nav_max: <number>`| Max heading depth to include in the navigation. Default: 3. |
|`hidden: <boolean>`| Define whether this page should be included in the navigation tree at all. |


#### Custom metadata

Any other property in the metadata block is considered custom metadata and will be included in the `metadata` object in the template. Values are automatically converted, and if only a name is provided, the data is understood as a flag, having `true` as the default value.

```markdown
<!--
this_is_a_custom_metadata: custom value
another_custom_metadata: 123
custom_flag_option
-->
```

is available as:

```javascript
{
    this_is_a_custom_metadata: "custom_value",
    another_custom_metadata: 123,
    custom_flag_option: true,
}
```

#### Default data

Shromp makes some useful information available in the template root context by default.

| metadata | description |
|---40%---|---70%---|
| `pageTitle` | The title for the page. By default, it's the first H1 in your markdown document. It can be overriden by setting the `page_title` metadata in your source markdown file.|
| `mainContent` | This is the source file's markdown content converted to HTML.|
| `locale` | The content locale. |
| `version` | The content version, or undefined if versioning is disabled. |
| `currentFilePath` | The path the current file will be saved to. Usefull for helpers like the one in the previous helper example.|
| `navigationMenu` | A link tree that can be used to construct a navigation menu, like the one in this site.|
| `childLinks` | A tree of links hosted under this file's path. Usefull for building index pages.|
| `assets` | This is a list of assets file generated from the assets folder. More details in the next section.|
| `metadata`: | An object containing all metadata from this content, including custom defined values.|


#### Accessing data in the template

The data above is avaible in the root context in your template, which can be accessed either directly or using the `@root.` prefix.

Here is an example:

```hbs
<html locale="{{locale}}">
<head>
    <title>{{pageTitle}}</title>
</head>
<body>
  {{{mainContent}}}

  {{#if metadata.show_the_shrimp_train}}
    🦐🦐🦐🦐🦐🦐🦐🦐
  {{/if}}
</body>
</html>
```

## Assets

You can save your theme's assets in the `<theme>/assets` folder, either under `styles`, `scripts` or `images`.

Assets are copied to their respective folders at `<public>/assets/`. At the moment, the only processing done is generating a content hash to append to the filenames to prevent wrong caching.

These assets will be available in the `assets` variable in the template's root context, so they can be inserted in the page correctly. Here is an example:

```hbs
<html">
<head>
    <title>{{pageTitle}}</title>

    {{#each assets.styles}}
      <link rel="stylesheet" href="{{this}}" type="text/css"/>
    {{/each}}
</head>
<body>
  {{{mainContent}}}
  <footer>
    {{#each assets.scripts}}
      <script src="{{this}}" defer></script>
    {{/each}}
 </footer>
</body>
</html>
```
The `assets` variable properties are maps of the original file name and the public file path, to allow lookup for the original name. Sample object:

```javascript
// assets
{
  styles: {
    'main.css': '/assets/styles/main.6980c0c18e.css',
    'prism.css': '/assets/styles/prism.014b449a00.css'
  },
  scripts: {
    'main.js': '/assets/scripts/main.93cfb2886a.js',
    'prism.js': '/assets/scripts/prism.edb4f0d7bc.js'
  },
  images: {
    'favicon.ico': '/assets/images/favicon.daaed75b7a.ico'
  }
}
```

Sometimes you might want assets to be included in a given order (i.e a reset.css before the base.css). For that, you can either add them by name using the asset map, or use the same numbering pattern as the other content files: `0-reset.css`, `1-base.css`;

_Note: At the moment no further processing is done in the assets file, because it can get very complicated and opinionated. I'm still thinking on the best approach for this, but most likely it will be providing a way to modify the asset content before creation._

