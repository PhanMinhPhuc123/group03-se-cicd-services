
import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Ghim xanh cho vị trí người dùng.
const userIcon = L.divIcon({
  className: '',
  html: '<div class="user-map-marker"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Ghim đỏ cho địa điểm tham quan.
const poiIcon = L.divIcon({
  className: '',
  html: '<div class="poi-map-marker"></div>',
  iconSize: [24, 32],
  iconAnchor: [12, 30],
  popupAnchor: [0, -28],
})

function MapAutoFit({ userPosition, places }) {
  const map = useMap()

  useEffect(() => {
    const points = []

    if (userPosition) {
      points.push([userPosition.lat, userPosition.lng])
    }

    places.forEach((place) => {
      if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
        points.push([place.lat, place.lng])
      }
    })

    if (points.length > 1) {
      map.fitBounds(points, { padding: [35, 35], maxZoom: 15 })
    } else if (points.length === 1) {
      map.setView(points[0], 14)
    }
  }, [map, userPosition, places])

  return null
}

function MapClickHandler({ onSelectPlace }) {
  useMapEvents({})
  return null
}

export default function NearbyMap({
  userPosition,
  places,
  onSelectPlace,
}) {
  const defaultCenter = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [10.7769, 106.7009]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom
      className="nearby-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapAutoFit userPosition={userPosition} places={places} />
      <MapClickHandler onSelectPlace={onSelectPlace} />

      {userPosition && (
        <>
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          >
            <Popup>Vị trí hiện tại của bạn</Popup>
          </Marker>

          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={4000}
            pathOptions={{
              color: '#287a57',
              fillColor: '#287a57',
              fillOpacity: 0.06,
              weight: 2,
            }}
          />
        </>
      )}

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={poiIcon}
          eventHandlers={{
            click: () => onSelectPlace?.(place),
          }}
        >
          <Popup>
            <strong>{place.name}</strong>
            {place.distanceKm != null && (
              <div>
                Cách bạn:{' '}
                {place.distanceKm < 1
                  ? `${Math.round(place.distanceKm * 1000)} m`
                  : `${place.distanceKm.toFixed(1)} km`}
              </div>
            )}
            {place.address && <div>{place.address}</div>}
            <button
              type="button"
              onClick={() => onSelectPlace?.(place)}
            >
              Xem chi tiết
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
