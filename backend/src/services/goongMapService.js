const GOONG_BASE_URL = "https://rsapi.goong.io";
const GOONG_TIMEOUT_MS = 7000;
const GOONG_ADMIN_UNIT_PARAMS = {
  has_deprecated_administrative_unit: "true",
};

const isConfiguredGoongKey = () => {
  const apiKey = process.env.GOONG_API_KEY;
  return Boolean(apiKey && apiKey !== "YOUR_GOONG_API_KEY");
};

const getGoongApiKey = () => {
  if (!isConfiguredGoongKey()) {
    throw new Error("GOONG_API_KEY is not configured");
  }
  return process.env.GOONG_API_KEY;
};

const fetchJsonWithTimeout = async (url, timeout = GOONG_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {signal: controller.signal});
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error_message || data?.message || `Goong request failed with status ${response.status}`;
      console.error(`[Goong Error] Status: ${response.status}, Message: ${message}`);
      throw new Error(message);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const parseLngLatString = (value = "") => {
  const [lng, lat] = value.split(",").map(item => toFiniteNumber(item?.trim()));
  if (lng === null || lat === null) return null;
  return [lng, lat];
};

const normalizeLngLat = (point) => {
  if (!Array.isArray(point) || point.length < 2) return null;
  const lng = toFiniteNumber(point[0]);
  const lat = toFiniteNumber(point[1]);
  if (lng === null || lat === null) return null;
  return [lng, lat];
};

const toGoongLatLng = (point) => {
  const normalized = normalizeLngLat(point);
  if (!normalized) return null;
  return `${normalized[1]},${normalized[0]}`;
};

const makeGoongUrl = (path, params) => {
  const url = new URL(path, GOONG_BASE_URL);
  const searchParams = new URLSearchParams(params);
  searchParams.set("api_key", getGoongApiKey());
  url.search = searchParams.toString();
  return url.toString();
};

export const makeLineGeometry = (points) => ({
  type: "LineString",
  coordinates: points
    .map(normalizeLngLat)
    .filter(Boolean),
});

export const decodePolylineToLineString = (encoded = "") => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return {
    type: "LineString",
    coordinates,
  };
};

const normalizeGoongRoute = (route, fallbackPoints) => {
  const geometry = route?.geometry?.type === "LineString"
    ? route.geometry
    : route?.overview_polyline?.points
      ? decodePolylineToLineString(route.overview_polyline.points)
      : makeLineGeometry(fallbackPoints);

  const legs = Array.isArray(route?.legs) ? route.legs : [];
  const distanceMeters = legs.reduce((sum, leg) => sum + Number(leg?.distance?.value || 0), 0) || null;
  const durationSeconds = legs.reduce((sum, leg) => sum + Number(leg?.duration?.value || 0), 0) || null;

  return {
    geometry,
    distance: distanceMeters,
    duration: durationSeconds,
    distanceMeters,
    durationSeconds,
    source: "goong",
  };
};

const getRouteForSegment = async (originPoint, destinationPoint) => {
  const origin = toGoongLatLng(originPoint);
  const destination = toGoongLatLng(destinationPoint);
  const url = makeGoongUrl("/v2/direction", {
    origin,
    destination,
    vehicle: "car",
    alternatives: "false",
  });

  const data = await fetchJsonWithTimeout(url);
  const route = data?.routes?.[0];

  if (!route) {
    throw new Error(data?.status || "Goong did not return a route");
  }

  return normalizeGoongRoute(route, [originPoint, destinationPoint]);
};

export const getRouteForPoints = async (points = []) => {
  const validPoints = points.map(normalizeLngLat).filter(Boolean);
  if (validPoints.length < 2) return null;

  const segmentRoutes = [];
  for (let index = 0; index < validPoints.length - 1; index += 1) {
    segmentRoutes.push(await getRouteForSegment(validPoints[index], validPoints[index + 1]));
  }

  const coordinates = segmentRoutes.flatMap((route, routeIndex) => {
    const routeCoordinates = route.geometry?.coordinates || [];
    return routeIndex === 0 ? routeCoordinates : routeCoordinates.slice(1);
  });

  return {
    geometry: coordinates.length
      ? {type: "LineString", coordinates}
      : makeLineGeometry(validPoints),
    distance: segmentRoutes.reduce((sum, route) => sum + Number(route.distanceMeters || 0), 0) || null,
    duration: segmentRoutes.reduce((sum, route) => sum + Number(route.durationSeconds || 0), 0) || null,
    distanceMeters: segmentRoutes.reduce((sum, route) => sum + Number(route.distanceMeters || 0), 0) || null,
    durationSeconds: segmentRoutes.reduce((sum, route) => sum + Number(route.durationSeconds || 0), 0) || null,
    source: "goong",
  };
};

