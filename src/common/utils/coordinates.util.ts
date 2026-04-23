import { BadRequestException } from '@nestjs/common';

export interface ParsedCoordinates {
  lat: number;
  lng: number;
}

export function parseCoordinates(lat: number, lng: number): ParsedCoordinates {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    throw new BadRequestException('Invalid coordinates');
  }

  return {
    lat: parsedLat,
    lng: parsedLng,
  };
}
