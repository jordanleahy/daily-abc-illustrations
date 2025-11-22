import { useState } from 'react';
import { GeolocationData } from '@/types/trickMedia';

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async (): Promise<GeolocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setIsLoading(false);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof GeolocationPositionError
        ? getGeolocationErrorMessage(err.code)
        : 'Failed to get location';
      setError(errorMessage);
      return null;
    }
  };

  return { requestLocation, isLoading, error };
}

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location permission denied';
    case 2:
      return 'Location unavailable';
    case 3:
      return 'Location request timed out';
    default:
      return 'Failed to get location';
  }
}
