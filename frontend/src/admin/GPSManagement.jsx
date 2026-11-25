
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./GPSManagement.css";

// API lấy danh sách điểm tham quan.
// Chỉ đọc dữ liệu, không thực hiện thêm, sửa hoặc xóa POI.
const API_URL = "/api/POIs";

// Sửa đường dẫn icon mặc định để marker hiển thị đúng trong React.
const defaultMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Đọc được cả tên thuộc tính PascalCase và camelCase từ API .NET.
function getField(item, ...names) {
  for (const name of names) {
    if (item?.[name] !== undefined && item?.[name] !== null) {
      return item[name];
    }
  }

  return null;
}

// Chuẩn hóa dữ liệu POI để giao diện dùng thống nhất.
function normalizePOI(item) {
  const latitudeValue = getField(item, "latitude", "Latitude");
  const longitudeValue = getField(item, "longitude", "Longitude");

  const latitude =
    latitudeValue === null || latitudeValue === ""
      ? null
      : Number(latitudeValue);

  const longitude =
    longitudeValue === null || longitudeValue === ""
      ? null
      : Number(longitudeValue);

  const hasValidCoordinates =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    // Tọa độ (0, 0) thường là dữ liệu mặc định, không phải vị trí POI thực.
    !(latitude === 0 && longitude === 0);
// Lấy trạng thái hoạt động của POI từ backend.
// Ưu tiên isActive; nếu backend không cung cấp trường này
// thì sử dụng isVisible để xác định POI đang được hiển thị hay bị ẩn.
    const activeValue = getField(
      item,
      "isActive",
      "IsActive",
      "isVisible",
      "IsVisible"
    );

  return {
    id: getField(item, "id", "Id"),
    name: getField(item, "name", "Name") || "Chưa có tên",
    description:
      getField(item, "description", "Description") ||
      "Chưa có mô tả.",
    location:
      getField(item, "location", "Location") ||
      "Chưa có thông tin địa chỉ.",
    latitude,
    longitude,
    hasValidCoordinates,
    isActive: activeValue === true,
    activeValue,
  };
}

// Tự động di chuyển bản đồ đến điểm được chọn.
function MapFocus({ selectedPOI }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPOI?.hasValidCoordinates) {
      map.flyTo(
        [selectedPOI.latitude, selectedPOI.longitude],
        15,
        { duration: 0.7 }
      );
    }
  }, [map, selectedPOI]);

  return null;
}

function formatCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(6)
    : "Chưa có";
}

