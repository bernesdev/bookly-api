import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class BookingErrorHandler {
  private readonly logger = new Logger(BookingErrorHandler.name);

  handle(error: unknown, operation: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const details = this.getErrorDetails(error);
    const code = this.getFirestoreCode(details.code);
    const message = details.message?.toLowerCase() ?? '';

    this.logger.error(
      `Error while ${operation}: ${details.message ?? 'unknown error'}`,
      details.stack,
    );

    if (
      code === 'failed-precondition' ||
      message.includes('requires an index')
    ) {
      throw new InternalServerErrorException(
        'Firestore index required for this booking query',
      );
    }

    if (code === 'invalid-argument') {
      throw new BadRequestException('Invalid booking query parameters');
    }

    if (code === 'unavailable') {
      throw new ServiceUnavailableException(
        'Booking service is temporarily unavailable',
      );
    }

    throw new InternalServerErrorException(
      `Unexpected error while ${operation}`,
    );
  }

  private getFirestoreCode(code: unknown): string | undefined {
    if (typeof code === 'string') {
      return code.toLowerCase();
    }

    if (typeof code === 'number') {
      if (code === 9) return 'failed-precondition';
      if (code === 3) return 'invalid-argument';
      if (code === 14) return 'unavailable';
    }

    return undefined;
  }

  private getErrorDetails(error: unknown): {
    code?: unknown;
    message?: string;
    stack?: string;
  } {
    if (error instanceof Error) {
      const maybeWithCode = error as Error & { code?: unknown };
      return {
        code: maybeWithCode.code,
        message: error.message,
        stack: error.stack,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      return {
        code: record.code,
        message:
          typeof record.message === 'string' ? record.message : 'Unknown error',
        stack: typeof record.stack === 'string' ? record.stack : undefined,
      };
    }

    return {
      message: typeof error === 'string' ? error : 'Unknown error',
    };
  }
}
