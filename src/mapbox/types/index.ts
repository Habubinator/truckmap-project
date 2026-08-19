export interface Geometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface Properties {
  id: number;
  type: string;
  name: string;
  address: string;
  number_of_parking_spots: number;
  verified: boolean;
  price_per_night: boolean;
  security_rating: number;
  google_maps_link: string;
  mesiboId?: number;
}

export interface Feature {
  type: 'Feature';
  geometry: Geometry;
  properties: Properties;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}
