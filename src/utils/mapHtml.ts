import { colors } from '@/constants/theme';

export type MapPoint = { latitude: number; longitude: number };

export function mapHtml(hospital: MapPoint, me: MapPoint | null, label: string, interactive = true) {
  const meMarker = me
    ? `L.circleMarker([${me.latitude}, ${me.longitude}], { radius: 8, color: '#1e90ff', fillColor: '#1e90ff', fillOpacity: 1 }).addTo(map).bindPopup('You');`
    : '';
  const routeLine = me
    ? `L.polyline([[${me.latitude}, ${me.longitude}], [${hospital.latitude}, ${hospital.longitude}]], { color: '${colors.primary}', weight: 4 }).addTo(map);`
    : '';
  const framing = me
    ? `map.fitBounds([[${me.latitude}, ${me.longitude}], [${hospital.latitude}, ${hospital.longitude}]], { padding: [50, 50] });`
    : `map.setView([${hospital.latitude}, ${hospital.longitude}], 13);`;
  const lock = interactive
    ? ''
    : `dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false,`;

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
    const map = L.map('map', { zoomControl: ${interactive}, ${lock} }).setView([${hospital.latitude}, ${hospital.longitude}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    L.circleMarker([${hospital.latitude}, ${hospital.longitude}], { radius: 10, color: '${colors.primary}', fillColor: '${colors.primary}', fillOpacity: 1 }).addTo(map).bindPopup(${JSON.stringify(label)});
    ${meMarker}
    ${routeLine}
    ${framing}
  </script>
</body>
</html>`;
}
