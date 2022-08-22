import npmConf, { type Credentials } from '@lerna/npm-conf';

type Config = {
  readonly getCredentialsByUrl: (url: string) => Credentials | undefined;
  readonly getOfflineMirrorPath: () => string;
};

const createConfig = (): Config => {
  const config = npmConf();

  return {
    getCredentialsByUrl: (url) => {
      if (!url.startsWith('http:') && !url.startsWith('https:')) {
        return undefined;
      }

      const { protocol, host, pathname } = new URL(url);

      for (let registry = pathname; registry !== ''; registry = registry.replace(/([^/]+|\/)$/u, '')) {
        const credentials = config.getCredentialsByURI(`${protocol}//${host}${registry}`);

        if (credentials.token || credentials.username || credentials.password || credentials.email) {
          return credentials;
        }
      }

      return undefined;
    },
    getOfflineMirrorPath: () => {
      return config.get('npm-offline-mirror') || '.npm-offline-mirror';
    },
  };
};

export { type Config as CredentialsManager, createConfig };
