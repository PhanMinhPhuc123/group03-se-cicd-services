import { useCallback, useEffect, useMemo, useState } from 'react'
import './VisitDashboard.css'

// Định dạng thời lượng tham quan từ số giây.
function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'

  const totalSeconds = Math.max(0, Math.floor(seconds))

  if (totalSeconds < 60) return `${totalSeconds} giây`

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60

    return remainingSeconds > 0
      ? `${minutes} phút ${remainingSeconds} giây`
      : `${minutes} phút`
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours < 24) {
    return minutes > 0
      ? `${hours} giờ ${minutes} phút`
      : `${hours} giờ`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours > 0
    ? `${days} ngày ${remainingHours} giờ`
    : `${days} ngày`
}

// Định dạng ngày giờ theo múi giờ của trình duyệt.
function formatDateTime(value) {
  if (!value) return 'Chưa kết thúc'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Không hợp lệ'

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Chuyển dữ liệu thành chuỗi không phân biệt chữ hoa, chữ thường.
function normalizeText(value) {
  return String(value ?? '').toLocaleLowerCase('vi')
}

function VisitDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 8

  // Tải thống kê trực tiếp từ backend.
  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/VisitSessions/stats')

      if (!response.ok) {
        throw new Error(`Không thể tải dữ liệu (HTTP ${response.status})`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi khi tải dữ liệu thống kê.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const history = stats?.history ?? []

  // Lọc lịch sử theo từ khóa và trạng thái.
  const filteredHistory = useMemo(() => {
    const keyword = normalizeText(searchText.trim())

    return history.filter((item) => {
      const poiName = normalizeText(item.poiName)
      const sessionId = normalizeText(item.sessionId)

      const matchesSearch =
        !keyword ||
        poiName.includes(keyword) ||
        sessionId.includes(keyword)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'completed' && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [history, searchText, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / pageSize),
  )

  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize

  const visibleHistory = filteredHistory.slice(
    startIndex,
    startIndex + pageSize,
  )

  // Khi thay đổi tìm kiếm hoặc bộ lọc, quay lại trang đầu tiên.
  function handleSearchChange(value) {
    setSearchText(value)
    setCurrentPage(1)
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <main className="visit-dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-heading">
            <p className="dashboard-eyebrow">QUẢN TRỊ HỆ THỐNG</p>
            <h1>Tổng quan tham quan</h1>
            <p className="dashboard-subtitle">
              Theo dõi và quản lý các phiên tham quan được ghi nhận trên hệ thống.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={() => {
                window.location.href = '/'
              }}
            >
              Mở website tham quan
            </button>

            <button
              type="button"
              className="dashboard-button dashboard-button-primary"
              onClick={loadStats}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
            </button>
          </div>
        </header>

        {error && (
          <section className="dashboard-error" role="alert">
            <div>
              <strong>Không thể tải dữ liệu</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={loadStats}
              disabled={loading}
            >
              Thử lại
            </button>
          </section>
        )}

        {loading && !stats ? (
          <div className="dashboard-message">
            <span className="loading-indicator" />
            <p>Đang tải dữ liệu thống kê...</p>
          </div>
        ) : stats ? (
          <>
            <section className="dashboard-summary">
              <article className="summary-card summary-card-blue">
                <div className="summary-card-top">
                  <span className="summary-label">TỔNG LƯỢT THAM QUAN</span>
                  <span className="summary-mark summary-mark-blue">01</span>
                </div>
                <strong className="summary-value">
                  {stats.totalVisits ?? 0}
                </strong>
                <p className="summary-description">
                  Tổng số phiên đã được tạo
                </p>
              </article>

              <article className="summary-card summary-card-green">
                <div className="summary-card-top">
                  <span className="summary-label">ĐANG THAM QUAN</span>
                  <span className="summary-mark summary-mark-green">02</span>
                </div>
                <strong className="summary-value">
                  {stats.activeVisits ?? 0}
                </strong>
                <p className="summary-description">
                  Các phiên chưa kết thúc
                </p>
              </article>

              <article className="summary-card summary-card-purple">
                <div className="summary-card-top">
                  <span className="summary-label">ĐÃ HOÀN THÀNH</span>
                  <span className="summary-mark summary-mark-purple">03</span>
                </div>
                <strong className="summary-value">
                  {stats.completedVisits ?? 0}
                </strong>
                <p className="summary-description">
                  Các phiên đã kết thúc
                </p>
              </article>

              <article className="summary-card summary-card-orange">
                <div className="summary-card-top">
                  <span className="summary-label">THỜI LƯỢNG TRUNG BÌNH</span>
                  <span className="summary-mark summary-mark-orange">04</span>
                </div>
                <strong className="summary-value summary-value-duration">
                  {formatDuration(stats.averageDurationSeconds ?? 0)}
                </strong>
                <p className="summary-description">
                  Tính trên các phiên đã hoàn thành
                </p>
              </article>
            </section>

            <section className="dashboard-history">
              <div className="history-header">
                <div>
                  <p className="section-eyebrow">HOẠT ĐỘNG GẦN ĐÂY</p>
                  <h2>Lịch sử tham quan</h2>
                  <p className="history-subtitle">
                    Tra cứu thông tin và trạng thái từng phiên tham quan.
                  </p>
                </div>

                <div className="history-total">
                  <strong>{filteredHistory.length}</strong>
                  <span>phiên</span>
                </div>
              </div>

              <div className="history-toolbar">
                <label className="history-search">
                  <span className="visually-hidden">
                    Tìm kiếm địa điểm hoặc mã phiên
                  </span>
                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Tìm địa điểm hoặc mã phiên..."
                  />
                </label>

                <label className="history-filter">
                  <span>Trạng thái</span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      handleStatusChange(event.target.value)
                    }
                  >
                    <option value="all">Tất cả phiên</option>
                    <option value="active">Đang tham quan</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </label>
              </div>

              {visibleHistory.length === 0 ? (
                <div className="dashboard-empty">
                  <strong>Không tìm thấy phiên tham quan</strong>
                  <p>
                    Thử thay đổi từ khóa hoặc chọn trạng thái khác.
                  </p>
                  <button
                    type="button"
                    className="dashboard-button dashboard-button-secondary"
                    onClick={() => {
                      setSearchText('')
                      setStatusFilter('all')
                      setCurrentPage(1)
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <>
                  <div className="history-table-wrapper">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Địa điểm / Mã phiên</th>
                          <th>Bắt đầu</th>
                          <th>Kết thúc</th>
                          <th>Thời lượng</th>
                          <th>Trạng thái</th>
                          <th>GPS</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleHistory.map((item) => (
                          <tr key={item.sessionId}>
                            <td>
                              <div className="history-place">
                                <strong>
                                  {item.poiName || 'Chưa xác định địa điểm'}
                                </strong>
                                <span>{item.sessionId}</span>
                              </div>
                            </td>

                            <td className="history-date">
                              {formatDateTime(item.entryTime)}
                            </td>

                            <td className="history-date">
                              {formatDateTime(item.exitTime)}
                            </td>

                            <td className="history-duration">
                              {formatDuration(item.durationSeconds)}
                            </td>

                            <td>
                              <span
                                className={`status-badge ${
                                  item.isActive
                                    ? 'status-active'
                                    : 'status-completed'
                                }`}
                              >
                                <span className="status-dot" />
                                {item.isActive
                                  ? 'Đang tham quan'
                                  : 'Đã hoàn thành'}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`gps-label ${
                                  item.locationConsent
                                    ? 'gps-consented'
                                    : 'gps-declined'
                                }`}
                              >
                                {item.locationConsent
                                  ? 'Đã đồng ý'
                                  : 'Không đồng ý'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="history-pagination">
                    <p>
                      Hiển thị{' '}
                      <strong>{startIndex + 1}</strong>
                      {' – '}
                      <strong>
                        {Math.min(
                          startIndex + pageSize,
                          filteredHistory.length,
                        )}
                      </strong>
                      {' trong '}
                      <strong>{filteredHistory.length}</strong>
                      {' phiên'}
                    </p>

                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="pagination-button"
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        disabled={safePage <= 1}
                      >
                        Trước
                      </button>

                      <span>
                        Trang {safePage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="pagination-button"
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          )
                        }
                        disabled={safePage >= totalPages}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <footer className="dashboard-footer">
              <span>TOURISM ANALYTICS</span>
              <span>Dữ liệu được lấy trực tiếp từ POI Service.</span>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  )
}

export default VisitDashboard
