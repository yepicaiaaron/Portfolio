import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const client = new URL('../dist/client/', import.meta.url);
const server = new URL('../dist/server/', import.meta.url);
const metadata = new URL('../dist/.openai/', import.meta.url);

await rm(dist, { recursive: true, force: true });
await Promise.all([
  mkdir(client, { recursive: true }),
  mkdir(server, { recursive: true }),
  mkdir(metadata, { recursive: true })
]);

await Promise.all([
  cp(new URL('../index.html', import.meta.url), new URL('index.html', client)),
  cp(new URL('../assets/', import.meta.url), new URL('assets/', client), { recursive: true }),
  cp(new URL('../css/', import.meta.url), new URL('css/', client), { recursive: true }),
  cp(new URL('../js/', import.meta.url), new URL('js/', client), { recursive: true })
]);
await cp(new URL('../.openai/hosting.json', import.meta.url), new URL('hosting.json', metadata));

await writeFile(
  new URL('index.js', server),
  `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') url.pathname = '/index.html';

    if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
      return new Response('Portfolio assets are not available.', { status: 503 });
    }

    return env.ASSETS.fetch(new Request(url, request));
  }
};
`
);

console.log('Hosted portfolio bundle created in dist/.');
