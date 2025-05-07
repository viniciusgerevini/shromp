# Shromp CLI

Check [introduction](../1-introduction/index.md) for instalation instructions.

The Shromp CLI allows you to initialize and build shromp projects.

## init

Initialize a shromp project with boilerplate files.

```console
shromp init [options]
```
| Option | Description |
|---50%---|-----50%------|
| -d, --directory <path> | Target directory to save project files |

## build

Compile all source files and save them in the `<public>` folder.

```console
shromp build [options]
```

| Option | Description |
|---50%---|-----50%------|
| -c, --config <path to shromp.toml> | shromp config file |
| -v, --version <string> | Overrides version_to_publish property from shromp.toml |

