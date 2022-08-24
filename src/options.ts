import nodeUtil from 'node:util';

type Options = {
  readonly help: boolean;
  readonly version: boolean;
};

const getOptions = (args: readonly string[]): Options => {
  const options = nodeUtil.parseArgs({
    args: [...args],
    options: {
      help: { type: 'boolean' },
      version: { type: 'boolean' },
    },
    strict: true,
  });

  return {
    help: Boolean(options.values.help),
    version: Boolean(options.values.version),
  };
};

export { getOptions };
