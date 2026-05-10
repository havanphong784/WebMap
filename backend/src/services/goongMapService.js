const GOONG_BASE_URL = "https://rsapi.goong.io";
const GOONG_TIMEOUT_MS = 7000;

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
      const message = data?.error_message || data?.message || `Goong request failed with ${response.status}`;
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

export const getRouteForPoints = async (points = []) => {
  const validPoints = points.map(normalizeLngLat).filter(Boolean);
  if (validPoints.length < 2) return null;

  const origin = toGoongLatLng(validPoints[0]);
  const destination = validPoints.slice(1).map(toGoongLatLng).join(";");
  const url = makeGoongUrl("/Direction", {
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

  return normalizeGoongRoute(route, validPoints);
};

export const reverseGeocodeWithGoong = async ({lat, lng}) => {
  const latNumber = toFiniteNumber(lat);
  const lngNumber = toFiniteNumber(lng);

  if (latNumber === null || lngNumber === null) {
    throw new Error("Invalid coordinates");
  }

  const url = makeGoongUrl("/Geocode", {
    latlng: `${latNumber},${lngNumber}`,
  });
  const data = await fetchJsonWithTimeout(url);
  const result = data?.results?.[0];

  if (!result) {
    throw new Error(data?.status || "Goong did not return an address");
  }

  return {
    display_name: result.formatted_address,
    address: result.address_components || [],
    place_id: result.place_id,
    source: "goong",
  };
};

const getGoongPlaceDetail = async (placeId) => {
  const url = makeGoongUrl("/Place/Detail", {
    place_id: placeId,
  });
  const data = await fetchJsonWithTimeout(url);
  return data?.result || null;
};

export const searchAddressWithGoong = async (query, {limit = 5} = {}) => {
  const input = query?.trim();
  if (!input) return [];

  const url = makeGoongUrl("/Place/AutoComplete", {
    input,
    limit: String(limit),
  });
  const data = await fetchJsonWithTimeout(url);
  const predictions = Array.isArray(data?.predictions)
    ? data.predictions.slice(0, limit)
    : [];

  const detailedResults = await Promise.all(predictions.map(async (prediction) => {
    if (!prediction?.place_id) return null;

    try {
      const detail = await getGoongPlaceDetail(prediction.place_id);
      const location = detail?.geometry?.location;
      const lat = toFiniteNumber(location?.lat);
      const lng = toFiniteNumber(location?.lng);

      if (lat === null || lng === null) return null;

      return {
        display_name: detail.formatted_address || prediction.description,
        lat,
        lon: lng,
        lng,
        place_id: prediction.place_id,
        source: "goong",
      };
    } catch (error) {
      console.warn("Goong Place Detail failed:", error.message);
      return null;
    }
  }));

  return detailedResults.filter(Boolean);
};

export {isConfiguredGoongKey};
