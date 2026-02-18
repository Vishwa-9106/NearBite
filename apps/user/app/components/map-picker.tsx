"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __nearbiteGoogleMapsInit?: () => void;
  }
}

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };
type Position = { lat: number; lng: number };
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_CALLBACK_NAME = "__nearbiteGoogleMapsInit";
const MAP_CONSTRUCTOR_WAIT_MS = 8000;

type MarkerAdapter = {
  setPosition: (position: Position) => void;
  getPosition: () => Position | null;
  onDragEnd: (callback: (position: Position) => void) => void;
};

let googleMapsLoaderPromise: Promise<void> | null = null;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForMapConstructor(timeoutMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (typeof window.google?.maps?.Map === "function") {
      return;
    }
    await sleep(100);
  }
}

async function loadMapClasses() {
  if (!window.google?.maps) {
    throw new Error("Google Maps API did not load.");
  }

  let mapClass = window.google.maps.Map;
  if (typeof mapClass !== "function" && typeof window.google.maps.importLibrary === "function") {
    const mapsLibrary = (await window.google.maps.importLibrary("maps")) as { Map?: any };
    mapClass = mapsLibrary.Map;
  }

  if (typeof mapClass !== "function") {
    await waitForMapConstructor(MAP_CONSTRUCTOR_WAIT_MS);
    mapClass = window.google?.maps?.Map;
  }

  return {
    MapClass: mapClass
  };
}

function loadGoogleMaps(apiKey: string, mapId?: string): Promise<void> {
  if (typeof window.google?.maps?.Map === "function") {
    return Promise.resolve();
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const finalizeSuccess = async () => {
      await waitForMapConstructor(MAP_CONSTRUCTOR_WAIT_MS);
      if (typeof window.google?.maps?.Map === "function" || typeof window.google?.maps?.importLibrary === "function") {
        resolve();
        return;
      }

      googleMapsLoaderPromise = null;
      reject(new Error("Google Maps failed to initialize."));
    };

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        void finalizeSuccess();
        return;
      }

      existing.addEventListener(
        "load",
        () => {
          existing.dataset.loaded = "true";
          void finalizeSuccess();
        },
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => {
          googleMapsLoaderPromise = null;
          reject(new Error("Failed to load Google Maps"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    window[GOOGLE_MAPS_CALLBACK_NAME] = () => {
      script.dataset.loaded = "true";
      void finalizeSuccess();
    };
    const libraries = mapId?.trim() ? "places,marker" : "places";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${encodeURIComponent(libraries)}&v=weekly&loading=async&callback=${encodeURIComponent(GOOGLE_MAPS_CALLBACK_NAME)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      void finalizeSuccess();
    };
    script.onerror = () => {
      googleMapsLoaderPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

type MapPickerProps = {
  apiKey: string;
  mapId?: string;
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number) => void;
};

export function MapPicker({ apiKey, mapId, initialLat, initialLng, onSelect }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MarkerAdapter | null>(null);
  const [error, setError] = useState<string | null>(null);

  function createMarker(map: any, position: Position, useAdvancedMarker: boolean): MarkerAdapter {
    const maps = window.google.maps;
    const advancedMarkerClass = useAdvancedMarker ? maps?.marker?.AdvancedMarkerElement : null;

    if (advancedMarkerClass) {
      const advancedMarker = new advancedMarkerClass({
        map,
        position,
        gmpDraggable: true
      });

      return {
        setPosition(nextPosition) {
          advancedMarker.position = nextPosition;
        },
        getPosition() {
          const current = advancedMarker.position;
          if (!current) {
            return null;
          }

          if (typeof current.lat === "function" && typeof current.lng === "function") {
            return { lat: current.lat(), lng: current.lng() };
          }

          if (typeof current.lat === "number" && typeof current.lng === "number") {
            return { lat: current.lat, lng: current.lng };
          }

          return null;
        },
        onDragEnd(callback) {
          advancedMarker.addListener("dragend", (event: any) => {
            const lat = event?.latLng?.lat?.();
            const lng = event?.latLng?.lng?.();

            if (typeof lat === "number" && typeof lng === "number") {
              callback({ lat, lng });
              return;
            }

            const current = this.getPosition();
            if (current) {
              callback(current);
            }
          });
        }
      };
    }

    const marker = new maps.Marker({
      map,
      position,
      draggable: true
    });

    return {
      setPosition(nextPosition) {
        marker.setPosition(nextPosition);
      },
      getPosition() {
        const current = marker.getPosition();
        if (!current) {
          return null;
        }
        return { lat: current.lat(), lng: current.lng() };
      },
      onDragEnd(callback) {
        marker.addListener("dragend", () => {
          const current = marker.getPosition();
          if (current) {
            callback({ lat: current.lat(), lng: current.lng() });
          }
        });
      }
    };
  }

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        await loadGoogleMaps(apiKey, mapId);
        if (!isMounted || !mapContainerRef.current || !window.google?.maps) {
          return;
        }

        const { MapClass } = await loadMapClasses();
        if (!MapClass) {
          throw new Error("Google Maps constructor unavailable.");
        }

        const center = {
          lat: typeof initialLat === "number" ? initialLat : DEFAULT_CENTER.lat,
          lng: typeof initialLng === "number" ? initialLng : DEFAULT_CENTER.lng
        };

        const mapOptions: Record<string, unknown> = {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        };
        if (mapId?.trim()) {
          mapOptions.mapId = mapId.trim();
        }

        const map = new MapClass(mapContainerRef.current, mapOptions);
        mapRef.current = map;

        const marker = createMarker(map, center, Boolean(mapId?.trim()));
        markerRef.current = marker;

        marker.onDragEnd((position) => {
          onSelect(position.lat, position.lng);
        });

        map.addListener("click", (event: any) => {
          const lat = event.latLng?.lat?.();
          const lng = event.latLng?.lng?.();
          if (typeof lat === "number" && typeof lng === "number") {
            marker.setPosition({ lat, lng });
            onSelect(lat, lng);
          }
        });

        onSelect(center.lat, center.lng);
      } catch (mapError) {
        setError(mapError instanceof Error ? mapError.message : "Unable to initialize map.");
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [apiKey, initialLat, initialLng, mapId, onSelect]);

  useEffect(() => {
    if (!markerRef.current || !mapRef.current) {
      return;
    }

    if (typeof initialLat === "number" && typeof initialLng === "number") {
      const next = { lat: initialLat, lng: initialLng };
      markerRef.current.setPosition(next);
      mapRef.current.panTo(next);
    }
  }, [initialLat, initialLng]);

  if (error) {
    return <p className="text-xs text-red-400">{error}</p>;
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-64 w-full overflow-hidden rounded-xl border border-slate-200"
    />
  );
}
