import path from 'path';
import fs from 'fs/promises';

export const documentsRoot = path.resolve(process.env.DOCUMENTS_ROOT || path.join(process.cwd(), 'storage', 'documents'));

export function validateFilename(filename) {
  const safeName = path.basename(filename || '');
  if (!safeName || safeName !== filename) {
    const error = new Error('Invalid document name');
    error.status = 400;
    throw error;
  }
  return safeName;
}

function getContentType(filename) {
  const extension = path.extname(filename).toLowerCase();
  const types = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'application/ogg',
  };

  return types[extension] || 'application/octet-stream';
}

export const documentStorage = {
  type: 'local',

  async exists(filename) {
    validateFilename(filename);
    try {
      await fs.access(path.join(documentsRoot, filename));
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }
  },

  async list() {
    try {
      const entries = await fs.readdir(documentsRoot, { withFileTypes: true });
      const items = await Promise.all(
        entries
          .filter((entry) => entry.isFile())
          .map(async (entry) => {
            const fullPath = path.join(documentsRoot, entry.name);
            const stat = await fs.stat(fullPath);
            return {
              filename: entry.name,
              url: `/documents/${entry.name}`,
              sizeBytes: stat.size,
              modifiedAt: stat.mtime.toISOString(),
            };
          })
      );
      return items.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    } catch (error) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  },

  async put({ filename, body }) {
    validateFilename(filename);
    await fs.mkdir(documentsRoot, { recursive: true });
    await fs.writeFile(path.join(documentsRoot, filename), body);
  },

  async delete(filename) {
    validateFilename(filename);
    try {
      await fs.unlink(path.join(documentsRoot, filename));
    } catch (error) {
      if (error?.code === 'ENOENT') {
        const notFound = new Error('Resource not found');
        notFound.status = 404;
        throw notFound;
      }
      throw error;
    }
  },

  async getStream(filename) {
    validateFilename(filename);
    const filePath = path.join(documentsRoot, filename);
    const file = await fs.open(filePath, 'r').catch((error) => {
      if (error?.code === 'ENOENT') {
        const notFound = new Error('Document not found');
        notFound.status = 404;
        throw notFound;
      }
      throw error;
    });
    const stat = await file.stat();
    return {
      stream: file.createReadStream(),
      contentLength: stat.size,
      contentType: getContentType(filename),
      modifiedAt: stat.mtime,
    };
  },
};
