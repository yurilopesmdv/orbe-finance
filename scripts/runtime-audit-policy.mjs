const vulnerable = new Set(['braces', 'node-forge']);
export function inspectRuntimeMap(map, lock) {
  const sources = new Set();
  function visit(value, depth = 0) {
    if (!value || typeof value !== 'object' || value.version !== 3 || depth > 8) throw Error('runtime_map_invalid');
    if (Array.isArray(value.sections)) {
      if (value.sections.length === 0 || value.sections.length > 10000 || value.sources !== undefined) throw Error('runtime_map_invalid');
      for (const section of value.sections) {
        if (!section || !section.map || section.url !== undefined) throw Error('runtime_map_invalid');
        visit(section.map, depth + 1);
      }
      return;
    }
    if (!Array.isArray(value.sources) || value.sources.length === 0 || value.sources.length > 100000 || value.sourceRoot) throw Error('runtime_map_invalid');
    for (const source of value.sources) {
      if (['\0polyfill:external-require', '\0polyfill:environment-variables', '\0polyfill:assets-registry'].includes(source)) { sources.add(source); continue; }
      if (typeof source !== 'string' || !source || source.length > 4096 || /[\0\r\n]/.test(source)) throw Error('runtime_map_invalid');
      const normalized = source.replaceAll('\\', '/');
      if (/(?:^|\/)\.env(?:\.[^/]*)?$|(?:^|\/)(?:backend\.env|expo-publish\.env|owner-setup\.txt)$/.test(normalized)) throw Error('runtime_private_source');
      sources.add(normalized);
      if (sources.size > 100000) throw Error('runtime_map_invalid');
    }
  }
  if (!lock || !lock.packages || typeof lock.packages !== 'object') throw Error('runtime_lock_invalid');
  visit(map);
  const packages = new Map();
  for (const source of sources) {
    const marker = source.lastIndexOf('node_modules/');
    if (marker < 0) continue;
    const match = /^(?:@[^/]+\/)?[^/]+/.exec(source.slice(marker + 13));
    if (!match) throw Error('runtime_map_invalid');
    const name = match[0];
    if (vulnerable.has(name)) throw Error('runtime_advisory_dependency');
    const entry = lock.packages['node_modules/' + name];
    if (!entry || typeof entry.version !== 'string') throw Error('runtime_package_unresolved');
    packages.set(name, entry.version);
  }
  if (packages.size === 0) throw Error('runtime_packages_missing');
  return Object.freeze({ sourceCount: sources.size, packageCount: packages.size, advisoryRootsAbsent: true,
    packages: Object.freeze([...packages].sort(([a], [b]) => a.localeCompare(b)).map(([name, version]) => Object.freeze({ name, version }))) });
}
