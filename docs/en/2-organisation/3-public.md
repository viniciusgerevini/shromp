# Public folder

The public folder holds all generated files. It is never cleaned up, so you can keep old generated docs here, and also customise some other files, like `robots.txt` and `favicon.ico`.

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

This public folder can be hosted as is with any webserver. You might be interested in this guide on how to publish to Github Pages, and this on how to configure nginx to host your files.
