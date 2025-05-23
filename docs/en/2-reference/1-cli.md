<!--
nav_max: 1
-->
# Shromp CLI

Check [introduction](../1-introduction/index.md) for instalation instructions.

The Shromp CLI allows you to initialise and build shromp projects.

## init

Initialise a shromp project with boilerplate files.

```console
shromp init [options]
```
| Option | Description |
|---50%---|-----50%------|
| -d, --directory <path> | Target directory to save project files |
| --no-content | Do not generate sample content files |

## build

Compile all source files and save them in the `<public>` folder.

```console
shromp build [options]
```

| Option | Description |
|---50%---|-----50%------|
| -c, --config <path to shromp.toml> | shromp config file |
| -t, --tag <string> | Overrides version_to_publish property from shromp.toml |
| -o, --output <path> | Generates files in this folder. Overrides output_folder property from shromp.toml |

