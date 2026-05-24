import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { documentStorage, validateFilename } from '../utils/storage.js';

export const documentsRouter = Router();

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

  while (await documentStorage.exists(candidate)) {
    candidate = `${baseName}-${counter}${extension}`;
    counter += 1;
  }

  return candidate;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return cb(new Error('Unsupported file type'));
    }
    return cb(null, true);
  }
});

documentsRouter.post('/upload', requireAuth, requireRole('ADMIN'), (req, res) => {
  upload.single('resource')(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 25 MB.' });
      }
      return res.status(400).json({ error: error.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filename = await buildAvailableFilename(req.file.originalname);
      await documentStorage.put({ filename, body: req.file.buffer });

      return res.status(201).json({
        filename,
        originalName: req.file.originalname,
        url: `/documents/${filename}`,
        storage: documentStorage.type
      });
    } catch (uploadError) {
      console.error(uploadError);
      return res.status(uploadError.status || 500).json({ error: uploadError.message || 'Upload failed' });
    }
  });
});

documentsRouter.get('/:filename', async (req, res, next) => {
  try {
    const filename = validateFilename(req.params.filename || '');
    const object = await documentStorage.getStream(filename);

    res.setHeader('Content-Type', object.contentType);
    if (object.contentLength !== undefined) {
      res.setHeader('Content-Length', String(object.contentLength));
    }
    if (object.modifiedAt) {
      res.setHeader('Last-Modified', new Date(object.modifiedAt).toUTCString());
    }

    return object.stream.pipe(res);
  } catch (error) {
    if (error?.status === 400) {
      return res.status(400).json({ error: 'Invalid document name' });
    }
    if (error?.status === 404) {
      return res.status(404).json({ error: 'Document not found' });
    }
    return next(error);
  }
});