export default function GPSManagement() {
  const [pois, setPois] = useState([]);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tải danh sách POI từ backend.
  async function loadPOIs() {

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Máy chủ trả về mã lỗi ${response.status}.`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu POI trả về không đúng định dạng danh sách.");
      }

      const normalizedPOIs = data.map(normalizePOI);

      setPois(normalizedPOIs);

      // Giữ lựa chọn cũ nếu POI đó vẫn còn trong dữ liệu mới.
      setSelectedPOI((current) => {
        if (!current) return null;

        return (
          normalizedPOIs.find((poi) => poi.id === current.id) || null
        );
      });
    } catch (err) {
      setError(
        err.message ||
          "Không thể tải danh sách điểm tham quan. Hãy kiểm tra backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false
  
    async function fetchInitialPOIs() {
      try {
        const response = await fetch(API_URL)
  
        if (!response.ok) {
          throw new Error(`Máy chủ trả về mã lỗi ${response.status}.`)
        }
  
        const data = await response.json()
  
        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu POI trả về không đúng định dạng danh sách.")
        }
  
        const normalizedPOIs = data.map(normalizePOI)
  
        if (!cancelled) {
          setPois(normalizedPOIs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Không thể tải danh sách điểm tham quan. Hãy kiểm tra backend."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
  
    fetchInitialPOIs()
  
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    return {
      total: pois.length,
      withCoordinates: pois.filter((poi) => poi.hasValidCoordinates).length,
      withoutCoordinates: pois.filter(
        (poi) => !poi.hasValidCoordinates
      ).length,
      active: pois.filter((poi) => poi.isActive).length,
    };
  }, [pois]);

  // Lọc danh sách theo từ khóa và trạng thái tọa độ/hoạt động.
  const filteredPOIs = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase("vi");

    return pois.filter((poi) => {
      const matchesSearch =
        !keyword ||
        poi.name.toLocaleLowerCase("vi").includes(keyword) ||
        String(poi.location).toLocaleLowerCase("vi").includes(keyword);

      let matchesFilter = true;

      if (filter === "withCoordinates") {
        matchesFilter = poi.hasValidCoordinates;
      } else if (filter === "withoutCoordinates") {
        matchesFilter = !poi.hasValidCoordinates;
      } else if (filter === "active") {
        matchesFilter = poi.isActive;
      } else if (filter === "inactive") {
        matchesFilter = poi.activeValue === false;
      }

      return matchesSearch && matchesFilter;
    });
  }, [pois, searchText, filter]);

  const visiblePOIs = filteredPOIs.filter(
    (poi) => poi.hasValidCoordinates
  );

  function selectPOI(poi) {
    setSelectedPOI(poi);
  }

  return (
    <main className="gps-page">
      <header className="gps-page-header">
        <div>
          <div className="gps-eyebrow">QUẢN LÝ HỆ THỐNG</div>
          <h1>Bản đồ GPS</h1>
          <p>
            Theo dõi vị trí địa lý và kiểm tra tọa độ các điểm tham quan.
          </p>
        </div>

        <button
          type="button"
          className="gps-refresh-button"
          onClick={loadPOIs}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </header>

      <section className="gps-stat-grid">
        <article className="gps-stat-card">
          <span className="gps-stat-label">Tổng số POI</span>
          <strong>{stats.total}</strong>
          <span className="gps-stat-note">Điểm tham quan trong hệ thống</span>
        </article>

        <article className="gps-stat-card gps-stat-card-green">
          <span className="gps-stat-label">Có tọa độ hợp lệ</span>
          <strong>{stats.withCoordinates}</strong>
          <span className="gps-stat-note">Có thể hiển thị trên bản đồ</span>
        </article>

        <article className="gps-stat-card gps-stat-card-orange">
          <span className="gps-stat-label">Thiếu tọa độ hợp lệ</span>
          <strong>{stats.withoutCoordinates}</strong>
          <span className="gps-stat-note">Cần kiểm tra dữ liệu vị trí</span>
        </article>

        <article className="gps-stat-card gps-stat-card-purple">
          <span className="gps-stat-label">POI đang hoạt động</span>
          <strong>{stats.active}</strong>
          <span className="gps-stat-note">Theo trạng thái từ backend</span>
        </article>
      </section>

      {error && (
        <div className="gps-error" role="alert">
          <strong>Không tải được dữ liệu POI.</strong>
          <p>{error}</p>
          <p>
            Hãy kiểm tra API {API_URL} và bảo đảm backend đang chạy.
          </p>
          <button type="button" onClick={loadPOIs}>
            Thử tải lại
          </button>
        </div>
      )}

      <section className="gps-workspace">
        <div className="gps-map-panel">
          <div className="gps-panel-header">
            <div>
              <h2>Bản đồ điểm tham quan</h2>
              <p>
                Đang hiển thị {visiblePOIs.length} / {filteredPOIs.length} điểm
                có tọa độ trong danh sách đã lọc.
              </p>
            </div>
          </div>

          <div className="gps-map-container">
            {!loading && !error && (
              <MapContainer
                center={[10.7769, 106.7009]}
                zoom={12}
                scrollWheelZoom={true}
                className="gps-leaflet-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFocus selectedPOI={selectedPOI} />

                {visiblePOIs.map((poi) => (
                  <Marker
                    key={poi.id}
                    position={[poi.latitude, poi.longitude]}
                    icon={defaultMarkerIcon}
                    eventHandlers={{
                      click: () => selectPOI(poi),
                    }}
                  >
                    <Popup>
                      <div className="gps-popup">
                        <strong>{poi.name}</strong>
                        <p>{poi.location}</p>
                        <button
                          type="button"
                          onClick={() => selectPOI(poi)}
                        >
                          Xem thông tin
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {loading && (
              <div className="gps-map-message">
                Đang tải dữ liệu bản đồ...
              </div>
            )}

            {!loading && !error && visiblePOIs.length === 0 && (
              <div className="gps-map-empty">
                <strong>Chưa có điểm nào để hiển thị</strong>
                <p>
                  Thử thay đổi bộ lọc hoặc kiểm tra tọa độ của các POI.
                </p>
              </div>
            )}
          </div>

          <div className="gps-map-legend">
            <span className="gps-legend-dot" />
            <span>Điểm tham quan có tọa độ hợp lệ</span>
          </div>
        </div>

        <aside className="gps-list-panel">
          <div className="gps-panel-header">
            <div>
              <h2>Danh sách POI</h2>
              <p>{filteredPOIs.length} kết quả phù hợp</p>
            </div>
          </div>

          <div className="gps-list-controls">
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm tên hoặc địa chỉ..."
              aria-label="Tìm điểm tham quan"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Lọc điểm tham quan"
            >
              <option value="all">Tất cả POI</option>
              <option value="withCoordinates">Có tọa độ hợp lệ</option>
              <option value="withoutCoordinates">Thiếu tọa độ hợp lệ</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="gps-poi-list">
            {!loading && filteredPOIs.length === 0 && (
              <div className="gps-list-empty">
                Không tìm thấy POI phù hợp.
              </div>
            )}

            {filteredPOIs.map((poi) => (
              <button
                type="button"
                key={poi.id}
                className={`gps-poi-item ${
                  selectedPOI?.id === poi.id ? "selected" : ""
                }`}
                onClick={() => selectPOI(poi)}
              >
                <div className="gps-poi-item-top">
                  <strong>{poi.name}</strong>
                  <span
                    className={`gps-status ${
                      poi.isActive ? "status-active" : "status-inactive"
                    }`}
                  >
                    {poi.isActive ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </div>

                <span className="gps-poi-location">{poi.location}</span>

                <span
                  className={`gps-coordinate-status ${
                    poi.hasValidCoordinates
                      ? "coordinate-valid"
                      : "coordinate-invalid"
                  }`}
                >
                  {poi.hasValidCoordinates
                    ? "Có tọa độ hợp lệ"
                    : "Thiếu tọa độ hợp lệ"}
                </span>
              </button>
            ))}
          </div>

          {selectedPOI && (
            <div className="gps-detail-panel">
              <div className="gps-detail-heading">
                <h3>Thông tin vị trí</h3>
                <button
                  type="button"
                  onClick={() => setSelectedPOI(null)}
                  aria-label="Đóng thông tin vị trí"
                >
                  Đóng
                </button>
              </div>

              <strong className="gps-detail-name">{selectedPOI.name}</strong>
              <p className="gps-detail-description">
                {selectedPOI.description}
              </p>

              <div className="gps-detail-row">
                <span>Địa chỉ</span>
                <strong>{selectedPOI.location}</strong>
              </div>

              <div className="gps-detail-row">
                <span>Vĩ độ (Latitude)</span>
                <strong>
                  {formatCoordinate(selectedPOI.latitude)}
                </strong>
              </div>

              <div className="gps-detail-row">
                <span>Kinh độ (Longitude)</span>
                <strong>
                  {formatCoordinate(selectedPOI.longitude)}
                </strong>
              </div>

              {!selectedPOI.hasValidCoordinates && (
                <div className="gps-detail-warning">
                  POI này chưa có tọa độ hợp lệ nên không thể đặt ghim trên
                  bản đồ. Hãy cập nhật tọa độ tại trang Quản lý POI.
                </div>
              )}

              {selectedPOI.hasValidCoordinates && (
              <a
              className="gps-directions-link"
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPOI.latitude},${selectedPOI.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem đường đi trên Google Maps
            </a>
              )}
            </div>
          )}
        </aside>
      </section>

      <p className="gps-footer-note">
        Bản đồ sử dụng dữ liệu POI từ backend. Trang này không tự cập nhật hoặc
        thay đổi tọa độ trong cơ sở dữ liệu.
      </p>
    </main>
  );
}

