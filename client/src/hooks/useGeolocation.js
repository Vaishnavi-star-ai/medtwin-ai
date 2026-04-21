import { useState, useEffect, useCallback } from 'react';

const FALLBACK = { lat: 12.9716, lng: 77.5946 }; // Bangalore center

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false); // true if we got the user's actual location

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setLocation(FALLBACK);
      setIsReal(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsReal(true);
        setLoading(false);
      },
      (err) => {
        console.log('Geolocation error, using default (Bangalore):', err.message);
        setError(err.message);
        setLocation(FALLBACK);
        setIsReal(false);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, error, loading, isReal, retry: requestLocation };
}
