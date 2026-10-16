/**
 * Cấu hình tập trung cho Goong Maps + MapLibre.
 *
 * Goong cung cấp vector tile style chuẩn MapLibre Style Specification, có thể
 * dùng trực tiếp với maplibre-gl-js qua URL: https://tiles.goong.io/assets/goong_map_web.json
 *
 * Tham khảo: https://docs.goong.io
 */

import {runtimeConfig} from "../../../config/runtimeConfig.js";

const GOONG_TILES_KEY = runtimeConfig.goongTilesKey;

export const GOONG_MAP_STYLE = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_TILES_KEY}`;

// Vùng khởi tạo: Đà Nẵng (vĩ độ trung tâm app)
export const INITIAL_VIEW_STATE = {
  longitude: 108.249476,
  latitude: 15.972143,
  zoom: 13,
  pitch: 45,
  bearing: 0,
};

export const MAP_LIMITS = {
  minZoom: 3,
  maxZoom: 18,
};

// Ngưỡng zoom cho hiển thị marker tùy chỉnh (LocationCard React)
export const MARKER_ZOOM = {
  CLUSTER_BREAK: 14, // Cluster ngừng gom ở zoom này (>= MapLibre tự bung point)
  CARD_VISIBLE: 14, // LocationCard React chỉ render ở zoom này trở lên
  ACTIVE_FALLBACK: 13, // Active marker (đang chọn) hiển thị từ zoom này
};

// Layer ID dùng chung — tránh hardcode rải rác
export const LAYER_IDS = {
  CLUSTERS: "clusters",
  CLUSTER_COUNT: "cluster-count",
  UNCLUSTERED_POINT: "unclustered-point",
  UNCLUSTERED_LABEL: "unclustered-label",
  ROUTE: "route-layer",
  WEATHER: "weather-layer",
};

export const SOURCE_IDS = {
  LOCATIONS: "saved-locations-source",
  ROUTE: "route-source",
  WEATHER: "weather-source",
};

// Bảng nhận dạng POI từ Goong style — để xử lý click vào POI gốc của map
export const GOONG_POI_LAYER_TOKENS = ["poi", "place", "label"];

export const isGoongPoiFeature = (feature) => {
  const layerId = feature?.layer?.id?.toLowerCase?.() || "";
  const props = feature?.properties || {};
  const hasName = Boolean(props.name || props.name_vi || props.name_en || props.title);
  return hasName && GOONG_POI_LAYER_TOKENS.some((token) => layerId.includes(token));
};

export const getPoiName = (feature) => {
  const props = feature?.properties || {};
  return props.name || props.name_vi || props.name_en || props.title || null;
};
