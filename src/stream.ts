import { type Readable, type Writable } from 'node:stream';

const createStreamPromise = <TStream extends Readable | Writable>(stream: TStream): Promise<TStream> => {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

export { createStreamPromise };
