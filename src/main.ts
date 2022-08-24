import nodeFs from 'node:fs';
import nodePath from 'node:path';
import nodeUrl from 'node:url';

import { getOptions } from './options.js';
import { update } from './update.js';
import { usage } from './usage.js';

const main = async (args = process.argv.slice(2)): Promise<void> => {
  const options = getOptions(args);

  if (options.help) {
    usage();
    return;
  }

  if (options.version) {
    const dirname = nodePath.dirname(nodeUrl.fileURLToPath(import.meta.url));
    const pkg = JSON.parse(nodeFs.readFileSync(nodePath.resolve(dirname, '../package.json'), 'utf8'));
    console.log(pkg.version);
    return;
  }

  await update();
};

export { main };
