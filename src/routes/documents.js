import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const documentsRouter = Router();

const documentsRoot = path.resolve(process.cwd(), 'storage', 'documents');
const allowedExtensions = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
  '.mp4', '.webm', '.ogg'
]);

function sanitiseFilename(originalName = 'document') {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'document';

  return `${safeBase}${extension}`;
}

async function buildAvailableFilename(originalName = 'document') {
  const initialName = sanitiseFilename(originalName);
  const extension = path.extname(initialName);
  const baseName = path.basename(initialName, extension);

  let candidate = initialName;
  let counter = 1;

  while (true) {
    try {
      await fs.access(path.join(documentsRoot, candidate));
      candidate = `${baseName}-${counter}${extension}`;
      counter += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return candidate;
      }
      throw error;
    }
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdir(documentsRoot, { recursive: true })
        .then(() => cb(null, documentsRoot))
        .catch((error) => cb(error));
    },
    filename: (req, file, cb) => {
      buildAvailableFilename(file.originalname)
        .then((filename) => cb(null, filename))
        .catch((error) => cb(error));
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return cb(new Error('Unsupported file type'));
    }
    return cb(null, true);
  }
});

documentsRouter.post('/upload', requireAuth, requireRole('ADMIN'), (req, res, next) => {
  upload.single('resource')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 25 MB.' });
      }
      return res.status(400).json({ error: error.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    return res.status(201).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/documents/${req.file.filename}`
    });
  });
});

documentsRouter.get('/:filename', async (req, res, next) => {
  try {
    const requested = req.params.filename || '';
    const safeName = path.basename(requested);

    if (!safeName || safeName !== requested) {
      return res.status(400).json({ error: 'Invalid document name' });
    }

    const filePath = path.join(documentsRoot, safeName);
    await fs.access(filePath);
    return res.sendFile(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return res.status(404).json({ error: 'Document not found' });
    }
    return next(error);
  }
});
