
import { useEffect, useMemo, useState } from 'react';

// API lấy danh sách điểm tham quan từ PoiService.
const POI_API_URL = "/api/POIs";

function Reports({ history = [], stats }) {
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [error, setError] = useState("");

  // Tải dữ liệu POI để thống kê.
  useEffect(() => {
    async function loadPlaces() {
      setLoadingPlaces(true);
      setError("");

      try {
        const response = await fetch(POI_API_URL);

        if (!response.ok) {
          throw new Error("Không thể tải danh sách điểm tham quan.");
        }

        const data = await response.json();
        setPlaces(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải dữ liệu."
        );
      } finally {
        setLoadingPlaces(false);
      }
    }

    loadPlaces();
  }, []);

  // Tính số lượng POI đang hoạt động.
  const activePlaces = places.filter(
    (place) => place.isActive
  ).length;

  // Xếp hạng theo tên POI xuất hiện trong lịch sử phiên.
  const topPlaces = useMemo(() => {
    const counts = new Map();

    for (const item of history) {
      const name = item.poiName?.trim();

      if (!name) continue;

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [history]);

  return (
    <div className="reports-page">
      <section className="analytics-section">
        <div className="analytics-header">
          <div>
            <p className="section-eyebrow">TOURISM ANALYTICS</p>
            <h2>Báo cáo thống kê</h2>
            <p className="history-subtitle">
              Tổng hợp dữ liệu điểm tham quan và hoạt động tham quan.
            </p>
          </div>
        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            <strong>Không thể tải dữ liệu POI</strong>
            <p>{error}</p>
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        )}

        <div className="dashboard-summary">
          <article className="summary-card summary-card-blue">
            <div className="summary-card-top">
              <span className="summary-label">TỔNG SỐ POI</span>
            </div>
            <strong className="summary-value">
              {loadingPlaces ? "—" : places.length}
            </strong>
            <p className="summary-description">
              Tổng số điểm tham quan trong hệ thống
            </p>
          </article>

          <article className="summary-card summary-card-green">
            <div className="summary-card-top">
              <span className="summary-label">POI ĐANG HOẠT ĐỘNG</span>
            </div>
            <strong className="summary-value">
              {loadingPlaces ? "—" : activePlaces}
            </strong>
            <p className="summary-description">
              Các điểm có trạng thái hoạt động
            </p>
          </article>

          <article className="summary-card summary-card-purple">
            <div className="summary-card-top">
              <span className="summary-label">TỔNG PHIÊN THAM QUAN</span>
            </div>
            <strong className="summary-value">
              {stats?.totalVisits ?? 0}
            </strong>
            <p className="summary-description">
              Tổng số phiên do backend ghi nhận
            </p>
          </article>

          <article className="summary-card summary-card-orange">
            <div className="summary-card-top">
              <span className="summary-label">ĐANG THAM QUAN</span>
            </div>
            <strong className="summary-value">
              {stats?.activeVisits ?? 0}
            </strong>
            <p className="summary-description">
              Các phiên chưa kết thúc
            </p>
          </article>
        </div>
      </section>

      <section className="dashboard-history">
        <div className="history-header">
          <div>
            <p className="section-eyebrow">TOP 5 POI</p>
            <h2>Điểm tham quan được ghi nhận nhiều nhất</h2>
            <p className="history-subtitle">
              Xếp hạng theo số phiên có tên địa điểm trong lịch sử.
            </p>
          </div>
        </div>

        {topPlaces.length === 0 ? (
          <div className="dashboard-empty">
            <strong>Chưa có dữ liệu xếp hạng</strong>
            <p>
              Chưa có phiên tham quan nào có tên địa điểm để thống kê.
            </p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thứ hạng</th>
                  <th>Điểm tham quan</th>
                  <th>Số phiên</th>
                </tr>
              </thead>

              <tbody>
                {topPlaces.map((place, index) => (
                  <tr key={place.name}>
                    <td>#{index + 1}</td>
                    <td>
                      <strong>{place.name}</strong>
                    </td>
                    <td>{place.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="analytics-note">
        Báo cáo sử dụng dữ liệu hiện có từ backend. Bảng xếp hạng dựa trên
        tên địa điểm trong lịch sử phiên, vì vậy tên không đồng nhất có thể
        khiến một địa điểm bị tính thành nhiều mục.
      </p>
    </div>
  );
}

export default Reports;

