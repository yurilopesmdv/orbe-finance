import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { getDefaultConfig } = require('expo/metro-config');
const secured = require('../../metro.config.cjs');
const metroRoot = path.dirname(require.resolve('metro/package.json'));
const createFileMap = require(path.join(metroRoot, 'src/node-haste/DependencyGraph/createFileMap.js')).default;

test('actual Metro crawler excludes private canaries while preserving application modules', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'orbe-metro-canary-'));
  const names = ['.env.backend.local', '.env.canary.js', 'backend.env', 'credentials.json', '.npmrc.local'];
  try {
    await writeFile(path.join(root, 'public.js'), 'export const demo = true;');
    for (const name of names) await writeFile(path.join(root, name), 'INVENTED_CANARY_ONLY');
    async function crawl(blockList, suffix) {
      const config = getDefaultConfig(process.cwd());
      config.projectRoot = root;
      config.watchFolders = [root];
      config.maxWorkers = 1;
      config.resolver.useWatchman = false;
      config.resolver.blockList = blockList;
      config.fileMapCacheDirectory = path.join(root, suffix);
      await mkdir(config.fileMapCacheDirectory);
      const { fileMap } = createFileMap(config, { watch: false });
      try {
        const { fileSystem } = await fileMap.build();
        return Object.fromEntries([...names, 'public.js'].map(name => [name, fileSystem.exists(path.join(root, name))]));
      } finally { await fileMap.end(); }
    }
    const before = await crawl(getDefaultConfig(process.cwd()).resolver.blockList, 'before-cache');
    assert.equal(before['.env.backend.local'], true, 'baseline must demonstrate original indexing');
    assert.equal(before['.env.canary.js'], true);
    const after = await crawl(secured.resolver.blockList, 'after-cache');
    for (const name of names) assert.equal(after[name], false, name);
    assert.equal(after['public.js'], true);
  } finally { await rm(root, { recursive: true, force: true }); }
});
