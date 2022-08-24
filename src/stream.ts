const createStreamPromise = <TStream extends NodeJS.ReadableStream | NodeJS.WritableStream>(
  stream: TStream,
): Promise<TStream> => {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

export { createStreamPromise };
