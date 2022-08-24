type Options = {
  readonly help: boolean;
  readonly version: boolean;
};

const getOptions = (args: readonly string[]): Options => {
  return {
    help: args.includes('--help'),
    version: args.includes('--version'),
  };
};

export { getOptions };
