import VisitDashboard from './VisitDashboard.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const API_URL = '/api/POIs'

const translations = {
  vi: {
    top: 'THUYẾT MINH ĐA NGÔN NGỮ · KHÁM PHÁ ĐỊA ĐIỂM',
    navPlaces: 'Điểm tham quan',
    navGuide: 'Thuyết minh',
    navAbout: 'Giới thiệu',
    access: 'Mã tham quan',
    eyebrow: 'TRẢI NGHIỆM DI SẢN SỐ',
    heroTitle: 'Khám phá điểm đến theo cách của riêng bạn',
    heroText: 'Tra cứu thông tin địa điểm, khám phá bản đồ và tiếp cận nội dung thuyết minh bằng ngôn ngữ bạn lựa chọn ngay trên điện thoại.',
    explore: 'Khám phá địa điểm',
    learn: 'Tìm hiểu thêm',
    heroNote: 'Hướng dẫn đa ngôn ngữ · Thông tin địa điểm · Trải nghiệm số',
    journey: 'HÀNH TRÌNH CỦA BẠN',
    placesTitle: 'Điểm tham quan',
    placesDesc: 'Danh sách địa điểm được tải từ hệ thống dữ liệu.',
    search: 'Tìm địa điểm...',
    loading: 'Đang tải danh sách địa điểm...',
    empty: 'Không tìm thấy địa điểm phù hợp.',
    error: 'Không thể tải dữ liệu địa điểm.',
    retry: 'Thử tải lại',
    total: 'địa điểm',
    detail: 'Xem chi tiết',
    detailTitle: 'Thông tin địa điểm',
    choose: 'Chọn một địa điểm để xem thông tin.',
    guide: 'KHÁM PHÁ',
    guideTitle: 'Mỗi địa điểm, một câu chuyện',
    guideText: 'Chọn địa điểm trong danh sách để xem thông tin chi tiết được cung cấp bởi hệ thống.',
    aboutTitle: 'Trải nghiệm tham quan thuận tiện hơn',
    aboutText: 'Thuyết minh Đa ngôn ngữ giúp du khách tìm kiếm địa điểm, xác định vị trí và tiếp cận thông tin tham quan thuận tiện hơn.',
    feature1: 'Thông tin tập trung',
    feature1Text: 'Tra cứu địa điểm từ nguồn dữ liệu của hệ thống.',
    feature2: 'Giao diện đa ngôn ngữ',
    feature2Text: 'Chuyển đổi ngôn ngữ hiển thị của giao diện.',
    feature3: 'Thiết kế linh hoạt',
    feature3Text: 'Sử dụng trên máy tính, máy tính bảng và điện thoại.',
    language: 'Ngôn ngữ giao diện',
    footer: 'Nền tảng hướng dẫn tham quan số',
    footerNote: 'Dữ liệu địa điểm được lấy từ POI Service.',
    accessTitle: 'Mã truy cập tham quan',
    accessText: 'Chức năng xác thực mã cần được kết nối với API xác thực của hệ thống.',
    accessLabel: 'Mã truy cập',
    accessPlaceholder: 'Nhập mã truy cập',
    close: 'Đóng',
    selected: 'Địa điểm đã chọn',
    noDescription: 'Chưa có mô tả cho địa điểm này.',
    noImage: 'HÌNH ẢNH ĐỊA ĐIỂM',
    id: 'Mã địa điểm',
    category: 'Loại địa điểm',
    status: 'Trạng thái dữ liệu',
    connected: 'Đã kết nối API',
    disconnected: 'Chưa tải được dữ liệu',
  },
  en: {
    top: 'MULTILINGUAL AUDIO GUIDE · EXPLORE PLACES',
    navPlaces: 'Places',
    navGuide: 'Guide',
    navAbout: 'About',
    access: 'Access code',
    eyebrow: 'DIGITAL HERITAGE EXPERIENCE',
    heroTitle: 'Discover destinations at your own pace',
    heroText: 'Find places, explore the map and access visitor information in your preferred language, right from your phone.',
    explore: 'Explore places',
    learn: 'Learn more',
    heroNote: 'Multilingual interface · Place information · Digital experience',
    journey: 'YOUR JOURNEY',
    placesTitle: 'Places to explore',
    placesDesc: 'Places loaded from the system data source.',
    search: 'Search places...',
    loading: 'Loading places...',
    empty: 'No matching places found.',
    error: 'Could not load place data.',
    retry: 'Try again',
    total: 'places',
    detail: 'View details',
    detailTitle: 'Place information',
    choose: 'Select a place to view its information.',
    guide: 'DISCOVER',
    guideTitle: 'Every place has a story',
    guideText: 'Select a place from the list to view information provided by the system.',
    aboutTitle: 'A more convenient visitor experience',
    aboutText: 'The Multilingual Guide helps visitors find places, locate themselves and access visitor information conveniently.',
    feature1: 'Centralized information',
    feature1Text: 'Browse places from the system data source.',
    feature2: 'Multilingual interface',
    feature2Text: 'Change the interface language.',
    feature3: 'Responsive design',
    feature3Text: 'Designed for desktop, tablet and mobile.',
    language: 'Interface language',
    footer: 'Digital visitor guide platform',
    footerNote: 'Place data is provided by POI Service.',
    accessTitle: 'Visitor access code',
    accessText: 'Code validation must be connected to the system authentication API.',
    accessLabel: 'Access code',
    accessPlaceholder: 'Enter access code',
    close: 'Close',
    selected: 'Selected place',
    noDescription: 'No description is available for this place.',
    noImage: 'PLACE IMAGE',
    id: 'Place ID',
    category: 'Category',
    status: 'Data status',
    connected: 'API connected',
    disconnected: 'Data unavailable',
  },
  zh: {
    top: '多语言讲解系统 · 探索景点',
    navPlaces: '景点',
    navGuide: '导览',
    navAbout: '介绍',
    access: '访问码',
    eyebrow: '数字文化遗产体验',
    heroTitle: '按照自己的节奏探索目的地',
    heroText: '查找景点、探索地图，并使用您选择的语言获取参观信息。',
    explore: '探索景点',
    learn: '了解更多',
    heroNote: '多语言界面 · 景点信息 · 数字体验',
    journey: '您的旅程',
    placesTitle: '游览景点',
    placesDesc: '景点列表来自系统数据。',
    search: '搜索景点...',
    loading: '正在加载景点...',
    empty: '没有找到符合条件的景点。',
    error: '无法加载景点数据。',
    retry: '重试',
    total: '个景点',
    detail: '查看详情',
    detailTitle: '景点信息',
    choose: '选择一个景点以查看信息。',
    guide: '探索',
    guideTitle: '每个景点都有自己的故事',
    guideText: '从列表中选择景点以查看系统提供的信息。',
    aboutTitle: '让参观更加方便',
    aboutText: '多语言讲解系统帮助游客查找景点、定位当前位置，并便捷地获取参观信息。',
    feature1: '集中信息',
    feature1Text: '从系统数据源查询景点。',
    feature2: '多语言界面',
    feature2Text: '切换界面语言。',
    feature3: '灵活设计',
    feature3Text: '适用于电脑、平板和手机。',
    language: '界面语言',
    footer: '数字旅游导览平台',
    footerNote: '景点数据来自 POI Service。',
    accessTitle: '游客访问码',
    accessText: '访问码验证需要连接系统认证 API。',
    accessLabel: '访问码',
    accessPlaceholder: '请输入访问码',
    close: '关闭',
    selected: '已选景点',
    noDescription: '暂无该景点的介绍。',
    noImage: '景点图片',
    id: '景点编号',
    category: '景点类型',
    status: '数据状态',
    connected: 'API 已连接',
    disconnected: '数据不可用',
  },
}

