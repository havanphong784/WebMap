import assert from 'node:assert/strict';
import test from 'node:test';
import type { Response } from 'express';
import pool from '../src/config/db.js';
import * as locController from '../src/controllers/locationController.js';
import * as goongService from '../src/services/goongMapService.js';
import * as locService from '../src/services/locationService.js';
import type { AsyncRequestHandler, AuthenticatedRequest } from '../src/types/http.js';

test('http type abstractions and utilities compile and type correctly', () => {
  const handler: AsyncRequestHandler = async (_req, res) => {
    res.status(200).json({ ok: true });
  };
  assert.equal(typeof handler, 'function');
});

test('goongMapService geometry and parsing utilities', () => {
  assert.deepEqual(goongService.parseLngLatString('105.85,21.02'), [105.85, 21.02]);
  assert.equal(goongService.parseLngLatString('invalid'), null);
  assert.equal(goongService.parseLngLatString(''), null);

  const geom = goongService.makeLineGeometry([
    [105.8, 21.0],
    [105.9, 21.1],
  ]);
  assert.equal(geom.type, 'LineString');
  assert.equal(geom.coordinates.length, 2);

  const decoded = goongService.decodePolylineToLineString('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert.equal(decoded.type, 'LineString');
  assert.ok(decoded.coordinates.length > 0);

  const place = goongService.normalizeGoongPlace(null, {
    place_id: 'p1',
    description: 'Hanoi',
    lat: 21.02,
    lng: 105.85,
  });
  assert.equal(place.id, 'p1');
  assert.equal(place.lat, 21.02);
  assert.equal(place.lng, 105.85);
});

test('locationService operations and nearby location grouping', async (t) => {
  const orig = pool.query;
  const queries: { sql: string; vals: unknown[] }[] = [];
  t.after(() => {
    pool.query = orig;
  });

  pool.query = (async (sql: string, vals: unknown[] = []) => {
    queries.push({ sql, vals });
    if (sql.includes('SELECT COUNT(*) as total\n    FROM locations l\n    WHERE l.lat BETWEEN')) {
      return { rows: [{ total: '3' }] };
    }
    if (sql.includes('WHERE l.id = $1')) {
      return { rows: [{ id: Number(vals[0]), name: 'Detail Loc' }] };
    }
    if (sql.includes('SELECT \n  l.*,\n  u.name AS user_name')) {
      return {
        rows: [
          {
            id: 1,
            user_id: 'u1',
            name: 'Coffee A',
            lat: 21.0285,
            lng: 105.8542,
            likes_count: 5,
          },
          {
            id: 2,
            user_id: 'u2',
            name: 'Coffee A Review 2',
            lat: 21.02851, // within 0.0003 threshold of anchor
            lng: 105.85421,
            likes_count: 10,
          },
          {
            id: 3,
            user_id: 'u3',
            name: 'Park B',
            lat: 21.05,
            lng: 105.9,
            likes_count: 2,
          },
        ],
      };
    }
    if (sql.includes('INSERT INTO locations')) {
      return {
        rows: [
          {
            id: 10,
            user_id: vals[0],
            name: vals[1],
            address: vals[2],
            category: vals[3],
            review_text: vals[4],
            rating: vals[5],
            lat: vals[6],
            lng: vals[7],
            image_url: vals[8],
            is_public: vals[9],
            tags: vals[10],
          },
        ],
      };
    }
    if (sql.includes('DELETE FROM locations WHERE id = $1 AND user_id = $2')) {
      if (vals[0] === 'loc_delete') {
        return { rows: [{ id: 99, user_id: 'u1' }] };
      }
      return { rows: [] };
    }
    if (sql.includes('WHERE l.id = $1')) {
      return { rows: [{ id: Number(vals[0]), name: 'Detail Loc' }] };
    }
    if (sql.includes('SELECT DISTINCT unnest(tags) AS tag')) {
      return { rows: [{ tag: 'cafe' }, { tag: 'food' }] };
    }
    return { rows: [] };
  }) as never;

  const listRes = await locService.listLocations({
    userId: 'u1',
    minLat: 20,
    maxLat: 22,
    minLng: 105,
    maxLng: 106,
  });
  assert.equal(listRes.pagination.total, 3);
  // Coffee A and Coffee A Review 2 should be grouped together into representative Coffee A Review 2 (10 likes)
  assert.equal(listRes.data.length, 2);
  const groupedItem = listRes.data.find((item) => item.id === 2);
  assert.ok(groupedItem);
  assert.equal(groupedItem.review_count, 2);

  const created = await locService.createLocation({
    user_id: 'u1',
    name: 'New Cafe',
    lat: 21.0,
    lng: 105.8,
  });
  assert.equal(created.id, 10);
  assert.equal(created.name, 'New Cafe');

  const deleted = await locService.deleteLocation({ locationId: 'loc_delete', userId: 'u1' });
  assert.equal(deleted.id, 99);

  await assert.rejects(
    () => locService.deleteLocation({ locationId: 'non_existent', userId: 'u1' }),
    /Không tìm thấy địa điểm/,
  );

  const detail = await locService.getLocationDetail({ locationId: 10, userId: 'u1' });
  assert.equal(detail?.id, 10);

  const tags = await locService.listUniqueTags();
  assert.deepEqual(tags, ['cafe', 'food']);
});

test('locationController validates coordinate query parameters', async () => {
  let capturedStatus = 0;
  let capturedPayload: any = null;
  const mockRes = {
    status: (s: number) => {
      capturedStatus = s;
      return {
        json: (data: any) => {
          capturedPayload = data;
          return mockRes;
        },
      };
    },
  } as unknown as Response;

  const mockReq = {
    query: { minLng: '', maxLng: '' },
    user: undefined,
  } as unknown as AuthenticatedRequest;

  await locController.getLocations(mockReq, mockRes, () => {});
  assert.equal(capturedStatus, 200);
  assert.equal(capturedPayload?.message, 'Thiếu tham số tọa độ');
  assert.deepEqual(capturedPayload?.data, []);
});

test('locationController guards unauthenticated and invalid requests', async () => {
  let capturedStatus = 0;
  let capturedPayload: any = null;
  const mockRes = {
    status: (s: number) => {
      capturedStatus = s;
      return {
        json: (data: any) => {
          capturedPayload = data;
          return mockRes;
        },
      };
    },
  } as unknown as Response;

  // Unauthenticated create
  const unauthReq = { body: {}, user: undefined, params: { id: 'loc1' }, query: {} } as unknown as AuthenticatedRequest;
  await locController.createLocationEntry(unauthReq, mockRes, () => {});
  assert.equal(capturedStatus, 401);

  // Unauthenticated delete
  await locController.deleteLocationEntry(unauthReq, mockRes, () => {});
  assert.equal(capturedStatus, 401);

  // Unauthenticated following
  await locController.getFollowingLocations(unauthReq, mockRes, () => {});
  assert.equal(capturedStatus, 401);

  // Reverse geocode missing coords
  const missingGeoReq = { query: {} } as unknown as AuthenticatedRequest;
  await locController.reverseGeocode(missingGeoReq, mockRes, () => {});
  assert.equal(capturedStatus, 400);

  // Search address missing query
  const missingSearchReq = { query: {} } as unknown as AuthenticatedRequest;
  await locController.searchAddress(missingSearchReq, mockRes, () => {});
  assert.equal(capturedStatus, 400);

  // Goong place missing place_id
  const missingPlaceReq = { query: {} } as unknown as AuthenticatedRequest;
  await locController.getGoongPlace(missingPlaceReq, mockRes, () => {});
  assert.equal(capturedStatus, 400);
});

test('goongMapService edge cases and fallback handling', async () => {
  assert.equal(await goongService.getRouteForPoints([]), null);
  assert.equal(await goongService.getRouteForPoints([[105.8, 21.0]]), null);

  const emptyLine = goongService.decodePolylineToLineString('');
  assert.deepEqual(emptyLine.coordinates, []);

  const fallbackPlace = goongService.normalizeGoongPlace(null, {
    place_id: 'fallback_1',
    description: 'Custom Place, Hanoi',
    lat: '21.05',
    lng: '105.82',
  });
  assert.equal(fallbackPlace.id, 'fallback_1');
  assert.equal(fallbackPlace.lat, 21.05);
  assert.equal(fallbackPlace.lng, 105.82);
  assert.equal(fallbackPlace.name, 'Custom Place');
});

