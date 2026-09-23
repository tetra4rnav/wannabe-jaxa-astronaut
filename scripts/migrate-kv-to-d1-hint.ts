/**
 * One-shot: import KV news:file + proposals:file into D1 (run before cutting over).
 * Usage (with wrangler D1 / local bindings as available):
 *   npx wrangler d1 execute wannabe-jaxa-db --remote --file=...
 * Prefer an operator machine with FETCH of KV values, or paste JSON into this script.
 *
 * This script reads from env NEWS_JSON / PROPOSALS_JSON file paths when set,
 * otherwise from src/data/news.json for news only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log(`KV→D1 cutover helper.
1. Apply migration 0002_runtime_sot.sql
2. Export KV keys news:file and proposals:file
3. Use wrangler d1 execute / a one-off Worker step to call replaceNewsInD1 + upsertProposalInD1
4. Remove legacy KV keys after verification

Bundled news path (dev seed): ${path.join(root, 'src/data/news.json')}
Exists: ${fs.existsSync(path.join(root, 'src/data/news.json'))}
See docs/specs/VER-20260923-1-admin-and-d1.md`);
