import { Router } from 'express';
import multer from 'multer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { env } from '../../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP allowed'));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post('/artwork', upload.single('file'), async (req, res) => {
  try {
    const { species, level } = req.body;
    const file = req.file;

    if (!file || !species || !level) {
      return res.status(400).json({ error: 'Missing species, level, or file' });
    }

    const paddedLevel = String(level).padStart(2, '0');
    const filename = `lv${paddedLevel}.png`;
    const hfPath = `${species}/${filename}`;

    const tmpFile = path.join(os.tmpdir(), `hf-upload-${Date.now()}.png`);
    fs.writeFileSync(tmpFile, file.buffer);

    const pythonScript = `
import sys
from huggingface_hub import HfApi
api = HfApi(token="${env.HF_TOKEN}")
api.upload_file(
    path_or_fileobj="${tmpFile.replace(/\\/g, '\\\\')}",
    path_in_repo="${hfPath}",
    repo_id="${env.HF_REPO}",
    repo_type="dataset",
    commit_message="Add artwork: ${species} Lv.${level}"
)
print("OK")
`;

    const scriptFile = path.join(os.tmpdir(), `hf-script-${Date.now()}.py`);
    fs.writeFileSync(scriptFile, pythonScript);

    try {
      execSync(`python "${scriptFile}"`, { stdio: 'pipe' });
    } finally {
      fs.unlinkSync(scriptFile);
      fs.unlinkSync(tmpFile);
    }

    const artworkUrl = `${env.HF_ARTWORK_URL}/${species}/${filename}`;

    res.json({
      success: true,
      path: hfPath,
      url: artworkUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error?.message);
    res.status(500).json({ error: 'Upload failed', details: error?.message });
  }
});

uploadRouter.get('/artwork/:species', (_req, res) => {
  const { species } = _req.params;
  const checkpoints = [1, 5, 10, 15, 20];

  const urls = checkpoints.map((cp) => ({
    level: cp,
    filename: `lv${String(cp).padStart(2, '0')}.png`,
    url: `${env.HF_ARTWORK_URL}/${species}/lv${String(cp).padStart(2, '0')}.png`,
  }));

  res.json({ species, artworks: urls });
});
