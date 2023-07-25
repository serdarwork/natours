/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VyZGFya29jYWsiLCJhIjoiY2xrNnh6cmc2MDAwcTNkbnY0ODBjOWYzbSJ9.o3GiqyFw5sxU8qdryEnU2A';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/serdarkocak/clk6yoly300m001pf6380b3vt',
    scrollZoom: false,
    // center: [-118.139868, 34.119009],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