// Đọc dữ liệu từ nhiều cách đặt tên thuộc tính phổ biến của API.
function readField(item, keys) {
  for (const key of keys) {
    const foundKey = Object.keys(item || {}).find(
      (currentKey) => currentKey.toLowerCase() === key.toLowerCase(),
    )

    if (foundKey && item[foundKey] !== null && item[foundKey] !== undefined) {
      const value = item[foundKey]
      if (typeof value === 'string' || typeof value === 'number') {
        if (String(value).trim() !== '') return String(value)
      }
    }
  }

  return ''
}

// Chuẩn hóa dữ liệu API để giao diện không phụ thuộc một tên thuộc tính duy nhất.
function normalizePlace(item, index) {
  return {
    id: readField(item, ['id', 'poiId', 'POIId', 'maPOI', 'maDiaDiem']) || String(index + 1),
    name: readField(item, ['name', 'poiName', 'POIName', 'tenPOI', 'tenDiaDiem', 'title']) || `Địa điểm ${index + 1}`,
    category: readField(item, ['category', 'categoryName', 'type', 'poiType', 'loaiDiaDiem', 'tenLoai']) || '',
    description: readField(item, ['description', 'shortDescription', 'content', 'moTa', 'gioiThieu']) || '',
    address: readField(item, ['address', 'location', 'diaChi', 'viTri']) || '',
    image: readField(item, ['imageUrl', 'image', 'photoUrl', 'thumbnailUrl', 'hinhAnh']) || '',
    raw: item,
  }
}

