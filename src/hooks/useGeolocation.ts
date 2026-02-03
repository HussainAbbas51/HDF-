import { useState, useEffect } from 'react';

interface GeolocationState {
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  position: GeolocationPosition | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    isLocationEnabled: false,
    isLoading: true,
    error: null,
    position: null,
  });

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Geolocation is not supported by this browser',
          isLocationEnabled: false,
        }));
        return false;
      }

      // Check permission status
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Location access is denied. Please enable location in your browser settings.',
          isLocationEnabled: false,
        }));
        return false;
      }

      // Try to get current position
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: null,
              isLocationEnabled: true,
              position,
            }));
            resolve(true);
          },
          (error) => {
            let errorMessage = 'Unable to retrieve location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permission.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out.';
                break;
            }
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: errorMessage,
              isLocationEnabled: false,
            }));
            resolve(false);
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
          }
        );
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check location permission',
        isLocationEnabled: false,
      }));
      return false;
    }
  };

  const startLocationMonitoring = (onLocationLost: () => void) => {
    let watchId: number;
    let isMonitoring = true;

    const startWatching = () => {
      if (!isMonitoring) return;

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            isLocationEnabled: true,
            position,
            error: null,
          }));
        },
        (error) => {
          console.warn('Location monitoring error:', error);
          setState(prev => ({
            ...prev,
            isLocationEnabled: false,
            error: 'Location access lost',
          }));
          onLocationLost();
        },
        {
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 60000,
        }
      );
    };

    // Start initial watch
    startWatching();

    // Also monitor permission changes
    const checkPermissionPeriodically = setInterval(async () => {
      if (!isMonitoring) return;

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            isLocationEnabled: false,
            error: 'Location permission denied',
          }));
          onLocationLost();
        }
      } catch (error) {
        console.warn('Permission check failed:', error);
      }
    }, 5000);

    // Return cleanup function
    return () => {
      isMonitoring = false;
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(checkPermissionPeriodically);
    };
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  return {
    ...state,
    checkLocationPermission,
    startLocationMonitoring,
  };
};