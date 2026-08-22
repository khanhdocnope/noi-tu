import { env } from '../config/env.js';

const CHECKPOINTS = [1, 5, 10, 15, 20];

function getCheckpoint(level: number): number {
  let last = 1;
  for (const cp of CHECKPOINTS) {
    if (level >= cp) last = cp;
    else break;
  }
  return last;
}

export function getArtworkUrl(species: string, level: number): string {
  const cp = getCheckpoint(level);
  const filename = `lv${String(cp).padStart(2, '0')}.png`;
  return `${env.HF_ARTWORK_URL}/${species}/${filename}`;
}

export function getAllArtworkUrls(species: string): string[] {
  return CHECKPOINTS.map((cp) => {
    const filename = `lv${String(cp).padStart(2, '0')}.png`;
    return `${env.HF_ARTWORK_URL}/${species}/${filename}`;
  });
}
