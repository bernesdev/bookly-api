import { GeonamesErrorDto } from '../dtos/geonames.dto';

export function isGeonamesError(
  response: unknown,
): response is GeonamesErrorDto {
  return !!response && typeof response === 'object' && 'status' in response;
}
