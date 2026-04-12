import { Prisma } from '@prisma/client';

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function mapPrismaError(error, fallbackMessage = 'Database error') {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new HttpError(409, 'Resource already exists');
    }

    if (error.code === 'P2025') {
      return new HttpError(404, 'Resource not found');
    }
  }

  return new HttpError(500, fallbackMessage);
}
