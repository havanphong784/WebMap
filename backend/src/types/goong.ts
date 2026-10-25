export interface LineGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface GoongRoute {
  geometry: LineGeometry;
  distance: number | null;
  duration: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  source: string;
}

export interface GoongPlace {
  id: string;
  source: string;
  kind: string;
  place_id: string | null;
  reference: string | null;
  name: string;
  address: string;
  formatted_address: string;
  display_name: string;
  lat: number | null;
  lng: number | null;
  lon: number | null;
  url: string | null;
  types: string[];
  plus_code: unknown;
  compound: unknown;
  deprecated_description: unknown;
  deprecated_compound: unknown;
  address_components: unknown[];
  [key: string]: unknown;
}

export interface GoongSearchResult extends Partial<GoongPlace> {
  id: string;
  source: string;
  kind: string;
  place_id?: string | null;
  reference?: string | null;
  display_name: string;
  name: string;
  secondary_text?: string;
  description?: string;
  structured_formatting?: unknown;
  compound?: unknown;
  deprecated_description?: unknown;
  deprecated_compound?: unknown;
  has_children?: boolean;
  types: string[];
  distance_meters?: number | null;
}
