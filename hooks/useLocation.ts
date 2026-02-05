import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';

/* ============================================================
   Types
============================================================ */

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  enabled: boolean; // user toggled "Near Me"
}

/* ============================================================
   Hook
============================================================ */

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    loading: false,
    error: null,
    permissionStatus: 'undetermined',
    enabled: false,
  });

  /* ─── Permission ───────────────────────────────────────── */

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setState(prev => ({
          ...prev,
          permissionStatus: 'denied',
          enabled: false,
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        permissionStatus: 'granted',
      }));
      return true;
    } catch (err) {
      console.error('[Location] Permission error:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to request location permission',
        permissionStatus: 'denied',
        enabled: false,
      }));
      return false;
    }
  }, []);

  /* ─── Get Location (Web + Native) ───────────────────────── */

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      /* ---------- Web ---------- */
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported');
        }

        return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async position => {
              const { latitude, longitude } = position.coords;

              let city: string | null = null;
              try {
                const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
                city = address?.city || address?.subregion || null;
              } catch {}

              setState(prev => ({
                ...prev,
                latitude,
                longitude,
                city,
                loading: false,
                enabled: true,
                permissionStatus: 'granted',
              }));

              resolve({ latitude, longitude });
            },
            error => {
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

      /* ---------- Native ---------- */
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      let city: string | null = null;
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        city = address?.city || address?.subregion || null;
      } catch {}

      setState(prev => ({
        ...prev,
        latitude,
        longitude,
        city,
        loading: false,
        enabled: true,
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

  /* ─── Toggle / Disable ──────────────────────────────────── */

  const disable = useCallback(() => {
    setState(prev => ({
      ...prev,
      enabled: false,
      latitude: null,
      longitude: null,
      city: null,
    }));
  }, []);

  const toggle = useCallback(() => {
    if (state.enabled) {
      disable();
    } else {
      getCurrentLocation();
    }
  }, [state.enabled, disable, getCurrentLocation]);

  /* ─── Permission Alert ──────────────────────────────────── */

  const showPermissionAlert = useCallback(() => {
    Alert.alert(
      'Location Access',
      'PrimeDine needs your location to show restaurants near you.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Enable', onPress: getCurrentLocation },
      ]
    );
  }, [getCurrentLocation]);

  /* ─── Public API ────────────────────────────────────────── */

  return {
    ...state,
    hasLocation: state.latitude !== null && state.longitude !== null,
    getCurrentLocation,
    requestPermission,
    toggle,
    disable,
    showPermissionAlert,
  };
}

/* ============================================================
   Helpers
============================================================ */

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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
