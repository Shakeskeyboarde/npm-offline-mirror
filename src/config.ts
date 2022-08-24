import ini from 'ini';
import nodeFs from 'node:fs';
import nodeOs from 'node:os';
import nodePath from 'node:path';
import nodeUrl from 'node:url';

type Credentials = {
  readonly auth?: string;
  readonly tls?: { readonly certFile: string; readonly keyFile: string };
};

type Config = {
  readonly getCredentialsByUrl: (url: `${'http' | 'https'}://${string}`) => Credentials | undefined;
  readonly mirrorPath: string;
};

const ENV_CONFIG_PREFIX = 'npm_config_';

const readConfigFile = (filename: string): Record<string, string> => {
  try {
    return ini.parse(nodeFs.readFileSync(filename, 'utf8'));
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return {};
  }
};

const getEnvConfig = (): Record<string, string> => {
  const config = Object.create(null);

  Object.entries(process.env)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap<[string, string]>(([key, value]) => {
      key = key.toLowerCase();
      return value != null && key.startsWith(ENV_CONFIG_PREFIX)
        ? [[key.slice(ENV_CONFIG_PREFIX.length).replace(/_/gu, '-'), value]]
        : [];
    })
    .forEach(([key, value]) => {
      config[key] = value;
    });

  return config;
};

const replaceVariables = (value: string): string => {
  return value.replace(/(\\*)\$\{([^}]+)\}/gu, (match, escape, name) => {
    if (escape.length > 0 && escape.length % 2) {
      return match;
    }

    return process.env[name] ?? match;
  });
};

const loadConfig = (): Record<string, string> => {
  const env = getEnvConfig();
  const config = {
    ...readConfigFile(env.userconfig || nodePath.join(nodeOs.homedir(), '.npmrc')),
    ...readConfigFile('.npmrc'),
    ...env,
  };

  Object.keys(config).forEach((key) => {
    config[key] = replaceVariables(config[key] ?? '');
  });

  return config;
};

const createConfig = (): Config => {
  const config = loadConfig();
  const mirrorPath = config['npm-offline-mirror'] || '.npm-offline-mirror';

  return {
    getCredentialsByUrl: (url): Credentials | undefined => {
      if (!url.startsWith('http:') && !url.startsWith('https:')) {
        return undefined;
      }

      const { host, pathname } = new nodeUrl.URL(url);

      for (let registry = pathname; registry !== ''; registry = registry.replace(/([^/]+|\/)$/u, '')) {
        const prefix = `//${host}${registry}:`;
        const certFile = config[`${prefix}certfile`];
        const keyFile = config[`${prefix}keyfile`];
        const authToken = config[`${prefix}_authToken`];
        const auth_ = config[`${prefix}_auth`];
        const username = config[`${prefix}username`];
        const password = config[`${prefix}_password`];
        const ssl = certFile != null && keyFile != null ? { certFile, keyFile } : undefined;
        const auth =
          authToken != null
            ? `Bearer ${authToken}`
            : auth_ != null
            ? `Basic ${auth_}`
            : username != null && password != null
            ? Buffer.from(`${username}:${password}`).toString('base64')
            : undefined;

        if (ssl || auth) {
          return { auth, tls: ssl };
        }
      }

      return undefined;
    },
    mirrorPath,
  };
};

const config = createConfig();

export { type Credentials, config };
