
import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'



const userIcon = L.divIcon({
  className: '',
  html: '<div class="user-map-marker"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})




const poiIcon = L.divIcon({
  className: '',
  html: '<div class="poi-map-marker"></div>',
  iconSize: [20, 26],
  iconAnchor: [10, 24],
  popupAnchor: [0, -22],
})


// Chỉ di chuyển bản đồ khi vị trí GPS thực sự thay đổi.
function MapFollowUser({ userPosition }) {
  const map = useMap()

  const lat = userPosition?.lat
  const lng = userPosition?.lng

  useEffect(() => {
    if (lat == null || lng == null) return

    map.setView(
      [lat, lng],
      17,
      { animate: true }
    )
  }, [map, lat, lng])

  return null
}

export default function NearbyMap({
  userPosition,
  places = [],
  onSelectPlace,
  language = 'vi',
  translateText,
}) {
  const defaultCenter = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [10.7769, 106.7009]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={17}
      minZoom={14}
      maxZoom={19}
      scrollWheelZoom={true}
      className="nearby-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFollowUser userPosition={userPosition} />

      {userPosition && (
        <>
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          >
            <Popup>{({ en: 'You are here', zh: '您在这里', ja: '現在地', ko: '현재 위치' })[language] || 'Bạn đang ở đây'}</Popup>
          </Marker>

          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={500}
            pathOptions={{
              color: '#287a57',
              fillColor: '#287a57',
              fillOpacity: 0.08,
              weight: 2,
            }}
          />
        </>
      )}

      {places.map((place) => {
        // Bỏ qua địa điểm thiếu tọa độ hợp lệ.
        if (
          !Number.isFinite(place.lat) ||
          !Number.isFinite(place.lng)
        ) {
          return null
        }

        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={poiIcon}
            eventHandlers={{
              click: () => onSelectPlace?.(place),
            }}
          >
            <Popup>
              <strong>{translateText ? translateText(place.name) : place.name}</strong>

              {place.distanceKm != null && (
                <div>
                  {({ en: 'Distance: ', zh: '距离：', ja: '距離：', ko: '거리: ' })[language] || 'Cách bạn: '}
                  {place.distanceKm < 1
                    ? `${Math.round(place.distanceKm * 1000)} m`
                    : `${place.distanceKm.toFixed(1)} km`}
                </div>
              )}

              {place.address && <div>{translateText ? translateText(place.address) : place.address}</div>}

              <button
                type="button"
                onClick={() => onSelectPlace?.(place)}
              >
                {({ en: 'View details', zh: '查看详情', ja: '詳細を見る', ko: '상세 보기' })[language] || 'Xem chi tiết'}
              </button>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
