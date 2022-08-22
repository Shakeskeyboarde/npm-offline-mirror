#!/usr/bin/env node
const isDevelopment = process.env.NODE_ENV === 'development';

// eslint-disable-next-line import/no-extraneous-dependencies
import('source-map-support/register')
  // Ignoring a possible import error. The source-map-support dependency is
  // optional, and only installed in development.
  .catch(() => undefined)
  .then(async () => import('./main.js'))
  .then(async ({ main }) => main())
  .catch((error) => {
    console.error(isDevelopment ? error : `${error}`);
    process.exitCode = 1;
  });
