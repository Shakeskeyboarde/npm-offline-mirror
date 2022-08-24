import { type Credentials } from '@lerna/npm-conf';
import gunzip from 'gunzip-maybe';
import nodeFs from 'node:fs';
import { type Readable } from 'node:stream';
import pacote from 'pacote';
import ssri from 'ssri';

import { createStreamPromise } from './stream.js';

const getStreamIntegrity = async (readable: Readable): Promise<string | null> => {
  return ssri.fromStream(readable).then((integrity) => integrity.toString());
};

const getFilenameIntegrity = async (filename: string): Promise<string | null> => {
  const readable = nodeFs.createReadStream(filename);
  const readablePromise = createStreamPromise(readable);
  const integrityPromise = getStreamIntegrity(readable.pipe(gunzip())).catch(() => {
    throw new Error(`Failed to calculate integrity of ${JSON.stringify(filename)}`);
  });

  if (!(await readablePromise.then(() => true).catch(() => false))) {
    return null;
  }

  return await integrityPromise;
};

const getResolvedIntegrity = async (
  resolved: string,
  credentials: Credentials | undefined,
  onReadable?: (tarball: Readable) => Promise<void>,
): Promise<string | null> => {
  return pacote.tarball.stream(
    resolved,
    async (tarball) => {
      const tarballPromise = createStreamPromise(tarball).catch(() => {
        throw new Error(`Failed to download ${JSON.stringify(resolved)}`);
      });
      const unzip = tarball.pipe(gunzip());
      const readablePromise = onReadable?.(unzip) ?? Promise.resolve();
      const integrityPromise = getStreamIntegrity(unzip).catch(() => {
        throw new Error(`Failed to calculate integrity for ${JSON.stringify(resolved)}`);
      });

      await tarballPromise;
      await readablePromise;

      return await integrityPromise;
    },
    credentials,
  );
};

export { getFilenameIntegrity, getResolvedIntegrity };
