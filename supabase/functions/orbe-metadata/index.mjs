import { createMetadataRuntime } from '../_shared/metadata-runtime.ts';

// Metadata status only. No financial ingestion or provider credentials.
Deno.serve(createMetadataRuntime(name => Deno.env.get(name), fetch));
