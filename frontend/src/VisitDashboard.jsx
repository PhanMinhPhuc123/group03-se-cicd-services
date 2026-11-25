
import { useCallback, useEffect, useMemo, useState } from 'react'
import './VisitDashboard.css'

import DashboardSidebar from './admin/DashboardSidebar.jsx'
import PlaceManagement from './admin/PlaceManagement.jsx'
import Reports from './admin/Reports.jsx'
import GPSManagement from "./admin/GPSManagement.jsx";

// Định dạng thời lượng tham quan từ số giây.

function formatDuration(seconds) {
  const numericSeconds = Number(seconds)
  if (seconds === null || seconds === undefined || seconds === '' || !Number.isFinite(numericSeconds)) return '—'

  const totalSeconds = Math.max(0, Math.floor(numericSeconds))

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

function formatExitReason(reason, isActive) {
  if (isActive) return 'Đang diễn ra'

  switch (reason) {
    case 'User':
      return 'Kết thúc bình thường'
    case 'PageExit':
      return 'Khách rời trang'
    case 'Timeout':
      return 'Hết thời gian chờ'
    default:
      return 'Không xác định'
  }
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
const EMPTY_HISTORY = []
function VisitDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [chartPeriod, setChartPeriod] = useState('day')
  const [activeSection, setActiveSection] = useState('overview')

  const pageSize = 8

// Chỉ lấy dữ liệu từ API, không cập nhật state tại đây.
const fetchStatsData = useCallback(async () => {
  const token = sessionStorage.getItem('adminToken')

  if (!token) {
    window.location.replace('/admin/login')
    return null
  }

  const response = await fetch('/api/VisitSessions/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem('adminToken')
    window.location.replace('/admin/login')
    return null
  }

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu (HTTP ${response.status})`)
  }

  const data = await response.json()

  const read = (object, ...keys) => {
    for (const key of keys) {
      const found = Object.keys(object || {}).find(
        (candidate) => candidate.toLowerCase() === key.toLowerCase(),
      )

      if (found && object[found] !== undefined) return object[found]
    }

    return null
  }

  const rawHistory = read(data, 'history')

  const history = (Array.isArray(rawHistory) ? rawHistory : []).map((item) => {
    const startedAt = read(item, 'startedAt', 'entryTime')
    const endedAt = read(item, 'endedAt', 'exitTime')
    const started = startedAt ? new Date(startedAt).getTime() : NaN
    const ended = endedAt ? new Date(endedAt).getTime() : NaN

    const durationSeconds =
      Number.isFinite(started) && Number.isFinite(ended)
        ? Math.max(0, Math.floor((ended - started) / 1000))
        : null

    return {
      ...item,
      sessionId: read(item, 'sessionId') ?? '',
      entryTime: startedAt,
      exitTime: endedAt,
      durationSeconds,
      poiName:read(item, 'selectedPoiName', 'SelectedPoiName', 'poiName', 'placeName') ?? 'Chưa chọn địa điểm',
      gpsPermissionStatus: String(
        read(item, 'gpsStatus', 'gpsPermissionStatus') ?? 'not_requested',
      ).toUpperCase(),
      isActive: read(item, 'isActive') ?? !endedAt,
      exitReason: read(item, 'exitReason', 'endReason') ?? null,
    }
  })

  return {
    ...data,
    totalVisits: read(data, 'totalSessions', 'totalVisits') ?? 0,
    activeVisits: read(data, 'activeSessions', 'activeVisits') ?? 0,
    completedVisits: read(data, 'endedSessions', 'completedVisits') ?? 0,
    history,
  }
}, [])

// Dùng cho nút Làm mới và nút Thử lại.
const loadStats = useCallback(async () => {
  setLoading(true)
  setError('')

  try {
    const result = await fetchStatsData()
    if (result) setStats(result)
  } catch (err) {
    const message =
      err instanceof TypeError && err.message === 'Failed to fetch'
        ? 'Không kết nối được API Gateway tại /api/VisitSessions/stats. Hãy kiểm tra API Gateway đang chạy và frontend đang được mở qua Vite có proxy /api.'
        : err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi khi tải dữ liệu thống kê.'

    setError(message)
  } finally {
    setLoading(false)
  }
}, [fetchStatsData])

// Tải dữ liệu ban đầu khi mở dashboard.
useEffect(() => {
  let cancelled = false

  fetchStatsData()
    .then((result) => {
      if (!cancelled && result) {
        setStats(result)
      }
    })
    .catch((err) => {
      if (cancelled) return

      const message =
        err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Không kết nối được API Gateway tại /api/VisitSessions/stats. Hãy kiểm tra API Gateway đang chạy và frontend đang được mở qua Vite có proxy /api.'
          : err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi tải dữ liệu thống kê.'

      setError(message)
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

  return () => {
    cancelled = true
  }
}, [fetchStatsData])
// Lịch sử phiên tham quan do backend trả về.
const history = stats?.history ?? EMPTY_HISTORY
// Lọc lịch sử theo từ khóa và trạng thái.
const filteredHistory = useMemo(() => {
  const keyword = normalizeText(searchText.trim())

  return history.filter((item) => {
    const matchesSearch =
      !keyword ||
      normalizeText(item.poiName).includes(keyword) ||
      normalizeText(item.sessionId).includes(keyword)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && item.isActive) ||
      (statusFilter === 'completed' && !item.isActive)

    return matchesSearch && matchesStatus
  })
}, [history, searchText, statusFilter])

  // Gom nhóm lượt tham quan theo ngày, tuần, tháng hoặc năm.
  const chartData = useMemo(() => {
    const groups = new Map()

    function getGroup(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      if (chartPeriod === 'year') {
        return { key: String(year), label: String(year) }
      }

      if (chartPeriod === 'month') {
        const key = `${year}-${month}`
        return { key, label: `${month}/${year}` }
      }

      if (chartPeriod === 'week') {
        const start = new Date(year, date.getMonth(), date.getDate())
        const weekday = (start.getDay() + 6) % 7

        start.setDate(start.getDate() - weekday)

        const key = `${start.getFullYear()}-${String(
          start.getMonth() + 1,
        ).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

        return {
          key,
          label: `${String(start.getDate()).padStart(2, '0')}/${String(
            start.getMonth() + 1,
          ).padStart(2, '0')}`,
        }
      }

      const key = `${year}-${month}-${day}`
      return { key, label: `${day}/${month}` }
    }

    for (const item of history) {
      if (!item.entryTime) continue

      const date = new Date(item.entryTime)

      if (Number.isNaN(date.getTime())) continue

      const group = getGroup(date)

      if (!groups.has(group.key)) {
        groups.set(group.key, { ...group, visits: 0 })
      }

      groups.get(group.key).visits += 1
    }

    return [...groups.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
  }, [history, chartPeriod])

  const chartMax = Math.max(1, ...chartData.map((item) => item.visits))

  // Phân trang lịch sử tham quan.
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

  function handleSearchChange(value) {
    setSearchText(value)
    setCurrentPage(1)
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  // Điều hướng đến nội dung tương ứng trên dashboard.
  function handleNavigate(section) {
    setActiveSection(section)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Tiêu đề thay đổi theo mục đang chọn.
  const pageTitle = {
    overview: 'Tổng quan tham quan',
    history: 'Lịch sử tham quan',
    places: 'Quản lý điểm tham quan',
    reports: 'Báo cáo thống kê',
    gps: 'Bản đồ GPS',
  }[activeSection] || 'Quản trị hệ thống'

  const pageSubtitle = {
    overview:
      'Theo dõi và phân tích các phiên tham quan được ghi nhận trên hệ thống.',
    history:
      'Tra cứu thông tin và trạng thái các phiên tham quan.',
    places:
      'Quản lý thông tin, tọa độ GPS và trạng thái hoạt động của các điểm tham quan.',
    reports:
      'Tổng hợp số liệu hoạt động và các điểm tham quan nổi bật.',
    gps:
      'Theo dõi vị trí và kiểm tra tọa độ các điểm tham quan.',
  }[activeSection] || 'Quản lý hệ thống du lịch.'

  return (
    <main className="visit-dashboard">
      <DashboardSidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-heading">
            <p className="dashboard-eyebrow">QUẢN TRỊ HỆ THỐNG</p>
            <h1>{pageTitle}</h1>
            <p className="dashboard-subtitle">{pageSubtitle}</p>
          </div>

          <div className="dashboard-actions">
          <button
  type="button"
  className="dashboard-button dashboard-button-secondary"
  onClick={() => {
    sessionStorage.removeItem('adminToken')
    window.location.replace('/admin/login')
  }}
>
  Đăng xuất
</button>

            {activeSection !== 'places' && (
              <button
                type="button"
                className="dashboard-button dashboard-button-primary"
                onClick={loadStats}
                disabled={loading}
              >
                {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
              </button>
            )}
          </div>
        </header>

        {/* Trang quản lý điểm tham quan */}
{activeSection === 'places' ? (
  <PlaceManagement />
) : activeSection === 'gps' ? (
  <GPSManagement />
) : (
  <>
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
                {/* Trang tổng quan */}
                {activeSection === 'overview' && (
                  <>
                    <section className="dashboard-summary">
                      <article className="summary-card summary-card-blue">
                        <div className="summary-card-top">
                          <span className="summary-label">
                            TỔNG LƯỢT THAM QUAN
                          </span>
                          <span className="summary-mark summary-mark-blue">
                            01
                          </span>
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
                          <span className="summary-label">
                            ĐANG THAM QUAN
                          </span>
                          <span className="summary-mark summary-mark-green">
                            02
                          </span>
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
                          <span className="summary-label">
                            ĐÃ HOÀN THÀNH
                          </span>
                          <span className="summary-mark summary-mark-purple">
                            03
                          </span>
                        </div>
                        <strong className="summary-value">
                          {stats.completedVisits ?? 0}
                        </strong>
                        <p className="summary-description">
                          Các phiên đã kết thúc
                        </p>
                      </article>


                    </section>

                    <section className="analytics-section">
                      <div className="analytics-header">
                        <div>
                          <p className="section-eyebrow">
                            PHÂN TÍCH LƯỢT THAM QUAN
                          </p>
                          <h2>Xu hướng theo thời gian</h2>
                          <p className="history-subtitle">
                            Thống kê được tổng hợp từ thời điểm bắt đầu của
                            các phiên hiện có.
                          </p>
                        </div>

                        <label className="history-filter analytics-filter">
                          <span>Khoảng thống kê</span>
                          <select
                            value={chartPeriod}
                            onChange={(event) =>
                              setChartPeriod(event.target.value)
                            }
                          >
                            <option value="day">Theo ngày</option>
                            <option value="week">Theo tuần</option>
                            <option value="month">Theo tháng</option>
                            <option value="year">Theo năm</option>
                          </select>
                        </label>
                      </div>

                      {chartData.length === 0 ? (
                        <div className="analytics-empty">
                          Chưa có dữ liệu phiên tham quan để phân tích.
                        </div>
                      ) : (
                        <div
                          className="analytics-chart"
                          role="img"
                          aria-label="Biểu đồ số lượt tham quan theo thời gian"
                        >
                          {chartData.map((item) => (
                            <div
                              className="analytics-bar-column"
                              key={item.key}
                              title={`${item.label}: ${item.visits} lượt`}
                            >
                              <strong className="analytics-bar-value">
                                {item.visits}
                              </strong>

                              <div className="analytics-bar-track">
                                <div
                                  className="analytics-bar"
                                  style={{
                                    height: `${Math.max(
                                      6,
                                      (item.visits / chartMax) * 100,
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="analytics-bar-label">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="analytics-note">
                        Biểu đồ hiển thị tối đa 12 mốc thời gian gần nhất
                        trong dữ liệu lịch sử đã tải.
                      </p>
                    </section>
                  </>
                )}

                {/* Trang lịch sử tham quan */}
                {activeSection === 'history' && (
                  <section className="dashboard-history">
                    <div className="history-header">
                      <div>
                        <p className="section-eyebrow">
                          HOẠT ĐỘNG GẦN ĐÂY
                        </p>
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
                              <th>Lý do kết thúc</th>
                              <th>GPS</th>
                            </tr>
                          </thead>


                            <tbody>
                              {visibleHistory.map((item) => (
                                <tr key={item.sessionId}>
                                  <td>
                                  <div className="history-place">
                                    <strong>
                                      {item.poiName || 'Chưa chọn địa điểm'}
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
                                    {(() => {
                                      const start = new Date(item.entryTime).getTime()
                                      if (!Number.isFinite(start)) return '—'

                                      if (item.isActive) {
                                        return formatDuration((Date.now() - start) / 1000)
                                      }

                                      if (item.durationSeconds !== null && item.durationSeconds !== undefined && item.durationSeconds !== '') {
                                        return formatDuration(item.durationSeconds)
                                      }

                                      const end = item.exitTime ? new Date(item.exitTime).getTime() : NaN
                                      return Number.isFinite(end) ? formatDuration((end - start) / 1000) : '—'
                                    })()}
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
  {formatExitReason(item.exitReason, item.isActive)}
</td>
                                  <td>
                                    <span
                                      className={`gps-label ${
                                        (item.gpsPermissionStatus || (item.locationConsent ? 'GRANTED' : 'NOT_REQUESTED')) === 'GRANTED'
                                          ? 'gps-consented'
                                          : (item.gpsPermissionStatus || 'NOT_REQUESTED') === 'DENIED'
                                            ? 'gps-declined'
                                            : 'gps-pending'
                                      }`}
                                    >
                                      {{
                                        NOT_REQUESTED: 'Chưa hỏi quyền',
                                        GRANTED: 'Đã cấp quyền',
                                        DENIED: 'Đã từ chối',
                                        UNAVAILABLE: 'Không hỗ trợ GPS',
                                        ERROR: 'Lỗi GPS',
                                      }[item.gpsPermissionStatus || (item.locationConsent ? 'GRANTED' : 'NOT_REQUESTED')]}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="history-pagination">
                          <p>
                            Hiển thị <strong>{startIndex + 1}</strong>
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
                                setCurrentPage((page) =>
                                  Math.max(1, page - 1),
                                )
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
                )}

                {/* Trang báo cáo thống kê riêng */}
                {activeSection === 'reports' && (
                  <Reports
                    history={history}
                    stats={stats}
                  />
                )}

                {/* Trang GPS hiện chưa có bản đồ riêng */}
                {activeSection === 'gps' && (
                  <section className="dashboard-empty">
                    <strong>Bản đồ GPS</strong>
                    <p>
                      Bạn có thể xem tọa độ GPS trong trang quản lý điểm tham
                      quan. Bản đồ riêng sẽ được bổ sung khi cần hiển thị vị
                      trí trực quan.
                    </p>
                    <button
                      type="button"
                      className="dashboard-button dashboard-button-secondary"
                      onClick={() => handleNavigate('places')}
                    >
                      Xem điểm tham quan
                    </button>
                  </section>
                )}

                <footer className="dashboard-footer">
                  <span>TOURISM ANALYTICS</span>
                  <span>
                    Dữ liệu được lấy trực tiếp từ các API của hệ thống.
                  </span>
                </footer>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}

export default VisitDashboard
