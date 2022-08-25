import nodeCrypto from 'node:crypto';
import nodeFs from 'node:fs';
import nodeStream, { type Readable } from 'node:stream';
import nodeZlib from 'node:zlib';

import { type Credentials } from './config.js';
import { fetch } from './fetch.js';
import { createStreamPromise } from './stream.js';

const getIntegrity = (readable: Readable): Promise<string> => {
  const hash = nodeCrypto.createHash('sha512', {
    encoding: 'base64',
  });

  return new Promise((resolve, reject) => {
    hash.on('error', reject);
    readable.on('error', reject);
    readable.on('end', () => {
      hash.end();
      resolve(`sha512-${hash.read()}`);
    });
    readable.pipe(hash);
  });
};

const getFilenameIntegrity = async (filename: string): Promise<string | null> => {
  const readable = nodeFs.createReadStream(filename);
  const unzipped =
    filename.endsWith('.tgz') || filename.endsWith('.tar.gz') ? readable.pipe(nodeZlib.createGunzip()) : readable;

  return await getIntegrity(unzipped).catch((error) => {
    if (error.code !== 'ENOENT') {
      throw new Error(`Failed to calculate integrity of ${JSON.stringify(filename)}`);
    }

    return null;
  });
};

const getUrlIntegrity = async (
  url: `${'http' | 'https'}://${string}`,
  credentials: Credentials | undefined,
  onReadable?: (readable: Readable) => Promise<void>,
): Promise<string> => {
  const res = await fetch(url, {
    __tls: credentials?.tls,
    headers: {
      Accept: 'application/octet-stream',
      ...(credentials?.auth ? { Authorization: credentials.auth } : {}),
    },
  });

  if (!res.body) {
    throw new Error(`Empty response from ${JSON.stringify(url)}`);
  } else if (!res.ok) {
    throw new Error(`Failed to download ${JSON.stringify(url)} (Status: ${res.status})`);
  }

  const bodyPromise = createStreamPromise(res.body).catch(() => {
    throw new Error(`Failed to download ${JSON.stringify(url)}`);
  });
  const unzipped = url.endsWith('.tgz') || url.endsWith('.tar.gz') ? res.body.pipe(nodeZlib.createGunzip()) : res.body;
  const readablePromise = onReadable?.(unzipped.pipe(new nodeStream.PassThrough())) ?? Promise.resolve();
  const integrityPromise = getIntegrity(unzipped.pipe(new nodeStream.PassThrough())).catch(() => {
    throw new Error(`Failed to calculate integrity for ${JSON.stringify(url)}`);
  });

  await bodyPromise;
  await readablePromise;

  return await integrityPromise;
};

export { getFilenameIntegrity, getUrlIntegrity };
