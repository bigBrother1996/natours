import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmlnYnJvdGhlcjE5OTYiLCJhIjoiY2t4cTZoNmMwMGtxazMycDRjaXBvcXgyciJ9.Kt6YehKBQdRuWe801JqEsg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/bigbrother1996/ckxxhdnor24zj14l56qor0we9',
    center: [-117.97633100902853, 34.14068985079343],
    zoom: 2,
    scrollZoom: false
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // create marker
    const el = document.createElement('div');
    // add the marker
    el.className = 'marker';
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 200, left: 100, right: 100 }
  });
};
