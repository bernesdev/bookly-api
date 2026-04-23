export interface Accommodation {
  id: string;
  name: string;
  price: AccommodationPrice;
  rating: string;
  image: string;
  details: AccommodationDetails;
  location: AccommodationLocation;
}

export interface AccommodationPrice {
  oldPrice: number | undefined;
  currentPrice: number;
  discount: number | undefined;
  discountPercentage: number | undefined;
}

export interface AccommodationDetails {
  beds: number;
  bathrooms: number;
  hasBreakfast: boolean;
  amenities: AccommodationAmenity[];
  description: string;
}

export interface AccommodationLocation {
  id: string;
  city: string;
  country: string;
  coordinates: AccommodationCoordinates;
  address: AccommodationAddress;
  distanceToCenter: number;
}

export interface AccommodationCoordinates {
  lat: number;
  lng: number;
}

export interface AccommodationAddress {
  street: string;
  number: string;
}

export interface AccommodationAmenity {
  id: string;
  name: string;
}
