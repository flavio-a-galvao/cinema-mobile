import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import Filme from '../models/Filme';
import { POSTER_DIRECTORY } from '../middlewares/posterUpload';

export async function uploadPoster(req: Request, res: Response) {
  const movie = await Filme.findByPk(Number(req.params.id));
  if (!movie) return res.status(404).json({ message: 'Filme não encontrado.' });
  if (!req.file) return res.status(400).json({ message: 'Selecione uma imagem.' });
  let normalized: Buffer;
  try {
    // Decodificar e recodificar remove metadados e conteúdo anexado ao arquivo.
    const image = sharp(req.file.buffer, { limitInputPixels: 20000000, failOn: 'warning' });
    const metadata = await image.metadata();
    const expected: Record<string, string> = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
    if (metadata.format !== expected[req.file.mimetype] || (metadata.pages ?? 1) > 1) throw new Error('Formato inválido');
    normalized = await image.rotate().resize({ width: 1600, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    return res.status(400).json({ message: 'O arquivo não contém uma imagem JPEG, PNG ou WEBP válida.' });
  }
  const filename = randomUUID() + '.webp';
  const target = path.join(POSTER_DIRECTORY, filename);
  await mkdir(POSTER_DIRECTORY, { recursive: true });
  await writeFile(target, normalized, { flag: 'wx' });
  try {
    await movie.update({ poster_url: '/posters/' + filename });
  } catch (error) {
    await unlink(target).catch(() => undefined);
    throw error;
  }
  return res.status(200).json(movie);
}
