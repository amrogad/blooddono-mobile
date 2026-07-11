import { colors } from '@/constants/theme';

export type MapPoint = { latitude: number; longitude: number };

export function mapHtml(hospital: MapPoint, me: MapPoint | null, label: string, interactive = true) {
  const meMarker = me
    ? `L.circleMarker([${me.latitude}, ${me.longitude}], { radius: 7, color: '#fff', weight: 2, fillColor: '${colors.info}', fillOpacity: 1 }).addTo(map).bindPopup('You');`
    : '';
  const framing = me
    ? `map.fitBounds([[${me.latitude}, ${me.longitude}], [${hospital.latitude}, ${hospital.longitude}]], { padding: [60, 60] });`
    : `map.setView([${hospital.latitude}, ${hospital.longitude}], 14);`;
  const lock = interactive
    ? ''
    : `dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false,`;

  // The pin is the brand mark itself — a crimson drop with a knocked-out plus.
  const dropSvg =
    `<svg width="40" height="40" viewBox="0 0 48 48" style="filter:drop-shadow(0 6px 8px rgba(156,14,46,.5))">` +
    `<path d="M24 3.5 C29 11 36 16.5 36 25 A12 12 0 1 1 12 25 C12 16.5 19 11 24 3.5 Z" fill="${colors.primary}" stroke="#fff" stroke-width="2.5"/>` +
    `<rect x="19" y="22.4" width="10" height="3.4" rx="1.2" fill="#fff"/>` +
    `<rect x="22.3" y="19.1" width="3.4" height="10" rx="1.2" fill="#fff"/></svg>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; background: ${colors.surface}; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: ${interactive}, ${lock} }).setView([${hospital.latitude}, ${hospital.longitude}], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const dropIcon = L.divIcon({ className: '', html: ${JSON.stringify(dropSvg)}, iconSize: [40, 40], iconAnchor: [20, 38], popupAnchor: [0, -34] });
    L.marker([${hospital.latitude}, ${hospital.longitude}], { icon: dropIcon }).addTo(map).bindPopup(${JSON.stringify(label)});
    ${meMarker}
    ${framing}
  </script>
</body>
</html>`;
}
