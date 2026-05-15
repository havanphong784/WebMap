/**
 * Location Validation Middleware
 * Validates location data before creating or updating
 */

import {sendError} from "../utils/apiResponse.js";

const VALID_CATEGORIES = [
  "restaurant",
  "cafe",
  "hotel",
  "attraction",
  "park",
  "museum",
  "shopping",
  "entertainment",
  "transport",
  "other"
];

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_NAME_LENGTH = 255;
const MAX_ADDRESS_LENGTH = 500;
const MAX_REVIEW_LENGTH = 2000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

// Latitude range: -90 to 90
// Longitude range: -180 to 180
const isValidCoordinate = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return (
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
};

const isValidUrl = (url) => {
  if (!url) return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidTags = (tags) => {
  if (!Array.isArray(tags)) return false;
  if (tags.length > MAX_TAGS) return false;
  return tags.every(
    (tag) =>
      typeof tag === "string" &&
      tag.trim().length > 0 &&
      tag.trim().length <= MAX_TAG_LENGTH
  );
};

export const validateLocationCreation = (req, res, next) => {
  const {name, address, lat, lng, category, rating, review_text, image_url, tags} = req.body;

  // Required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return sendError(res, {
      status: 400,
      message: "Tên địa điểm là bắt buộc và phải là chuỗi"
    });
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return sendError(res, {
      status: 400,
      message: `Tên địa điểm không được vượt quá ${MAX_NAME_LENGTH} ký tự`
    });
  }

  if (!address || typeof address !== "string" || address.trim().length === 0) {
    return sendError(res, {
      status: 400,
      message: "Địa chỉ là bắt buộc và phải là chuỗi"
    });
  }

  if (address.trim().length > MAX_ADDRESS_LENGTH) {
    return sendError(res, {
      status: 400,
      message: `Địa chỉ không được vượt quá ${MAX_ADDRESS_LENGTH} ký tự`
    });
  }

  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return sendError(res, {
      status: 400,
      message: "Tọa độ (lat, lng) là bắt buộc"
    });
  }

  if (!isValidCoordinate(lat, lng)) {
    return sendError(res, {
      status: 400,
      message: "Tọa độ không hợp lệ. Latitude: -90 đến 90, Longitude: -180 đến 180"
    });
  }

  // Optional fields with validation
  if (category && !VALID_CATEGORIES.includes(category)) {
    return sendError(res, {
      status: 400,
      message: `Danh mục không hợp lệ. Các danh mục hợp lệ: ${VALID_CATEGORIES.join(", ")}`
    });
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < MIN_RATING || ratingNum > MAX_RATING) {
      return sendError(res, {
        status: 400,
        message: `Đánh giá phải từ ${MIN_RATING} đến ${MAX_RATING}`
      });
    }
  }

  if (review_text && typeof review_text !== "string") {
    return sendError(res, {
      status: 400,
      message: "Bình luận phải là chuỗi"
    });
  }

  if (review_text && review_text.length > MAX_REVIEW_LENGTH) {
    return sendError(res, {
      status: 400,
      message: `Bình luận không được vượt quá ${MAX_REVIEW_LENGTH} ký tự`
    });
  }

  if (image_url && !isValidUrl(image_url)) {
    return sendError(res, {
      status: 400,
      message: "URL hình ảnh không hợp lệ"
    });
  }

  if (tags && !isValidTags(tags)) {
    return sendError(res, {
      status: 400,
      message: `Tags phải là mảng với tối đa ${MAX_TAGS} phần tử, mỗi phần tử tối đa ${MAX_TAG_LENGTH} ký tự`
    });
  }

  next();
};

export const validateLocationUpdate = (req, res, next) => {
  // Similar to creation but all fields are optional
  const {name, address, lat, lng, category, rating, review_text, image_url, tags} = req.body;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return sendError(res, {
        status: 400,
        message: "Tên địa điểm phải là chuỗi không rỗng"
      });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return sendError(res, {
        status: 400,
        message: `Tên địa điểm không được vượt quá ${MAX_NAME_LENGTH} ký tự`
      });
    }
  }

  if (address !== undefined) {
    if (typeof address !== "string" || address.trim().length === 0) {
      return sendError(res, {
        status: 400,
        message: "Địa chỉ phải là chuỗi không rỗng"
      });
    }
    if (address.trim().length > MAX_ADDRESS_LENGTH) {
      return sendError(res, {
        status: 400,
        message: `Địa chỉ không được vượt quá ${MAX_ADDRESS_LENGTH} ký tự`
      });
    }
  }

  if ((lat !== undefined || lng !== undefined) && !isValidCoordinate(lat, lng)) {
    return sendError(res, {
      status: 400,
      message: "Tọa độ không hợp lệ"
    });
  }

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return sendError(res, {
      status: 400,
      message: `Danh mục không hợp lệ`
    });
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < MIN_RATING || ratingNum > MAX_RATING) {
      return sendError(res, {
        status: 400,
        message: `Đánh giá phải từ ${MIN_RATING} đến ${MAX_RATING}`
      });
    }
  }

  if (review_text !== undefined && review_text && typeof review_text !== "string") {
    return sendError(res, {
      status: 400,
      message: "Bình luận phải là chuỗi"
    });
  }

  if (review_text && review_text.length > MAX_REVIEW_LENGTH) {
    return sendError(res, {
      status: 400,
      message: `Bình luận không được vượt quá ${MAX_REVIEW_LENGTH} ký tự`
    });
  }

  if (image_url !== undefined && image_url && !isValidUrl(image_url)) {
    return sendError(res, {
      status: 400,
      message: "URL hình ảnh không hợp lệ"
    });
  }

  if (tags !== undefined && !isValidTags(tags)) {
    return sendError(res, {
      status: 400,
      message: `Tags phải là mảng với tối đa ${MAX_TAGS} phần tử`
    });
  }

  next();
};
