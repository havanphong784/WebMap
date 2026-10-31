export interface WeatherQueryParams {
  lat?: string;
  lng?: string;
}

export interface WeatherTileParams {
  layer: string;
  z: string;
  x: string;
  y: string;
}

export interface WeatherApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