export const normalizeGoongPlace = (place, fallback = {}) => {
  const location = place?.geometry?.location || {};
  const lat = toFiniteNumber(location.lat ?? fallback.lat);
  const lng = toFiniteNumber(location.lng ?? fallback.lng ?? fallback.lon);
  const formattedAddress = place?.formatted_address || fallback.description || fallback.display_name || "";
  const name = place?.name
    || fallback.structured_formatting?.main_text
    || formattedAddress.split(",")[0]
    || "Địa điểm Goong";

  return {
    id: place?.place_id || fallback.place_id || fallback.reference || `${lat},${lng}`,
    source: "goong",
    kind: "goong_place",
    place_id: place?.place_id || fallback.place_id || fallback.reference || null,
    reference: place?.reference || fallback.reference || place?.place_id || fallback.place_id || null,
    name,
    address: formattedAddress,
    formatted_address: formattedAddress,
    display_name: formattedAddress,
    lat,
    lng,
    lon: lng,
    url: place?.url || (place?.place_id ? `https://maps.goong.io/?pid=${place.place_id}` : null),
    types: Array.isArray(place?.types) ? place.types : (Array.isArray(fallback.types) ? fallback.types : []),
    plus_code: place?.plus_code || fallback.plus_code || null,
    compound: place?.compound || fallback.compound || null,
    deprecated_description: place?.deprecated_description || fallback.deprecated_description || null,
    deprecated_compound: place?.deprecated_compound || fallback.deprecated_compound || null,
    address_components: place?.address_components || fallback.address_components || [],
  };
};

export const reverseGeocodeWithGoong = async ({lat, lng}) => {
  const latNumber = toFiniteNumber(lat);
  const lngNumber = toFiniteNumber(lng);

  if (latNumber === null || lngNumber === null) {
    throw new Error("Invalid coordinates");
  }

  const url = makeGoongUrl("/v2/geocode", {
    latlng: `${latNumber},${lngNumber}`,
    limit: "1",
    ...GOONG_ADMIN_UNIT_PARAMS,
  });
  const data = await fetchJsonWithTimeout(url);
  const result = data?.results?.[0];

  if (!result) {
    throw new Error(data?.status || "Goong did not return an address");
  }

  return normalizeGoongPlace(result, {lat: latNumber, lng: lngNumber});
};

export const getGoongPlaceDetail = async (placeId) => {
  if (!placeId) {
    const error = new Error("place_id is required");
    error.status = 400;
    error.code = "GOONG_PLACE_ID_REQUIRED";
    throw error;
  }

  const url = makeGoongUrl("/v2/place/detail", {
    place_id: placeId,
    ...GOONG_ADMIN_UNIT_PARAMS,
  });
  const data = await fetchJsonWithTimeout(url);
  const result = data?.result;
  if (!result) {
    const error = new Error(data?.status || "Goong did not return place detail");
    error.status = 404;
    error.code = "GOONG_PLACE_NOT_FOUND";
    throw error;
  }
  return normalizeGoongPlace(result);
};

export const searchAddressWithGoong = async (query, {limit = 5, location, origin} = {}) => {
  const input = query?.trim();
  if (!input) return [];

  const params = {
    input,
    limit: String(limit),
    more_compound: "true",
    ...GOONG_ADMIN_UNIT_PARAMS,
  };

  if (location) params.location = location;
  if (origin) params.origin = origin;

  const url = makeGoongUrl("/v2/place/autocomplete", params);
  const data = await fetchJsonWithTimeout(url);
  const predictions = Array.isArray(data?.predictions)
    ? data.predictions.slice(0, limit)
    : [];

  const lightweightResults = predictions
    .filter(prediction => prediction?.place_id)
    .map(prediction => ({
      id: prediction.place_id,
      source: "goong",
      kind: "goong_prediction",
      place_id: prediction.place_id,
      reference: prediction.reference || prediction.place_id,
      display_name: prediction.description,
      description: prediction.description,
      name: prediction.structured_formatting?.main_text || prediction.description?.split(",")?.[0] || "Địa điểm Goong",
      secondary_text: prediction.structured_formatting?.secondary_text || "",
      structured_formatting: prediction.structured_formatting || null,
      compound: prediction.compound || null,
      deprecated_description: prediction.deprecated_description || null,
      deprecated_compound: prediction.deprecated_compound || null,
      has_children: Boolean(prediction.has_children),
      types: prediction.types || [],
      distance_meters: prediction.distance_meters ?? null,
    }));

  const detailedResults = await Promise.all(lightweightResults.map(async (prediction) => {
    try {
      const detail = await getGoongPlaceDetail(prediction.place_id);
      return {
        ...prediction,
        ...detail,
        name: detail.name || prediction.name,
        secondary_text: prediction.secondary_text,
        description: prediction.description,
        structured_formatting: prediction.structured_formatting,
        distance_meters: prediction.distance_meters,
      };
    } catch (error) {
      console.warn("Goong Place Detail hydrate failed:", error.message);
      return prediction;
    }
  }));

  return detailedResults;
};

export {isConfiguredGoongKey};
