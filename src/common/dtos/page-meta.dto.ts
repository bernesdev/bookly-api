import { encodeCursor } from '../utils/cursor.util';

export class PageMetaDto {
  readonly limit: number;
  readonly itemCount: number;
  readonly hasNextPage: boolean;
  readonly nextCursor?: string;

  constructor({
    limit,
    itemCount,
    nextCursor,
  }: {
    limit: number;
    itemCount: number;
    nextCursor?: object;
  }) {
    this.limit = limit;
    this.itemCount = itemCount;
    this.hasNextPage = Boolean(nextCursor);
    this.nextCursor = nextCursor ? encodeCursor(nextCursor) : undefined;
  }
}