// API có thể trả về mảng trực tiếp hoặc đặt mảng trong một thuộc tính.
function extractPlaces(data) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const possibleKeys = ['data', 'items', 'results', 'pois', 'records']

  for (const key of possibleKeys) {
    const foundKey = Object.keys(data).find(
      (currentKey) => currentKey.toLowerCase() === key,
    )
    if (foundKey && Array.isArray(data[foundKey])) return data[foundKey]
  }

  return []
}

function TourismHome() {
  const [language, setLanguage] = useState('vi')
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [showAccess, setShowAccess] = useState(false)
  const [userPosition, setUserPosition] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('visitSessionId') || '')
  const sessionIdRef = useRef(sessionStorage.getItem('visitSessionId') || '')
  const [sessionMessage, setSessionMessage] = useState('')
  const [sessionBusy, setSessionBusy] = useState(false)
  const sessionBusyRef = useRef(false)
  const visitStartRequestedRef = useRef(false)

  const t = translations[language]


  async function loadPlaces() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const rows = extractPlaces(data)
      const normalized = rows.map(normalizePlace)

      setPlaces(normalized)
      // Nếu URL có ?poi=..., tự mở đúng địa điểm khi khách quét QR bằng điện thoại.
      const poiFromUrl = new URLSearchParams(window.location.search).get('poi')
      setSelectedPlace((current) => {
        if (!normalized.length) return null
        if (poiFromUrl) {
          return normalized.find((place) => String(place.id) === String(poiFromUrl)) || normalized[0]
        }
        if (current) return normalized.find((place) => place.id === current.id) || normalized[0]
        return normalized[0]
      })
    } catch (err) {
      console.error('Lỗi tải danh sách POI:', err)
      setError(`${t.error} (${err.message})`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Tải địa điểm và ghi nhận phiên ngay khi mở trang người dùng.
    // GPS được xử lý sau; từ chối GPS không ngăn việc ghi nhận lượt tham quan.
    loadPlaces()
    beginVisit()
    // Chỉ chạy một lần khi trang người dùng được mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
// Gửi heartbeat mỗi phút để báo rằng phiên tham quan vẫn đang hoạt động.
useEffect(() => {
  // Chưa có mã phiên thì không cần gửi heartbeat.
  if (!sessionId) return

  let isSending = false

  async function sendHeartbeat() {
    // Tránh gửi nhiều yêu cầu heartbeat cùng lúc.
    if (isSending) return

    isSending = true

    try {
      const response = await fetch(
        `/api/VisitSessions/${encodeURIComponent(sessionId)}/heartbeat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `HTTP ${response.status}`)
      }
    } catch (err) {
      console.error('Không thể cập nhật heartbeat:', err)
    } finally {
      isSending = false
    }
  }

  // Gửi một lần khi có mã phiên.
  sendHeartbeat()

  // Sau đó gửi lại mỗi 60 giây.
  const heartbeatTimer = setInterval(sendHeartbeat, 60 * 1000)

  // Dừng bộ hẹn giờ khi mã phiên thay đổi hoặc component bị tháo.
  return () => {
    clearInterval(heartbeatTimer)
  }
}, [sessionId])
  const filteredPlaces = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase()

    if (!keyword) return places

    return places.filter((place) =>
      `${place.name} ${place.category} ${place.description} ${place.address}`
        .toLocaleLowerCase()
        .includes(keyword),
    )
  }, [places, search])

  function selectPlace(place) {
    setSelectedPlace(place)
    document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt này không hỗ trợ định vị GPS.')
      return
    }
    setLocationMessage('Đang xác định vị trí...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserPosition(coords)
        setLocationMessage(`Vị trí hiện tại: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
      },
      (err) => {
        const messages = {
          1: 'Bạn chưa cấp quyền vị trí. Hãy cho phép truy cập vị trí trong trình duyệt.',
          2: 'Không xác định được vị trí. Hãy bật GPS và thử lại.',
          3: 'Định vị quá thời gian chờ. Vui lòng thử lại.',
        }
        setLocationMessage(messages[err.code] || 'Không thể lấy vị trí hiện tại.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  // Một QR dùng chung cho tất cả khách, không gắn cứng mã POI.
  const qrUrl = `${window.location.origin}${window.location.pathname}#guide`

  // Tạo phiên ngay khi mở trang, không chờ người dùng cho phép GPS.
  async function startVisitSession() {
    if (sessionBusyRef.current) return null
    if (sessionIdRef.current) return sessionIdRef.current

    sessionBusyRef.current = true
    setSessionBusy(true)
    setSessionMessage('Đang ghi nhận lượt tham quan...')

    try {
      const response = await fetch('/api/VisitSessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationConsent: false,
          latitude: null,
          longitude: null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      const id = data.id || data.sessionId
      if (!id) throw new Error('API chưa trả về mã phiên tham quan.')
      sessionIdRef.current = String(id)
      setSessionId(String(id))
      sessionStorage.setItem('visitSessionId', String(id))
      setSessionMessage('Đã ghi nhận lượt tham quan. Đang xác định vị trí nếu bạn cho phép...')
      return String(id)
    } catch (err) {
      console.error('Không thể bắt đầu phiên tham quan:', err)
      setSessionMessage(`Chưa ghi nhận được lượt tham quan: ${err.message}`)
      return null
    } finally {
      sessionBusyRef.current = false
      setSessionBusy(false)
    }
  }

  async function updateVisitLocation(id, coords) {
    if (!id || !coords) return

    try {
      const response = await fetch(`/api/VisitSessions/${encodeURIComponent(id)}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationConsent: true,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      setSessionMessage('Đã ghi nhận lượt tham quan và cập nhật vị trí GPS.')
      const poiId = data.poiId ?? data.POIId ?? data.poi?.id ?? data.poi?.Id
      if (poiId != null) {
        const match = places.find((place) => String(place.id) === String(poiId))
        if (match) setSelectedPlace(match)
      }
    } catch (err) {
      console.error('Không thể cập nhật vị trí phiên tham quan:', err)
      setSessionMessage(`Đã ghi nhận lượt tham quan nhưng chưa cập nhật được GPS: ${err.message}`)
    }
  }

  async function beginVisit() {
    if (visitStartRequestedRef.current) return
    visitStartRequestedRef.current = true

    // Bước 1: tạo phiên ngay, không để hộp thoại GPS làm chậm việc ghi nhận.
    const id = await startVisitSession()
    if (!id) {
      // Cho phép thử lại khi API tạm thời chưa sẵn sàng.
      visitStartRequestedRef.current = false
      return
    }

    // Bước 2: xin GPS. Nếu khách từ chối, phiên vẫn tồn tại nhưng không lưu tọa độ.
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt không hỗ trợ GPS. Lượt tham quan vẫn được ghi nhận ẩn danh.')
      setSessionMessage('Đã ghi nhận lượt tham quan. Trình duyệt không hỗ trợ GPS.')
      return
    }

    setLocationMessage('Đang xin quyền xác định vị trí...')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserPosition(coords)
        setLocationMessage(`Đã xác định vị trí: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
        await updateVisitLocation(id, coords)
      },
      () => {
        setLocationMessage('Bạn chưa chia sẻ GPS. Lượt tham quan vẫn được ghi nhận, không lưu tọa độ.')
        setSessionMessage('Đã ghi nhận lượt tham quan. Bạn chưa chia sẻ vị trí GPS.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  async function endVisitSession() {
    if (!sessionId || sessionBusyRef.current) return
    sessionBusyRef.current = true
    setSessionBusy(true)
    setSessionMessage('Đang kết thúc trải nghiệm...')
    try {
      const response = await fetch(`/api/VisitSessions/${encodeURIComponent(sessionId)}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
      sessionStorage.removeItem('visitSessionId')
      sessionIdRef.current = ''
      visitStartRequestedRef.current = false
      setSessionId('')
      setSessionMessage(`Đã kết thúc trải nghiệm${data.durationSeconds != null ? ` · Thời lượng: ${Math.max(0, Math.round(data.durationSeconds))} giây` : ''}.`)
    } catch (err) {
      console.error('Không thể kết thúc phiên tham quan:', err)
      setSessionMessage(`Không thể kết thúc trải nghiệm: ${err.message}`)
    } finally {
      sessionBusyRef.current = false
      setSessionBusy(false)
    }
  }
  
  // Tự gửi yêu cầu kết thúc phiên khi khách rời trang.
  useEffect(() => {
    if (!sessionId) return

    const handlePageHide = (event) => {
      // Không kết thúc phiên nếu trình duyệt đưa trang vào bộ nhớ đệm.
      if (event.persisted) return

      const url = `/api/VisitSessions/${encodeURIComponent(sessionId)}/end`

      const data = new Blob(
        [JSON.stringify({ reason: 'PageExit' })],
        { type: 'application/json' },
      )

      // Gửi yêu cầu kết thúc phiên khi trang sắp rời đi.
      const sent = navigator.sendBeacon(url, data)

      // Dự phòng nếu trình duyệt không thể xếp yêu cầu vào hàng đợi.
      if (!sent) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'PageExit' }),
          keepalive: true,
        }).catch((error) => {
          console.error('Không thể kết thúc phiên khi rời trang:', error)
        })
      }

      // Không dùng lại mã phiên cũ khi trang được tải lại.
      sessionStorage.removeItem('visitSessionId')
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [sessionId])


  const mapQuery = userPosition
    ? `${userPosition.lat},${userPosition.lng}`
    : selectedPlace?.address || selectedPlace?.name || 'địa điểm du lịch Việt Nam'

  return (
    <div className="app-shell">
      <div className="topbar">{t.top}</div>

      <header className="navbar">
        <a className="brand" href="#home" aria-label="Thuyết minh Đa ngôn ngữ">
          <span className="brand-mark">L</span>
          <span className="brand-copy">
            <span className="brand-name">THUYẾT MINH</span>
            <span className="brand-subtitle">ĐA NGÔN NGỮ</span>
          </span>
        </a>

        <nav className="nav-links" aria-label="Điều hướng chính">
          <a href="#places">{t.navPlaces}</a>
          <a href="#guide">{t.navGuide}</a>
          <a href="#about">{t.navAbout}</a>
        </nav>

        <div className="nav-actions">
          <select
            className="language-select"
            aria-label={t.language}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <button className="button button-primary" onClick={() => setShowAccess(true)}>
            {t.access}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-overlay" />
          <div className="container hero-inner">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {t.eyebrow}
              </div>
              <h1>{t.heroTitle}</h1>
              <p>{t.heroText}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#places">{t.explore}</a>
                <a className="button button-glass" href="#about">{t.learn}</a>
              </div>
              <div className="hero-note">{t.heroNote}</div>
            </div>
            <div className="hero-side-note">
              <span className="hero-side-number">01</span>
              <span>KHÁM PHÁ</span>
              <span className="hero-side-rule" />
              <span>ĐA NGÔN NGỮ</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>THUYẾT MINH ĐA NGÔN NGỮ</span>
            <span>DISCOVER · LEARN · EXPERIENCE</span>
          </div>
        </section>

        <section className="quick-tools-section" aria-label="Công cụ tham quan">
          <div className="container quick-tools-grid">
            <article className="quick-tool-card">
              <div className="quick-tool-icon" aria-hidden="true">GPS</div>
              <div className="quick-tool-copy">
                <h2>Định vị vị trí của bạn</h2>
                <p>Cho phép GPS để xác định vị trí hiện tại và mở bản đồ Google Maps.</p>
                <button className="button button-primary" type="button" onClick={getCurrentLocation}>Lấy vị trí hiện tại</button>
                {locationMessage && <p className="tool-feedback" role="status">{locationMessage}</p>}
              </div>
            </article>
            <article className="quick-tool-card qr-display-card">
              <div className="quick-tool-icon" aria-hidden="true">QR</div>
              <div className="quick-tool-copy">
                <h2>Mã QR địa điểm</h2>
                <p>Khách dùng camera điện thoại quét mã này để mở thông tin địa điểm đang chọn.</p>
                <div className="qr-code-wrap">
                  <QRCodeSVG value={qrUrl} size={176} level="M" includeMargin />
                  <strong>Thuyết minh Đa ngôn ngữ</strong>
                  <small>Quét mã để mở trang trải nghiệm chung</small>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section map-section" id="map">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-kicker">GOOGLE MAPS</div>
                <h2>Bản đồ khám phá</h2>
                <p className="section-description">Xem địa điểm đang chọn hoặc vị trí hiện tại trên Google Maps.</p>
              </div>
              <a className="button button-outline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">Mở Google Maps</a>
            </div>
            <div className="map-frame-wrap">
              <iframe title="Google Maps - Thuyết minh Đa ngôn ngữ" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
            {userPosition && selectedPlace?.address && <a className="map-direction-link" href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${encodeURIComponent(selectedPlace.address)}&travelmode=walking`} target="_blank" rel="noreferrer">Chỉ đường từ vị trí hiện tại đến địa điểm đã chọn</a>}
          </div>
        </section>

        <section className="section places-section" id="places">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-kicker">{t.journey}</div>
                <h2>{t.placesTitle}</h2>
                <p className="section-description">{t.placesDesc}</p>
              </div>
              <div className="place-count">
                <span className="count-number">{places.length}</span>
                <span>{t.total}</span>
              </div>
            </div>

            <div className="data-status">
              <span className={`status-dot ${error ? 'status-dot-error' : loading ? 'status-dot-loading' : 'status-dot-ok'}`} />
              <span>{loading ? t.loading : error ? t.disconnected : t.connected}</span>
              <span className="status-source">POI Service · /api/POIs</span>
            </div>

            <div className="search-row">
              <label className="search-box">
                <span className="search-symbol" aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                />
                {search && (
                  <button className="clear-search" onClick={() => setSearch('')} type="button" aria-label="Xóa tìm kiếm">
                    ×
                  </button>
                )}
              </label>
              <button className="button button-outline" onClick={loadPlaces} disabled={loading}>
                {loading ? '...' : t.retry}
              </button>
            </div>

            {error && (
              <div className="error-panel" role="alert">
                <div>
                  <strong>{t.error}</strong>
                  <p>{error}</p>
                  <small>Hãy kiểm tra POI Service tại cổng 5252 và cấu hình proxy trong vite.config.js.</small>
                </div>
                <button className="button button-primary" onClick={loadPlaces}>{t.retry}</button>
              </div>
            )}

            {loading && (
              <div className="loading-grid" aria-label={t.loading}>
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            )}

            {!loading && !error && filteredPlaces.length === 0 && (
              <div className="empty-state">{t.empty}</div>
            )}

            {!loading && !error && filteredPlaces.length > 0 && (
              <div className="places-grid">
                {filteredPlaces.map((place, index) => (
                  <article
                    className={`place-card ${selectedPlace?.id === place.id ? 'place-card-selected' : ''}`}
                    key={`${place.id}-${index}`}
                  >
                    <div className="place-card-visual">
                      {place.image ? (
                        <img
                          src={place.image}
                          alt={place.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="place-art">
                          <span className="place-art-number">{String(index + 1).padStart(2, '0')}</span>
                          <span className="place-art-title">{place.name}</span>
                          <span className="place-art-caption">THUYẾT MINH ĐA NGÔN NGỮ</span>
                        </div>
                      )}
                      <span className="place-index">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="place-card-body">
                      <div className="place-category">{place.category || 'THUYẾT MINH ĐA NGÔN NGỮ'}</div>
                      <h3>{place.name}</h3>
                      <p>{place.description || t.noDescription}</p>
                      <button className="text-link" onClick={() => selectPlace(place)}>
                        {t.detail}
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="guide-section" id="guide">
          <div className="container">
            <div className="guide-heading">
              <div className="section-kicker">{t.guide}</div>
              <h2>{t.guideTitle}</h2>
              <p>{t.guideText}</p>
              <div className="visit-session-panel" style={{ marginTop: 20, padding: 18, border: '1px solid #d8e2dc', borderRadius: 14, background: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>Phiên tham quan</h3>
                <p>Quét mã QR dùng chung để mở trang này. Bấm bắt đầu để ghi nhận phiên; chia sẻ GPS là tùy chọn để xác định địa điểm gần nhất.</p>
                {sessionId ? (
                  <button className="button button-outline" type="button" onClick={endVisitSession} disabled={sessionBusy}>
                    {sessionBusy ? 'Đang xử lý...' : 'Kết thúc trải nghiệm'}
                  </button>
                ) : (
                  <button className="button button-primary" type="button" onClick={beginVisit} disabled={sessionBusy}>
                    {sessionBusy ? 'Đang xử lý...' : 'Bắt đầu trải nghiệm'}
                  </button>
                )}
                {sessionMessage && <p role="status" style={{ marginBottom: 0 }}>{sessionMessage}</p>}
              </div>
            </div>

            <div className="detail-panel">
              <div className="detail-visual">
                {selectedPlace?.image ? (
                  <img src={selectedPlace.image} alt={selectedPlace.name} />
                ) : (
                  <div className="detail-art">
                    <span className="detail-art-overline">{t.selected}</span>
                    <span className="detail-art-title">{selectedPlace?.name || t.detailTitle}</span>
                    <span className="detail-art-bottom">THUYẾT MINH ĐA NGÔN NGỮ</span>
                  </div>
                )}
              </div>
              <div className="detail-content">
                <div className="section-kicker">{t.detailTitle}</div>
                <h3>{selectedPlace?.name || t.choose}</h3>
                {selectedPlace ? (
                  <>
                    <p>{selectedPlace.description || t.noDescription}</p>
                    {selectedPlace.address && (
                      <div className="detail-field">
                        <span>{t.category}</span>
                        <strong>{selectedPlace.address}</strong>
                      </div>
                    )}
                    <div className="detail-field">
                      <span>{t.id}</span>
                      <strong>{selectedPlace.id}</strong>
                    </div>
                    {selectedPlace.category && (
                      <div className="detail-field">
                        <span>{t.category}</span>
                        <strong>{selectedPlace.category}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{t.choose}</p>
                )}
                <a className="button button-primary detail-button" href="#places">{t.placesTitle}</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container">
            <div className="about-intro">
              <div className="section-kicker">ABOUT THE EXPERIENCE</div>
              <h2>{t.aboutTitle}</h2>
              <p>{t.aboutText}</p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-number">01</span>
                <h3>{t.feature1}</h3>
                <p>{t.feature1Text}</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">02</span>
                <h3>{t.feature2}</h3>
                <p>{t.feature2Text}</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">03</span>
                <h3>{t.feature3}</h3>
                <p>{t.feature3Text}</p>
              </article>
            </div>

            <div className="language-panel">
              <div>
                <h3>{t.language}</h3>
                <p>Vietnamese · English · Chinese</p>
              </div>
              <div className="language-options">
                {[
                  ['vi', 'Tiếng Việt'],
                  ['en', 'English'],
                  ['zh', '中文'],
                ].map(([code, label]) => (
                  <button
                    key={code}
                    className={`language-option ${language === code ? 'active' : ''}`}
                    onClick={() => setLanguage(code)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <a className="footer-brand" href="#home">THUYẾT MINH <span>ĐA NGÔN NGỮ</span></a>
          <p>{t.footer}</p>
          <span className="footer-note">{t.footerNote}</span>
        </div>
      </footer>

      {showAccess && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAccess(false)
          }}
        >
          <div className="access-modal qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
            <button
              type="button"
              className="modal-close"
              aria-label={t.close}
              onClick={() => setShowAccess(false)}
            >
              ×
            </button>
            <div className="section-kicker">THUYẾT MINH ĐA NGÔN NGỮ</div>
            <h2 id="qr-modal-title">Mã QR tham quan</h2>
            <div className="qr-code-wrap qr-modal-code">
              <QRCodeSVG value={qrUrl} size={240} level="M" includeMargin />
              <strong>Thuyết minh Đa ngôn ngữ</strong>
              <p>Dùng camera điện thoại quét mã để mở trang trải nghiệm chung.</p>
              <small className="qr-url-text">{qrUrl}</small>
            </div>
            <button className="button button-primary modal-submit" type="button" onClick={() => setShowAccess(false)}>
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin/visits') return <VisitDashboard />
  return <TourismHome />
}

export default App
