# Public folder

The public folder holds all generated files. It is never cleaned up, so you can keep old generated docs here, and also customise some other files, like `robots.txt` and `favicon.ico`.

## Structure

Usual structure:

```text
public/
  assets/
    styles/
    scripts/
    images/
  en/ -- generated content.
    ...
  index.html -- if docs root enabled
  versions.json -- if versions enabled
```

- If locales are enabled, generated files will be added to locale folders (i.e `en/`, `fr/`, `es/`).
- If versions are enabled, generated files will be nested under the version folder.
- If neither locales or versions are enabled, generated files will be placed in the `<public>` root.
- `assets/` contain asset files both from `<content>/` and `<theme>/` folders.
- `versions.json` contain an array with all versions detected when running `shrimp build`.


This public folder can be hosted as-is on any webserver, including Github Pages.
