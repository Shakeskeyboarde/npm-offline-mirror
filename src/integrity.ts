import gunzip from 'gunzip-maybe';
import nodeFs from 'node:fs';
import nodeStream, { type Readable } from 'node:stream';
import ssri from 'ssri';

import { type Credentials } from './config.js';
import { fetch } from './fetch.js';
import { createStreamPromise } from './stream.js';

const getStreamIntegrity = async (readable: Readable): Promise<string> => {
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
  const unzip = res.body.pipe(gunzip());
  const readablePromise = onReadable?.(unzip.pipe(new nodeStream.PassThrough())) ?? Promise.resolve();
  const integrityPromise = getStreamIntegrity(unzip.pipe(new nodeStream.PassThrough())).catch(() => {
    throw new Error(`Failed to calculate integrity for ${JSON.stringify(url)}`);
  });

  await bodyPromise;
  await readablePromise;

  return await integrityPromise;
};

export { getFilenameIntegrity, getUrlIntegrity };
