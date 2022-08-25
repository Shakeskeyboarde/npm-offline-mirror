/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  bail: 0,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: 'out/coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/\\.', '/_', '/index\\.tsx?$', '\\.d\\.ts$'],
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'html-spa', 'lcov'],
  coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': { useESM: true },
  },
  moduleNameMapper: {
    // Remove the .js extension (required for ES Module support) from TS file imports.
    '(.*)\\.jsx?$': '$1',
  },
  preset: 'ts-jest',
  restoreMocks: true,
  roots: ['src'],
  setupFilesAfterEnv: [],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
  verbose: true,
};
