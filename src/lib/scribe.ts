import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

export interface ScribeField {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  hidden?: boolean;
  isBody?: boolean;
  options?: Array<string | { value: string; label?: string }>;
}

export interface ScribeCollection {
  name: string;
  path: string;
  format?: string;
  label?: string;
  description?: string;
  form?: boolean;
  fields: ScribeField[];
  view?: { primary?: string; sort?: string; fields?: string[] };
  workflow?: { states?: Array<{ name: string; label?: string; kind?: string; hidden?: boolean }> };
}

export interface ScribeSchema {
  site: string;
  siteName?: string;
  turnstileSiteKey?: string;
  collections: ScribeCollection[];
}

let cached: ScribeSchema | undefined;

/**
 * Reads the repo's own `.scribe.yml` at build time.
 *
 * Deliberately not going through `scripts/generate-config.mjs`: that flattens
 * the schema to field *names* and can only represent the first form
 * collection, so it can't describe the RSVP form at all (RFC 0010).
 */
export function loadScribeSchema(): ScribeSchema {
  // Resolved from the working directory, not `import.meta.url`: Astro bundles
  // this module into `dist/.prerender/chunks/`, so a path relative to the
  // module resolves next to the bundle rather than next to this source file.
  cached ??= parse(readFileSync(resolve(process.cwd(), '.scribe.yml'), 'utf-8')) as ScribeSchema;
  return cached;
}

export function collection(name: string): ScribeCollection | undefined {
  return loadScribeSchema().collections.find((c) => c.name === name);
}

/** Fields a visitor may fill in — the rest are internal or the markdown body. */
export function formFields(name: string): ScribeField[] {
  return (collection(name)?.fields ?? []).filter((f) => !f.hidden && !f.isBody);
}
