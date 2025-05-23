import { existsSync } from "fs";
import { open, FileHandle } from 'node:fs/promises';
import path from "path";
import toml from "toml";

interface Config {
  default_locale?: string;
  base_url?: string;
  source_folder?: string;
  output_folder?: string;
  theme_folder?: string;
  generate_doc_index?: boolean;
  enable_versions?: boolean;
  enable_locales?: boolean;
  version_to_publish?: string;
  anchor_prefix?: string;
  asset_pipeline_file?: string;
}

interface ThemeConfig {
  default_template?: string;
}

let config: Config  = {};
let themeConfig: ThemeConfig  = {};

let customVersion: string | undefined;

export async function loadConfig(configFile: string = "shromp.toml"): Promise<void> {
  const pathToConfig = folderPathAssemblyHelper(configFile);
  config = await readToml(pathToConfig);
  themeConfig = await readToml(
    folderPathAssemblyHelper(config.theme_folder || DEFAULT_SITE_THEME_PATH, ["shromp-theme.toml"])
  )
}

async function readToml<T>(pathToConfig: string): Promise<T> {
  if (existsSync(pathToConfig)) {
    let filehandle: FileHandle|undefined = undefined;
    try {
      filehandle = await open(pathToConfig, 'r');
      return toml.parse(await filehandle.readFile({ encoding: "utf8" }));
    } finally {
      await filehandle?.close();
    }
  }
  return {} as T;
}

const DEFAULT_SITE_THEME_PATH = './default-theme/';

/**
 * Generator options
 */
export default {
  /**
   * default locale.
   */
  defaultLocale(): string {
    return config.default_locale || "en";
  },

  /**
   * Overwrite base URL. Useful when hosting files in any location other than the
   * root
   */
  baseUrl(...args: string[]): string {
    return [ config.base_url || "/"].concat(args).join("/").replaceAll(/\/+\//g, "/");
  },

  /**
   * Documentation version (files will be nested in this folder)
   */
  versionToPublish(): string {
    return customVersion || config.version_to_publish || "1.0.0";
  },

  setVersionToPublish(v: string | undefined): void {
    customVersion = v;
  },

  /**
   * Folder where the source markdown files are located
   */
  sourceFolder(...args: string[]): string {
    return folderPathAssemblyHelper(config.source_folder || "./docs/", args);
  },

  /**
   * Folder where generated HTML should be saved
   */
  outputFolder(...args: string[]): string {
    return folderPathAssemblyHelper(config.output_folder || "./public/", args);
  },

  setOutputFolder(outputFolder: string | undefined): void {
    config.output_folder = outputFolder;
  },

  /**
   * Folder where handlebars templates are stored
   */
  templatesFolder(...args: string[]): string {
    return folderPathAssemblyHelper(path.join(config.theme_folder || DEFAULT_SITE_THEME_PATH, "templates"), args);
  },

  /**
   * Folder where the site theme styles and scripts are saved
   */
  themeAssetsFolder(...args: string[]): string {
    return folderPathAssemblyHelper(path.join(config.theme_folder || DEFAULT_SITE_THEME_PATH, 'assets'), args);
  },

  /**
   * Default template to use for pages when not set as metadata
   */
  defaultPageTemplate(): string {
    return themeConfig.default_template || "page";
  },

  /**
   * Can disable doc index generation even when index.md is present
   * default: false
   */
  shouldGenerateDocIndex(): boolean {
    return !!config.generate_doc_index;
  },

  /**
  * default: true
  */
  isVersioningEnabled(): boolean {
    return config.enable_versions === undefined || config.enable_versions;
  },

  /**
  * default: true
  */
  areLocalesEnabled(): boolean {
    return config.enable_locales === undefined || config.enable_locales;
  },

  anchorPrefix(): string {
    return config.anchor_prefix || "sp-";
  },

  assetPipelinePath(): string {
    if (!config.asset_pipeline_file) {
      return "";
    }
    return folderPathAssemblyHelper(config.asset_pipeline_file);
  }
}

function folderPathAssemblyHelper(folder: string, args: string[] = []) {
  const cwd = path.isAbsolute(folder) ? "" : process.cwd();

  if (args.length) {
    return path.join(cwd,folder, ...args);
  }
  return path.join(cwd, folder);
}

export interface SiteInfo {
  title?: string;
  description?: string;
  image?: string;
  locales?: {
    [locale: string]: Omit<SiteInfo, "locales">;
  };
}

export async function loadSiteInfo(): Promise<SiteInfo> {
  const configPath = folderPathAssemblyHelper(config.source_folder || "./docs/", ["shromp-site.toml"]);

  if (!existsSync(configPath)) {
    return {};
  }

  const siteConfig = await readToml(configPath);

  return siteConfig as SiteInfo;
}
