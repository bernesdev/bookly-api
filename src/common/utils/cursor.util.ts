import { BadRequestException } from '@nestjs/common';

export type CursorValidator<T> = (value: unknown) => value is T;

export type CursorSchema = Record<string, CursorValidator<unknown>>;

type InferCursorValue<TValidator> =
  TValidator extends CursorValidator<infer TValue> ? TValue : never;

export type DecodedCursor<TSchema extends CursorSchema> = {
  [K in keyof TSchema]: InferCursorValue<TSchema[K]>;
};

export function encodeCursor(cursor: object): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor<TSchema extends CursorSchema>({
  cursor,
  schema,
}: {
  cursor: string;
  schema: TSchema;
}): DecodedCursor<TSchema> {
  try {
    const payload = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(payload);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('Invalid cursor format');
    }

    const record = parsed as Record<string, unknown>;
    const decoded = {} as DecodedCursor<TSchema>;

    for (const [key, validator] of Object.entries(schema)) {
      const value = record[key];

      if (!validator(value)) {
        throw new BadRequestException('Invalid cursor format');
      }

      decoded[key as keyof TSchema] =
        value as DecodedCursor<TSchema>[keyof TSchema];
    }

    return decoded;
  } catch {
    throw new BadRequestException('Invalid cursor format');
  }
}
