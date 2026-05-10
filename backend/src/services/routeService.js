const ROUTE_TIMEOUT_MS = 6000;
const USER_AGENT = "AetherMapApp/1.0";

const isValidCoordinate = (point) => (
  Array.isArray(point) &&
  point.length >= 2 &&
  Number.isFinite(Number(point[0])) &&
  Number.isFinite(Number(point[1]))
);

const fetchWithTimeout = async (url, options = {}, timeout = ROUTE_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {...options, signal: controller.signal});
  } finally {
    clearTimeout(timeoutId);
  }
};

export const makeLineGeometry = (points) => ({
  type: "LineString",
  coordinates: points.map(point => [Number(point[0]), Number(point[1])]),
});

export const getRouteForPoints = async (points = []) => {
  const validPoints = points.filter(isValidCoordinate);
  if (validPoints.length < 2) return null;

  const coordinatePath = validPoints
    .map(point => `${Number(point[0])},${Number(point[1])}`)
    .join(";");

  const urls = [
    `https://router.project-osrm.org/route/v1/driving/${coordinatePath}?overview=full&geometries=geojson&steps=false`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordinatePath}?overview=full&geometries=geojson&steps=false`,
  ];

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {"User-Agent": USER_AGENT},
      });

      if (!response.ok) continue;
      const data = await response.json();
      const route = data?.routes?.[0];
      if (data?.code === "Ok" && route?.geometry) {
        return {
          geometry: route.geometry,
          distanceMeters: route.distance ?? null,
          durationSeconds: route.duration ?? null,
          source: url.includes("project-osrm") ? "osrm" : "openstreetmap-routing",
        };
      }
    } catch (error) {
      console.warn("Route provider failed:", error.message);
    }
  }

  return {
    geometry: makeLineGeometry(validPoints),
    distanceMeters: null,
    durationSeconds: null,
    source: "fallback-line",
  };
};
