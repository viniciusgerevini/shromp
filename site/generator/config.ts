/**
 * Generator options
 */
export default {
  /**
   * default locale to load the site and to fallback when page doesn't exist
   * for selected languge.
   */
  default_locale: "en",
  /**
   * Folder where the source markdown files are located
   */
  source_folder: "../docs/",
  /**
   * Folder where generated HTML should be saved
   */
  // output_folder: "../dist/",
  output_folder: "../public/",
  /**
   * Overwrite base URL. Useful when hosting files in any location other than the
   * root
   */
  base_url: "/",

  // TODO default heading level to include in the navigation. By default H1 and H2s are included. This config allow adding or removing headings
  // default_navigation_depth

  // TODO
  // useVersionFolders - if true, third level is version folder
  // TODO
  versionToPublish: "1.0.0", // string|undefined; // version which files will be generated against
  // TODO
  // stableVersion
  // TODO
  // latestVersion
  templatesFolder: "../templates",
  defaultPageTemplate: "page.hbs",
}
