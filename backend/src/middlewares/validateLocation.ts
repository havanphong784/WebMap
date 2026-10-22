/**
 * Location Validation Middleware
 * Validates location data before creating or updating
 */

import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/apiResponse.js';

export const VALID_CATEGORIES = [
  'restaurant',
  'cafe',
  'hotel',
  'attraction',
  'park',
  'museum',
  'shopping',
  'entertainment',
  'transport',
  'other',
] as const;

export type LocationCategory = (typeof VALID_CATEGORIES)[number];

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_NAME_LENGTH = 255;
const MAX_ADDRESS_LENGTH = 500;
const MAX_REVIEW_LENGTH = 2000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

// Latitude range: -90 to 90
// Longitude range: -180 to 180
const isValidCoordinate = (lat: unknown, lng: unknown): boolean => {
  const latNum = Number.parseFloat(String(lat));
  const lngNum = Number.parseFloat(String(lng));
  return (
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
};

const isValidUrl = (url?: unknown): boolean => {
  if (!url) return true; // Optional field
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidTags = (tags: unknown): boolean => {
  if (!Array.isArray(tags)) return false;
  if (tags.length > MAX_TAGS) return false;
  return tags.every(
    (tag) =>
      typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= MAX_TAG_LENGTH,
  );
};

export const validateLocationCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { name, address, lat, lng, category, rating, review_text, image_url, tags } = req.body;

  // Required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    sendError(res, {
      status: 400,
      message: 'Tên địa điểm là bắt buộc và phải là chuỗi',
    });
    return;
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    sendError(res, {
      status: 400,
      message: `Tên địa điểm không được vượt quá ${MAX_NAME_LENGTH} ký tự`,
    });
    return;
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    sendError(res, {
      status: 400,
      message: 'Địa chỉ là bắt buộc và phải là chuỗi',
    });
    return;
  }

  if (address.trim().length > MAX_ADDRESS_LENGTH) {
    sendError(res, {
      status: 400,
      message: `Địa chỉ không được vượt quá ${MAX_ADDRESS_LENGTH} ký tự`,
    });
    return;
  }

  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    sendError(res, {
      status: 400,
      message: 'Tọa độ (lat, lng) là bắt buộc',
    });
    return;
  }

  if (!isValidCoordinate(lat, lng)) {
    sendError(res, {
      status: 400,
      message: 'Tọa độ không hợp lệ. Latitude: -90 đến 90, Longitude: -180 đến 180',
    });
    return;
  }

  // Optional fields with validation
  if (category && !VALID_CATEGORIES.includes(category)) {
    sendError(res, {
      status: 400,
      message: `Danh mục không hợp lệ. Các danh mục hợp lệ: ${VALID_CATEGORIES.join(', ')}`,
    });
    return;
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = Number.parseInt(String(rating), 10);
    if (Number.isNaN(ratingNum) || ratingNum < MIN_RATING || ratingNum > MAX_RATING) {
      sendError(res, {
        status: 400,
        message: `Đánh giá phải từ ${MIN_RATING} đến ${MAX_RATING}`,
      });
      return;
    }
  }

  if (review_text && typeof review_text !== 'string') {
    sendError(res, {
      status: 400,
      message: 'Bình luận phải là chuỗi',
    });
    return;
  }

  if (review_text && review_text.length > MAX_REVIEW_LENGTH) {
    sendError(res, {
      status: 400,
      message: `Bình luận không được vượt quá ${MAX_REVIEW_LENGTH} ký tự`,
    });
    return;
  }

  if (image_url && !isValidUrl(image_url)) {
    sendError(res, {
      status: 400,
      message: 'URL hình ảnh không hợp lệ',
    });
    return;
  }

  if (tags && !isValidTags(tags)) {
    sendError(res, {
      status: 400,
      message: `Tags phải là mảng với tối đa ${MAX_TAGS} phần tử, mỗi phần tử tối đa ${MAX_TAG_LENGTH} ký tự`,
    });
    return;
  }

  next();
};

export const validateLocationUpdate = (req: Request, res: Response, next: NextFunction): void => {
  // Similar to creation but all fields are optional
  const { name, address, lat, lng, category, rating, review_text, image_url, tags } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      sendError(res, {
        status: 400,
        message: 'Tên địa điểm phải là chuỗi không rỗng',
      });
      return;
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      sendError(res, {
        status: 400,
        message: `Tên địa điểm không được vượt quá ${MAX_NAME_LENGTH} ký tự`,
      });
      return;
    }
  }

  if (address !== undefined) {
    if (typeof address !== 'string' || address.trim().length === 0) {
      sendError(res, {
        status: 400,
        message: 'Địa chỉ phải là chuỗi không rỗng',
      });
      return;
    }
    if (address.trim().length > MAX_ADDRESS_LENGTH) {
      sendError(res, {
        status: 400,
        message: `Địa chỉ không được vượt quá ${MAX_ADDRESS_LENGTH} ký tự`,
      });
      return;
    }
  }

  if ((lat !== undefined || lng !== undefined) && !isValidCoordinate(lat, lng)) {
    sendError(res, {
      status: 400,
      message: 'Tọa độ không hợp lệ',
    });
    return;
  }

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    sendError(res, {
      status: 400,
      message: 'Danh mục không hợp lệ',
    });
    return;
  }

  if (rating !== undefined && rating !== null) {
    const ratingNum = Number.parseInt(String(rating), 10);
    if (Number.isNaN(ratingNum) || ratingNum < MIN_RATING || ratingNum > MAX_RATING) {
      sendError(res, {
        status: 400,
        message: `Đánh giá phải từ ${MIN_RATING} đến ${MAX_RATING}`,
      });
      return;
    }
  }

  if (review_text !== undefined && review_text && typeof review_text !== 'string') {
    sendError(res, {
      status: 400,
      message: 'Bình luận phải là chuỗi',
    });
    return;
  }

  if (review_text && review_text.length > MAX_REVIEW_LENGTH) {
    sendError(res, {
      status: 400,
      message: `Bình luận không được vượt quá ${MAX_REVIEW_LENGTH} ký tự`,
    });
    return;
  }

  if (image_url !== undefined && image_url && !isValidUrl(image_url)) {
    sendError(res, {
      status: 400,
      message: 'URL hình ảnh không hợp lệ',
    });
    return;
  }

  if (tags !== undefined && !isValidTags(tags)) {
    sendError(res, {
      status: 400,
      message: 'Tags phải là mảng với tối đa 10 phần tử',
    });
    return;
  }

  next();
};
