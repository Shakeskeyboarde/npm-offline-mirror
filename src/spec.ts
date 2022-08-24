import { config } from './config.js';

const getSpec = (id: string, version?: string): string => {
  return id.replace(/(?:^|.*\/)node_modules\//g, '') + (version ? `@${version}` : '');
};

const getSpecMirrorFilename = (spec: string): string => {
  return `${config.mirrorPath}/${spec.replace(/\//g, '_')}.tar`;
};

export { getSpec, getSpecMirrorFilename };
