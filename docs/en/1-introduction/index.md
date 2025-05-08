# Getting started

## Instalation

You can download the shromp CLI from npm:

- NPM: `npm install -g shromp`
- Yarn: `yarn global add shromp`


Alternatively, you can download the project from [Github](https://github.com/viniciusgerevini/shromp) and use the source directly. A little bit more cumbersome, but an option if you want to hack shromp yourself.

## Initializing your project

To use shromp, you need to create a `shromp.toml` file with the right configuration and a few folders to hold your markdown files and your site theme.

To help you get started, the CLI comes with a command to create the boilerplate for you:


```console
shromp init
```


This will create the following files:

- `shromp.toml` - configuration file with the default settings.
- `docs/` - source folder, with markdown and assets.
- `default-theme/` - Handlebars templates and some helpers.

The generated files are exactly the source for this site. So, if you like something in these docs, you can see exactly how it's done.

You can rename these folders and change the configuration to your taste.

To generate the files to be hosted, you need to run:

```console
shromp build
```

Don't forget to run the build command after any doc or theme changes to generate the new assets.

## Browsing your docs locally

You will want to host these docs in a webserver so you can see them in action. For local development, I recommend using the `http-server` package, which makes hosting static files a breeze.


```console
npm install -g http-server
```

After installing, go to your project's public folder and run `http-server`. The command will print the localhost port you should access to see your files.
