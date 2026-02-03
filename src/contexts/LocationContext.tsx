import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface LocationContextType {
  isLocationEnabled: boolean;
  currentLocation: GeolocationPosition | null;
  locationError: string | null;
  checkLocationPermission: () => Promise<boolean>;
  requestLocation: () => Promise<boolean>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser');
        return false;
      }

      // Check if permission is already granted
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          setIsLocationEnabled(true);
          return true;
        } else if (permission.state === 'denied') {
          setLocationError('Location access denied. Please enable location in your browser settings.');
          setIsLocationEnabled(false);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationError('Error checking location permission');
      return false;
    }
  };

  const requestLocation = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser');
        setIsLocationEnabled(false);
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          setIsLocationEnabled(true);
          setLocationError(null);
          console.log('Location obtained:', position.coords);
          resolve(true);
        },
        (error) => {
          console.error('Location error:', error);
          setIsLocationEnabled(false);
          setCurrentLocation(null);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied. Please enable location to continue.');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location information unavailable.');
              break;
            case error.TIMEOUT:
              setLocationError('Location request timed out.');
              break;
            default:
              setLocationError('An unknown error occurred while retrieving location.');
              break;
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    // Clear any existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position);
        setIsLocationEnabled(true);
        setLocationError(null);
        console.log('Location updated:', position.coords);
      },
      (error) => {
        console.error('Location tracking error:', error);
        setIsLocationEnabled(false);
        setCurrentLocation(null);
        
        // Trigger logout event when location is lost
        window.dispatchEvent(new CustomEvent('locationLost'));
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied');
            toast.error('Location access denied. You will be logged out for security.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            toast.error('Location unavailable. You will be logged out for security.');
            break;
          case error.TIMEOUT:
            setLocationError('Location timeout');
            break;
          default:
            setLocationError('Location error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Monitor permission changes
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        permission.addEventListener('change', () => {
          if (permission.state === 'denied') {
            setIsLocationEnabled(false);
            setCurrentLocation(null);
            setLocationError('Location access denied');
            window.dispatchEvent(new CustomEvent('locationLost'));
          }
        });
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const value: LocationContextType = {
    isLocationEnabled,
    currentLocation,
    locationError,
    checkLocationPermission,
    requestLocation,
    startLocationTracking,
    stopLocationTracking
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};