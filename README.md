# npm-offline-mirror

Mirror dependencies to TAR archives in a local directory for offline installation.

[![build](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml/badge.svg)](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml)

## Usage

Install as a dev dependency.

```
npm i -D npm-offline-mirror
```

Run the `npm-offline-mirror` command at the package root (the directory that contains `package-lock.json`).

```sh
npx npm-offline-mirror
```

This command downloads and saves TAR archives for all dependencies into the `.npm-offline-mirror` (by default) directory. This directory _should_ be checked in to source control.

You may want to add `npm-offline-mirror` as a `postinstall` command in your `package.json` file, so that the offline mirror is synchronized after every restore (`npm install` or `npm ci`).

```json
{
  "scripts": {
    "postinstall": "npm-offline-mirror"
  }
}
```

The mirror directory can be changed by adding the `npm-offline-mirror` option to your `.npmrc` file.

```ini
npm-offline-mirror=.package-cache
```

## Why?

- Perfectly replicate builds.
- Restore packages offline (`npm ci --offline`).
- Protect against supply chain attacks.
- Improve awareness of shipped code.

## How?

Running the `npm-offline-mirror` command performs the following steps.

1. Find all `package-lock.json` dependencies that currently resolve to registry URLs (http/https tarballs).
2. Download dependencies to (uncompressed) TAR files in the local offline mirror directory.
3. Update the `package-lock.json` file resolutions to point to the downloaded archives.
4. Remove old TAR archives in the offline mirror directory that no longer match any dependencies.

This will use any NPM credentials and registries configured in your `.npmrc` files.
