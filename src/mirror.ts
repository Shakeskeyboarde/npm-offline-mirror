import nodeFs from 'node:fs';
import nodePath from 'node:path';

import { config } from './config.js';
import { getFilenameIntegrity, getUrlIntegrity } from './integrity.js';
import { createLimiter } from './limiter.js';
import { type Lock, type LockPackagesRecord } from './lock.js';
import { getSpec, getSpecMirrorFilename } from './spec.js';
import { createStreamPromise } from './stream.js';

type UpdatePackagesRecord = LockPackagesRecord & {
  readonly resolved: `${'http' | 'https'}://${string}`;
  readonly version: string;
};

const isMirrorRequired = (id: string, record: LockPackagesRecord): record is UpdatePackagesRecord => {
  return (
    record.version != null &&
    record.resolved != null &&
    /^https?:\/{2}/.test(record.resolved) &&
    /(?:^|\/)node_modules\//.test(id)
  );
};

const readMirror = async (): Promise<readonly string[]> => {
  return (
    (await nodeFs.promises
      .readdir(config.mirrorPath)
      .then((filenames) => filenames.map((filename) => `${config.mirrorPath}/${filename}`))
      .catch((error) => {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      })) ?? []
  );
};

const updateMirror = async (lock: Lock): Promise<ReadonlyMap<string, string>> => {
  const limiter = createLimiter();
  const integrities = new Map<string, string>();
  const mirror = new Set(await readMirror());
  const unused = new Set(mirror);

  let addCount = 0;

  await Promise.allSettled(
    Object.entries(lock.packages).map(async ([id, record]) => {
      const spec = getSpec(id, record.version);
      const filename = getSpecMirrorFilename(spec);

      unused.delete(filename);

      if (!isMirrorRequired(id, record)) {
        return;
      }

      return limiter(async () => {
        const integrity =
          (await getFilenameIntegrity(filename).catch((error) => console.log(`${error}`))) ??
          (await getUrlIntegrity(record.resolved, config.getCredentialsByUrl(record.resolved), async (readable) => {
            await nodeFs.promises.mkdir(nodePath.dirname(filename), { recursive: true });
            await createStreamPromise(readable.pipe(nodeFs.createWriteStream(filename))).catch(() => {
              throw new Error(`Failed to write ${JSON.stringify(filename)}`);
            });
          }));

        integrities.set(spec, integrity);

        if (!mirror.has(filename)) {
          mirror.add(filename);
          console.log(`+ ${filename}`);
          addCount++;
        }
      });
    }),
  );

  await Promise.allSettled(
    [...unused].map((filename) => {
      return limiter(async () => {
        await nodeFs.promises.unlink(filename);
        console.log(`- ${filename}`);
      });
    }),
  );

  console.log(`mirror (+${addCount}, -${unused.size})`);

  return integrities;
};

export { updateMirror };
