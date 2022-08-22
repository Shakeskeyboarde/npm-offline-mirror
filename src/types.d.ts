declare module 'source-map-support/register' {
  // eslint-disable-next-line import/group-exports
  export {};
}

declare module '@lerna/npm-conf' {
  type Credentials = {
    readonly alwaysAuth?: boolean;
    readonly auth?: string;
    readonly email?: string;
    readonly password?: string;
    readonly scope: string;
    readonly token?: string;
    readonly username?: string;
  };

  type Conf = {
    readonly get: (key: string) => string | undefined;
    readonly getCredentialsByURI: (uri: string) => Credentials;
  };

  // eslint-disable-next-line unicorn/prevent-abbreviations
  const npmConf: () => Conf;

  // eslint-disable-next-line import/group-exports, import/no-default-export
  export { type Conf, type Credentials, npmConf as default };
}
