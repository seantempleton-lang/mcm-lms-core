import path from 'path';

export const documentsRoot = path.resolve(process.env.DOCUMENTS_ROOT || path.join(process.cwd(), 'storage', 'documents'));
