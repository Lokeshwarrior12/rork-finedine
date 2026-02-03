import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  error: string | null;
  loading: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    error: null,
    loading: false,
    permissionStatus: 'undetermined',
  });

  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setState(prev => ({
          ...prev,
          loading: false,
          permissionStatus: 'denied',
          error: 'Location permission denied',
        }));
        return false;
      }

      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      return true;
    } catch (err) {
      console.error('[Location] Permission error:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to request location permission',
      }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Geolocation not supported',
          }));
          return null;
        }

        return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              let city = 'New York';
              try {
                const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
                city = address?.city || address?.subregion || 'Unknown';
              } catch (e) {
                console.warn('[Location] Reverse geocode failed:', e);
              }

              setState(prev => ({
                ...prev,
                latitude,
                longitude,
                city,
                loading: false,
                permissionStatus: 'granted',
              }));
              resolve({ latitude, longitude });
            },
            (error) => {
              console.error('[Location] Web geolocation error:', error);
              setState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
                permissionStatus: error.code === 1 ? 'denied' : prev.permissionStatus,
              }));
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      }

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      let city = 'New York';
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        city = address?.city || address?.subregion || 'Unknown';
      } catch (e) {
        console.warn('[Location] Reverse geocode failed:', e);
      }

      setState(prev => ({
        ...prev,
        latitude,
        longitude,
        city,
        loading: false,
      }));

      return { latitude, longitude };
    } catch (err: any) {
      console.error('[Location] Get location error:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to get location',
      }));
      return null;
    }
  }, [requestPermission]);

  const showPermissionAlert = useCallback(() => {
    Alert.alert(
      'Location Access',
      'PrimeDine needs your location to show restaurants near you. Would you like to enable location access?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Enable', onPress: getCurrentLocation },
      ]
    );
  }, [getCurrentLocation]);

  return {
    ...state,
    getCurrentLocation,
    requestPermission,
    showPermissionAlert,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
