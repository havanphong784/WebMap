import exifr from 'exifr';

/**
 * Extracts GPS coordinates (latitude, longitude) from an image file.
 * @param {File} file - The image file object.
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const extractGPS = async (file) => {
  try {
    const output = await exifr.gps(file);
    if (output && output.latitude && output.longitude) {
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
