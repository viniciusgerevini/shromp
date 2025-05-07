# Docs (a.k.a content files)

The `docs/` folder hold your source files. Those files should be written in `markdown`, and the file structure is mirrored to the `public/` folder. For example, the file `docs/en/1.0.0/introduction/index.md` will be avaialable as `public/en/1.0.0/introduction/index.html`.

## Locale and versioning

By default, both locale and versioning are enabled. This means the second folder level will represent the locale (language) and the third folder level is the version. They can be disabled individually according to your needs in the `shromp.toml` file.

### Locales and versions disabled

If both `enable_locales` and `enable_versions` are set to false, the site will work as a regular static site. In this case, there is not special file structure, the site will start from the root folder. The structure might look  something like this:

```text
- docs/
   tutorials/
       how-to-build-stuff.md
       ...
   about.md
   index.md
```
This will translate to:
```text
- public/
    tutorials/
        how-to-build-stuff.html
        ...
    about.html
    index.html
```

### Locales enabled

If `enable_locales` is true, the first folder level after the root will represent the locale/language for the site. For instance:

```text
- docs/
    en/
        index.md
    pt-BR/
        index.md
```

In this case, the root `docs/` folder will usually not contain any files, and each inner folder will have docs for a given language.

Each locale folder has its own navigation structure (more about this in the next section) which might or might not be the same. Even though it's not a requirement for them to match, it's interesting to keep the same file structure and names, so when switching languages the redirect will land in the right page instead of a not found page.

### Versioning enabled

When `enable_versions` is true, a version folder will be created (as first level if `enable_locales` is disabled, and inside the locales folders if enabled).

The docs structure don't change, only the `public/` files. For example, for the following `docs/` structure

```text
- docs/
    en/
        index.md
    pt-BR/
        index.md
```

When running build for version `2.0`, the `public/` folder will look like this:

```text
- public/
    en/
        2.0/
            index.html
    pt-BR/
        2.0/
            index.html
```

Note that the public folder is never cleaned up. This allows older versions to remain unchanged. So let's say you add an `about.md` file to your english docs and run the build for version `2.1`. Your public folder will look like this:

```text
- public/
    en/
        2.0/
            index.html
        2.1/
            about.html
            index.html
    pt-BR/
        2.0/
            index.html
        2.1/
            index.html
```

You can set the current version for your docs in the `version_to_publish` setting in `shromp.toml`, or by passing it as property to the build command, like this:

```shell

shromp build --version 2.0

```

You can also generate files for a single locale by passing it with the `--locale, -l` flag.

When versioning is enabled, a `versions.json` file is also created in the `public/` root with all versions present in the `public/` folder at the time of build. This is useful so all doc versions can dynamically load versions. This is how the version selector at the top of this page works.

### Root page

As I mentioned before, usually when using versions and/or locales, there are no files in the root. This is because usually you would have your regular website, and then send it to your default locale.

However, it's a big assumption this is the most common case, and you might prefer to provide an index or a simple redirect when people access your doc's root directly.

To do that, add an `index.md` to your `docs/` root, and make sure the option `generate_doc_index` is set to true in your `shromp.toml` file.

The reason this option exists is because the `docs/` root is shared among versions, so when fixing older docs you might want to avoid replacing the newest version.

## Folder structure and navigation

You might have noticed the left-hand side menu in this page. The data for this menu is generated when building the pages and exposed to the template files so a menu like this can be built (more about this in the [theme](./2-theme.md) section).

The navigation order is defined using the order in the file system, which is alphabetically sorted by default. For convenience, you can prefix your files with a number, which will be removed when creating the public path, but will allow you to keep the navigation structure as you wish. Here is an example

```text
- docs/
    en/
        1.0/
            1-intro.md
            2-about.md
            3-guides/
                1-first.md
                1-second.md
                index.md
```

This will generate the following navigation:
```text
    - intro (/en/1.0/intro.html)
    - about (/en/1.0/about.html)
        - guides (/en/1.0/guides/index.html)
            - first (/en/1.0/guides/first.html)
            - second (/en/1.0/guides/second.html)
```

Note that neither the locale or version is included in the navigation tree. This is because each locale has it's own tree, and versions are like a "path" variable, which should be navigated via other index.

## Link reference

Shromp handles links between markdowns correctly. For example, this file:

```markdown

This is a [link](../2-reference/1-CLI.md).

```
Will generate:

```html

This is a <a href="/en/1.0/reference/CLI.html">link</a>

```
There is no need for mental gymnastics when linking files. We have you covered.

## Images

It's not uncommon for docs and pages to have images. To keep things simple, please put any image in the `docs/assets/images/` folder. At the moment, shromp will just copy these files to `public/assets/images/` as is.

I'm still debating if I should create any form of image optimisation pipeline, but this seems like a lot of complexity and maybe better handled beforehand with your own tooling.

As with links, the reference to the images will also be updated correctly, so they should work both when viewing the markdown file and the page.

### Centering images

Markdown, being focused on content, does not provide many "styling" features. However, centering an image is a very common use-case. Because of that, there is a convenience patter you can use. When adding images to your markdown file, you can add a query parameter to get it centered, like this:

```markdown

![alt text](../assets/images/my_image.png?center)

```

Shromp will translate this to:

```html

<img src="/assets/images/my_image.png" class="img-center" />

```
You can now center your image using the `img-center` class.

For now this is the only styling feature available. If you have ideas, suggestions or comments, feel free to open a discussion on Github.

## Metadata

You can pass metadata to be used in your templates by adding a metadata section at the top of your markdown file, like this:

```markdown
<!--
template: custom_template
custom_metadata: something
--!>
# My Page

...
```
I cover usage and the built-in options, like `template` and `page_title`, in detail in the [theme](./2-theme.md) section. From a content point of view, you can define any custom metadata by following the format above: `metadata_name: value`. Each line should contain only one property. This data will be available as a `metadata` object in your Handlebars template.

## Markdown extra capabilities

Shromp supports regular and Github markdown. It also includes the [extended tables](https://github.com/calculuschild/marked-extended-tables) package, which add some extra table features, such as:

Merging columns and rows:

```markdown

| H1      | H2      | H3      |
|---------|---------|---------|
| This cell spans 3 columns |||

```

| H1      | H2      | H3      |
|---------|---------|---------|
| This cell spans 3 columns |||


```markdown

| H1           | H2      |
|--------------|---------|
| This cell    | Cell A  |
| spans three ^| Cell B  |
| rows        ^| Cell C  |

```

| H1           | H2      |
|--------------|---------|
| This cell    | Cell A  |
| spans three ^| Cell B  |
| rows        ^| Cell C  |

```markdown

| This header spans two   || Header A |
| columns *and* two rows ^|| Header B |
|-------------|------------|----------|
| Cell A      | Cell B     | Cell C   |

```

| This header spans two   || Header A |
| columns *and* two rows ^|| Header B |
|-------------|------------|----------|
| Cell A      | Cell B     | Cell C   |

and ability to define column's width:

```markdown

|Column One|Column Two|Column Three|
|--10%-----|-- 40% ---|:---50%-----|

```

|Column One|Column Two|Column Three|
|--10%-----|-- 40% ---|:---50%-----|



