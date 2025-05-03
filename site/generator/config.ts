import path from "path";

/**
 * Generator options
 */
export default {
  /**
   * default locale to load the site and to fallback when page doesn't exist
   * for selected languge.
   */
  defaultLocale(): string {
    return process.env.VGEN_DEFAULT_LOCALE || "en";
  },

  /**
   * Overwrite base URL. Useful when hosting files in any location other than the
   * root
   */
  baseUrl(): string {
    return process.env.VGEN_BASE_URL || "/";
  },

  /**
   * Documentation version (files will be nested in this folder)
   */
  versionToPublish(): string {
    return process.env.VGEN_VERSION_TO_PUBLISH || "1.0.0";
  },

  /**
   * Folder where the source markdown files are located
   */
  sourceFolder(...args: string[]): string {
    return folderPathAssemblyHelper(process.env.VGEN_SOURCE_FOLDER || "../docs/", args);
  },

  /**
   * Folder where generated HTML should be saved
   */
  outputFolder(...args: string[]): string {
    return folderPathAssemblyHelper(process.env.VGEN_OUTPUT_FOLDER || "../public/", args);
  },

  /**
   * Folder where handlebars templates are stored
   */
  templatesFolder(...args: string[]): string {
    return folderPathAssemblyHelper(process.env.VGEN_TEMPLATES_FOLDER || "../site-theme/templates/", args);
  },

  /**
   * Folder where the site theme styles and scripts are saved
   */
  siteAssetsFolder(...args: string[]): string {
    return folderPathAssemblyHelper(process.env.VGEN_TEMPLATES_FOLDER || "../site-theme/assets/", args);
  },


  /**
   * Default template to use for pages when not set as metadata
   */
  defaultPageTemplate(): string {
    return process.env.VGEN_DEFAULT_PAGE_TEMPLATE || "page";
  },
}

function folderPathAssemblyHelper(folder: string, args: string[]) {
  if (args.length) {
    return path.join(folder, ...args);
  }
  return folder;
}
