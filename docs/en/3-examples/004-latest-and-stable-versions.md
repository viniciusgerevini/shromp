<!--
nav_max: 1
-->
# Latest and stable version tags

It's not uncommon for versioned documentations to have a "stable" or "latest" tag that points to the latest version. Event though there is nothing in Shromp to create those out-the-box, there are a few ways you can achieve that.

## Create "stable"/"latest" specific files

This is probably the simplest way with least caveats. When running `shromp build` to create your files, you could run it again to create the latest files with the same source `shromp build -v latest`.

This will create two different sets of files for the version and for latest, but that shouldn't be an issue given the process is super fast (I haven't seen it taking more than a second) and these static files are lightweight.

One thing you might want to incorporate as part of your build though, is cleaning up the latest folder before generating new files to make sure there are no old files left behind. These wouldn't break your release, but they would be available to anyone with a direct link.

## Symlinks

This is probably not a good idea, but worth mentioning. You can create a symlink in your `<public>` folder pointing to your latest version. The caveat is that all URLs would still point to the actual version number, so eventually the visitor would leave the latest tag back to the version url. Still an option nonetheless.

---

There are other options involving webserver rewrite shenanigans, but that wouldn't be a static solution anymore :D.


