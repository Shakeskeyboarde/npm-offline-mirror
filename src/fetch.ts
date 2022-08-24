import nodeFs from 'node:fs';
import nodeHttp from 'node:http';
import nodeHttps, { Agent } from 'node:https';
import nodeStream, { type Readable } from 'node:stream';
import nodeUrl from 'node:url';

type FetchResponse = {
  readonly body: Readable | null;
  readonly ok: boolean;
  readonly status: number;
};

type FetchOptions = {
  readonly __tls?: { readonly certFile: string; readonly keyFile: string };
  readonly headers?: Record<string, string>;
};

const fetch = async (resource: string, options: FetchOptions = {}): Promise<FetchResponse> => {
  const { __tls, headers } = options;
  const url = new nodeUrl.URL(resource);
  const httpX = url.protocol === 'https:' ? nodeHttps : nodeHttp;
  const agent =
    url.protocol === 'https:' && __tls
      ? new Agent({
          cert: nodeFs.readFileSync(__tls.certFile),
          key: nodeFs.readFileSync(__tls.keyFile),
        })
      : undefined;

  return new Promise<FetchResponse>((resolve, reject) => {
    httpX
      .request(url, { agent, headers, method: 'GET' }, (res) => {
        const status = res.statusCode as number;

        resolve({
          body: res.pipe(new nodeStream.PassThrough()),
          ok: status >= 200 && status <= 299,
          status,
        });
      })
      .on('error', reject)
      .end();
  });
};

export { fetch };
