import { promises as fs } from 'fs';
import path from 'path';
import type { Digest } from './gemini';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function saveDigest(digest: Digest): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const dateStr = new Date(digest.generatedAt).toISOString().split('T')[0];
  await Promise.all([
    fs.writeFile(path.join(DATA_DIR, `${dateStr}.json`), JSON.stringify(digest, null, 2), 'utf-8'),
    fs.writeFile(path.join(DATA_DIR, 'latest.json'), JSON.stringify(digest, null, 2), 'utf-8'),
  ]);
}

export async function loadLatestDigest(): Promise<Digest | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, 'latest.json'), 'utf-8');
    return JSON.parse(raw) as Digest;
  } catch {
    return null;
  }
}
