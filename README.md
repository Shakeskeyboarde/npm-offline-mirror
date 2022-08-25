# npm-offline-mirror

Fast, safe, reproducible builds using NPM.

[![build](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml/badge.svg)](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml)
[![downloads](https://badgen.net/npm/v/npm-offline-mirror?icon=npm&label=version)](https://www.npmjs.com/package/npm-offline-mirror)

## What

Download package tarballs for inclusion in source control and update `package-lock.json` to point to them.

## How

1. Read `package-lock.json` to find all dependencies that resolve to a registry URL starting with `https:` (or `http:`).
2. Download the exact same `.tgz` files that `npm install` downloads, honoring all configured (`.npmrc`) registries and registry credentials.
3. Decompress the `.tgz` files into `.tar` files.
4. Save the `.tar` files into the project's `.npm-offline-mirror` directory (configurable).
5. Rewrite `package-lock.json` to point at the saved `.tar` files.

## Why

- Restore packages faster and without network (eg. when running `npm ci --offline` in a CI/CD pipeline).
- Perfectly replicate builds at any point in source control history.
- Protect against supply chain attacks like the [left-pad incident](https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm).
- Improve awareness of shipped dependencies.
- Parity with Yarn which has this functionality [built-in](https://classic.yarnpkg.com/blog/2016/11/24/offline-mirror/).

## When

Run the `npm-offline-mirror` command in your project root every time a dependency is modified.

```sh
npx npm-offline-mirror
```

You can also add the command to a `package.json` file `postinstall` script so that the mirror is updated whenever the `install` or `ci` commands are invoked.

Install this package as a dev dependency.

```sh
npm i -D npm-offline-mirror
```

Add the command to the `postinstall` script.

```json
{
  "scripts": {
    "postinstall": "npm-offline-mirror"
  }
}
```

The command is a no-op if there's no `package-lock.json` file in the working directory, so it's safe to include the `postinstall` script even if your package will be consumed by other packages as a dependency.

## Requirements

- NodeJS >= 16.12
- NPM >= 7

## Alternatives

Yarn has built-in support for offline mirroring. However Yarn v1 is buggy, and v2 uses PnP which I am not a fan of.

The [shrinkpack](https://www.npmjs.com/package/shrinkpack) package was the original implementation of this pattern for NPM. There were even plans once (2018) to [integrate it into NPM](https://blog.npmjs.org/post/173239798780/beyond-npm6-the-future-of-the-npm-cli.html). However, it has the following limitations.

- Only supports the https://registry.npmjs.org registry.
- Does not support registry credentials.
- Does not maintain backwards compatibility with v1 lock files (NPM v5 and v6).
- Slow downloads (single threaded).
