import type { RequestHandler } from 'express';
import multer from 'multer';
import path from 'node:path';

export const POSTER_DIRECTORY = path.resolve(process.env.POSTER_DIRECTORY || 'uploads/posters');
export const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const formats: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_POSTER_BYTES, files: 1, fields: 0, parts: 2 },
  fileFilter: (_req, file, done) => {
    const mime = formats[path.extname(file.originalname).toLowerCase()];
    if (!mime || mime !== file.mimetype) return done(new Error('Use uma imagem JPEG, PNG ou WEBP válida.'));
    done(null, true);
  },
}).single('poster');

export const receivePoster: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (error) {
      const tooLarge = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({ message: tooLarge ? 'O poster deve ter no máximo 5 MB.' : 'Envie somente um poster JPEG, PNG ou WEBP válido.' });
      return;
    }
    if (!req.file) { res.status(400).json({ message: 'Selecione uma imagem para o poster.' }); return; }
    next();
  });
};
