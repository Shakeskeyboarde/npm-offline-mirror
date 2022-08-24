import nodeFs from 'node:fs';

import { getSpec, getSpecMirrorFilename } from './spec.js';

type LockPackagesRecord = { readonly integrity?: string; readonly resolved?: string; readonly version?: string };
type LockDependenciesRecord = LockPackagesRecord & { readonly dependencies?: Record<string, LockDependenciesRecord> };
type Lock = {
  readonly dependencies?: {
    readonly [id: string]: LockDependenciesRecord;
  };
  readonly packages: {
    readonly [key: string]: LockPackagesRecord;
  };
};

const readLock = async (): Promise<Lock | null> => {
  try {
    return JSON.parse(await nodeFs.promises.readFile('package-lock.json', 'utf8'));
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return null;
  }
};

const setLockDependencies = (
  dependencies: Record<string, LockDependenciesRecord>,
  integrities: ReadonlyMap<string, string>,
): Record<string, LockDependenciesRecord> => {
  Object.keys(dependencies).forEach((id) => {
    const record = dependencies[id];

    if (record?.version == null) {
      return;
    }

    const spec = getSpec(id, record.version);
    const integrity = integrities.get(spec);
    const childDependencies = record.dependencies && setLockDependencies(record.dependencies, integrities);

    if (integrity != null || record.dependencies !== childDependencies) {
      dependencies = {
        ...dependencies,
        [id]: {
          ...record,
          dependencies: childDependencies,
          integrity: integrity ?? record.integrity,
          resolved: undefined,
        },
      };
    }
  });

  return dependencies;
};

const setLockPackages = (
  packages: Record<string, LockPackagesRecord>,
  integrities: ReadonlyMap<string, string>,
): Record<string, LockPackagesRecord> => {
  Object.keys(packages).forEach((path) => {
    const record = packages[path];

    if (record?.version == null) {
      return;
    }

    const spec = getSpec(path, record.version);
    const filename = getSpecMirrorFilename(spec);
    const integrity = integrities.get(spec);

    if (integrity != null) {
      packages = {
        ...packages,
        [path]: {
          ...record,
          integrity,
          resolved: `file:${filename}`,
        },
      };
    }
  });

  return packages;
};

const updateLock = async (lock: Lock, integrities: ReadonlyMap<string, string>): Promise<void> => {
  const newPackages = setLockPackages(lock.packages, integrities);
  const newDependencies = lock.dependencies && setLockDependencies(lock.dependencies, integrities);

  if (lock.packages === newPackages && lock.dependencies === newDependencies) {
    return;
  }

  const newLock = { ...lock, dependencies: newDependencies, packages: newPackages };

  await Promise.all([
    nodeFs.promises.writeFile('package-lock.json', JSON.stringify(newLock, null, '  ') + '\n'),
    nodeFs.promises.unlink('node_modules/.package-lock.json').catch(() => undefined),
  ]);

  console.log('mirror updated package-lock.json ');
};

export { type Lock, type LockPackagesRecord, readLock, updateLock };
