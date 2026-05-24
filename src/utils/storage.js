import path from 'path';
import fs from 'fs/promises';
import { Readable } from 'stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export const documentsRoot = path.resolve(process.env.DOCUMENTS_ROOT || path.join(process.cwd(), 'storage', 'documents'));

function isS3Enabled() {
  return (process.env.DOCUMENT_STORAGE || '').toLowerCase() === 's3';
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

function validateFilename(filename) {
  const safeName = path.basename(filename || '');
  if (!safeName || safeName !== filename) {
    const error = new Error('Invalid document name');
    error.status = 400;
    throw error;
  }
  return safeName;
}

function streamToReadable(body) {
  if (body instanceof Readable) return body;
  if (body?.transformToWebStream) {
    return Readable.fromWeb(body.transformToWebStream());
  }
  return Readable.from(body);
}

function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || 'garage';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) {
    throw new Error('S3 document storage requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    endpoint,
    region,
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') !== 'false',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function createLocalStorage() {
  return {
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
}

function createS3Storage() {
  const client = createS3Client();
  const bucket = process.env.S3_BUCKET;
  const prefix = (process.env.S3_PREFIX || '').replace(/^\/+|\/+$/g, '');
  const keyFor = (filename) => `${prefix ? `${prefix}/` : ''}${validateFilename(filename)}`;

  return {
    type: 's3',

    async exists(filename) {
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: keyFor(filename) }));
        return true;
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return false;
        throw error;
      }
    },

    async list() {
      const items = [];
      let ContinuationToken;
      do {
        const result = await client.send(new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix ? `${prefix}/` : undefined,
          ContinuationToken,
        }));

        for (const item of result.Contents || []) {
          const filename = prefix ? item.Key.replace(`${prefix}/`, '') : item.Key;
          if (!filename || filename.includes('/')) continue;
          items.push({
            filename,
            url: `/documents/${filename}`,
            sizeBytes: item.Size || 0,
            modifiedAt: item.LastModified?.toISOString() || null,
          });
        }
        ContinuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
      } while (ContinuationToken);

      return items.sort((a, b) => new Date(b.modifiedAt || 0) - new Date(a.modifiedAt || 0));
    },

    async put({ filename, body }) {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: keyFor(filename),
        Body: body,
        ContentType: getContentType(filename),
      }));
    },

    async delete(filename) {
      if (!await this.exists(filename)) {
        const notFound = new Error('Resource not found');
        notFound.status = 404;
        throw notFound;
      }
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: keyFor(filename) }));
    },

    async getStream(filename) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: keyFor(filename) }));
        return {
          stream: streamToReadable(result.Body),
          contentLength: result.ContentLength,
          contentType: result.ContentType || getContentType(filename),
          modifiedAt: result.LastModified,
        };
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey') {
          const notFound = new Error('Document not found');
          notFound.status = 404;
          throw notFound;
        }
        throw error;
      }
    },
  };
}

export const documentStorage = isS3Enabled() ? createS3Storage() : createLocalStorage();
export { validateFilename };
