import express from 'express';
import path from 'path';
import { env } from '../config/env.js';
import { petsRouter } from './routes/pets.js';
import { speciesRouter } from './routes/species.js';
import { usersRouter } from './routes/users.js';
import { uploadRouter } from './routes/upload.js';

const app = express();
const PORT = parseInt(process.env['WEB_PORT'] ?? '3000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(import.meta.dirname, 'public')));

app.use('/api/pets', petsRouter);
app.use('/api/species', speciesRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);

app.get('/', (_req, res) => {
  res.sendFile(path.join(import.meta.dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Web admin running at http://localhost:${PORT}`);
});
