import exifr from 'exifr';

export interface ExifData {
  location: {
    latitude: number;
    longitude: number;
  } | null;
  capturedAt: Date | null;
}

/**
 * Extract EXIF metadata from an image file
 * Returns location coordinates and capture timestamp if available
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // Extract EXIF data from the image
    const exif = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude']
    });

    if (!exif) {
      return { location: null, capturedAt: null };
    }

    // Extract location if GPS data exists
    let location: { latitude: number; longitude: number } | null = null;
    if (exif.latitude && exif.longitude) {
      location = {
        latitude: exif.latitude,
        longitude: exif.longitude
      };
    }

    // Extract capture date - try DateTimeOriginal first, then CreateDate
    let capturedAt: Date | null = null;
    if (exif.DateTimeOriginal) {
      capturedAt = new Date(exif.DateTimeOriginal);
    } else if (exif.CreateDate) {
      capturedAt = new Date(exif.CreateDate);
    }

    return { location, capturedAt };
  } catch (error) {
    console.warn('Failed to extract EXIF data:', error);
    return { location: null, capturedAt: null };
  }
}
