import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [9.85, 124.15]; // Bohol, used only when there are no markers

export default function MapView({ markers = [], height = 360, onMarkerClick }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const clickRef = useRef(onMarkerClick);

  useEffect(() => { clickRef.current = onMarkerClick; });

  useEffect(() => {
    const map = L.map(elRef.current).setView(DEFAULT_CENTER, 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // only redraw (and re-fit the view) when the markers actually change
  const key = JSON.stringify(markers.map((m) => [m.id, m.lat, m.lng, m.color]));

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points = [];
    markers.forEach((m) => {
      const dot = L.circleMarker([m.lat, m.lng], {
        radius: m.radius || 8,
        color: '#fff',
        weight: 2,
        fillColor: m.color || '#2b2b2b',
        fillOpacity: 1,
      }).addTo(layer);
      if (m.label) dot.bindTooltip(m.label);
      dot.on('click', () => clickRef.current?.(m.id));
      points.push([m.lat, m.lng]);
    });

    if (points.length === 1) map.setView(points[0], 16);
    else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 17 });
  }, [key]); // eslint-disable-line

  return <div ref={elRef} style={{ height, borderRadius: 8 }} />;
}