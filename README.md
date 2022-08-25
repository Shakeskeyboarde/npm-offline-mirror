# npm-offline-mirror

Fast, safe, reproducible builds using NPM.

[![build](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml/badge.svg)](https://github.com/Shakeskeyboarde/npm-offline-mirror/actions/workflows/build.yml)

## What

Download package tarballs for inclusion in source control and update `package-lock.json` to point to them.

## How

1. Read `package-lock.json` to find all dependencies that resolve to a registry URL starting with `https:` (or `http:`).
2. Download the exact same `.tgz` files that `npm install` downloads, honoring all configured (`.npmrc`) registries and registry credentials.
3. Decompress the `.tgz` files into `.tar` files.
4. Save the `.tar` files into the project's `.npm-offline-mirror` directory (configurable).
5. Rewrite `package-lock.json` to point at the saved `.tar` files.

## Why

- Perfectly replicate builds at any point in source control history.
- Restore packages offline (ie. `npm ci --offline`).
- Protect against supply chain attacks like the [left-pad incident](https://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm).
- Improve awareness of shipped dependencies.
- Parity with Yarn which has this functionality [built-in](https://classic.yarnpkg.com/blog/2016/11/24/offline-mirror/).

## When

Run the `npm-offline-mirror` command in your project root every time a dependency is modified. The (semi-)automatic solution is to add the command to the `package.json` file's `postinstall` script.

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
