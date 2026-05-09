import exifr from 'exifr';

/**
 * Extracts GPS coordinates (latitude, longitude) from an image file.
 * @param {File} file - The image file object.
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const extractGPS = async (file) => {
  try {
    // Only extract GPS data, much faster than full EXIF scan
    const output = await exifr.gps(file);
    if (output && typeof output.latitude === 'number' && typeof output.longitude === 'number') {
      return {
        lat: output.latitude,
        lng: output.longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
};

