import nodeFs from 'node:fs';

import { createConfig } from './config.js';
import { getFilenameIntegrity, getResolvedIntegrity } from './integrity.js';
import { createStreamPromise } from './stream.js';

type CacheEntry = { readonly integrity: string; readonly resolved: string };
// eslint-disable-next-line functional/prefer-readonly-type
type LockPackagesRecord = { integrity?: string; resolved?: string; readonly version?: string };
type LockDependenciesRecord = LockPackagesRecord & { readonly dependencies?: Record<string, LockDependenciesRecord> };
type Lock = {
  readonly dependencies: {
    readonly [id: string]: LockDependenciesRecord;
  };
  readonly packages: {
    readonly [key: string]: LockPackagesRecord;
  };
};

const getId = (key: string): string => {
  return key.replace(/(?:^|.*\/)node_modules\//g, '');
};

const getFilename = (id: string, version: string): string => {
  return `${id.replace(/\//g, '_')}@${version}.tar`;
};

const updateDependencies = (
  dependencies: Record<string, LockDependenciesRecord>,
  cache: ReadonlyMap<string, CacheEntry>,
) => {
  for (const [id, record] of Object.entries(dependencies)) {
    const entry = cache.get(`${id}@${record.version}`);

    if (entry) {
      record.integrity = entry.integrity;
      delete record.resolved;
    }

    if (record.dependencies) {
      updateDependencies(record.dependencies, cache);
    }
  }
};

const update = async (): Promise<void> => {
  const config = createConfig();
  const directory = config.getOfflineMirrorPath();
  const lock: Lock = JSON.parse(nodeFs.readFileSync('package-lock.json', 'utf8'));

  nodeFs.mkdirSync(directory, { recursive: true });

  const cache = new Map<string, { integrity: string; resolved: string }>();
  const archives = new Set(
    nodeFs
      .readdirSync(directory)
      .filter((filename) => filename.endsWith('.tar'))
      .map((filename) => `${directory}/${filename}`),
  );
  const unusedFilenames = new Set(archives);

  let addCount = 0;
  let isLockUpdated = false;

  for (const [key, record] of Object.entries(lock.packages)) {
    if (record.resolved?.startsWith('file:')) {
      unusedFilenames.delete(record.resolved.replace(/^file:/, ''));
      continue;
    }

    if (
      record.version == null ||
      record.resolved == null ||
      !/^https?:/.test(record.resolved) ||
      !/(?:^|\/)node_modules\//.test(key)
    ) {
      // Mirroring not supported.
      continue;
    }

    const id = getId(key);
    const filename = `${directory}/${getFilename(id, record.version)}`;

    unusedFilenames.delete(filename);

    const integrity =
      cache.get(`${id}@${record.version}`)?.integrity ??
      (await getFilenameIntegrity(filename).catch((error) => console.log(`${error}`))) ??
      (await getResolvedIntegrity(record.resolved, config.getCredentialsByUrl(record.resolved), async (tarball) => {
        await createStreamPromise(tarball.pipe(nodeFs.createWriteStream(filename))).catch(() => {
          throw new Error(`Failed to write ${JSON.stringify(filename)}`);
        });
      }).catch((error) => console.log(`${error}`)));

    if (integrity == null) {
      // Couldn't calculate integrity.
      continue;
    }

    if (!archives.has(filename)) {
      console.log(`+ ${filename}`);
      addCount++;
    }

    isLockUpdated = true;
    record.integrity = integrity;
    record.resolved = `file:${filename}`;
    cache.set(`${id}@${record.version}`, { integrity: record.integrity, resolved: record.resolved });
  }

  for (const unusedFilename of unusedFilenames) {
    nodeFs.unlinkSync(unusedFilename);
    console.log(`- ${unusedFilename}`);
  }

  if (addCount || unusedFilenames.size) {
    console.log(`mirror archive files updated (+${addCount}, -${unusedFilenames.size})`);
  }

  if (isLockUpdated) {
    if (lock.dependencies) {
      updateDependencies(lock.dependencies, cache);
    }

    nodeFs.writeFileSync('package-lock.json', JSON.stringify(lock, null, '  ') + '\n');
    await nodeFs.promises.unlink('node_modules/.package-lock.json').catch(() => undefined);
    console.log('mirror changes made to package-lock.json ');
  }

  if (!isLockUpdated && !addCount && !unusedFilenames.size) {
    console.log('mirror is up to date');
  }
};

export { update };
