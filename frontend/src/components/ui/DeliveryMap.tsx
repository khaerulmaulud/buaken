"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  type: "pickup" | "delivery" | "courier";
  label?: string;
  popup?: string;
}

interface DeliveryMapProps {
  markers: Marker[];
  showRoute?: boolean;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

const MARKER_COLORS = {
  pickup: "#3b82f6", // blue
  delivery: "#10b981", // emerald
  courier: "#f59e0b", // amber
};

const MARKER_EMOJIS = {
  pickup: "🏪",
  delivery: "📍",
  courier: "🛵",
};

export default function DeliveryMap({
  markers,
  showRoute = true,
  className = "",
  center,
  zoom = 13,
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Calculate center from markers if not provided
  const calculatedCenter =
    center ||
    (() => {
      if (markers.length === 0) return [106.8456, -6.2088] as [number, number]; // Jakarta default
      const avgLng =
        markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
      const avgLat =
        markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      return [avgLng, avgLat] as [number, number];
    })();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with OpenStreetMap tiles (free, no API key needed)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: calculatedCenter,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [calculatedCenter, zoom]);

  // Update markers
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const el = document.createElement("div");
      el.className = "delivery-marker";
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: ${MARKER_COLORS[markerData.type]};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
          cursor: pointer;
        ">
          ${MARKER_EMOJIS[markerData.type]}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map.current!);

      if (markerData.popup || markerData.label) {
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>${markerData.label || markerData.type}</strong>
            ${markerData.popup ? `<p style="margin: 4px 0 0; font-size: 12px;">${markerData.popup}</p>` : ""}
          </div>
        `);
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [markers, loaded]);

  // Draw route between markers
  useEffect(() => {
    if (!map.current || !loaded || !showRoute || markers.length < 2) return;

    const sourceId = "route";
    const layerId = "route-line";

    // Remove existing route
    if (map.current.getSource(sourceId)) {
      map.current.removeLayer(layerId);
      map.current.removeSource(sourceId);
    }

    // Create route coordinates
    const coordinates = markers.map((m) => [m.lng, m.lat]);

    map.current.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    map.current.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#10b981",
        "line-width": 4,
        "line-dasharray": [2, 1],
      },
    });
  }, [markers, showRoute, loaded]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-64 md:h-80 rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: "250px" }}
    />
  );
}
