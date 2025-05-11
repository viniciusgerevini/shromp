<!--
nav_max: 1
-->
# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## 0.0.6 (2025-05-10)

- Added --no-content option to shromp init to skip sample content generation
- Added --output option to shromp build to override output folder
- Implemented shromp-site.toml to allow setting up site information to be used by themes
- Implemented social tags using site info
- Fixed site navigation and child pages displaying some characters wrong (i.e. quotes)
- Disabled doc index in sample docs
- Fixed issue in theme where initially expanded section required two clicks to close

## 0.0.5 (2025-05-08)

- Theme: fix versions request for regular baseUrl

## 0.0.4 (2025-05-08)

- Make baseUrl afect navigation as well
- Theme: Use window.location to make redirect faster

## 0.0.3 (2025-05-08)

- Rename `--version` option in config to `--tag` to not conflict with the default version command.
- Implemented actual version override

## 0.0.2 (2025-05-08)

- Add README
- Add shebang to CLI
- Add repository link to package.json

## 0.0.1 (2025-05-08)

A shromp is born!
