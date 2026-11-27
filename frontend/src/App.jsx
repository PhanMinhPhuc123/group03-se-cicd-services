import VisitDashboard from './VisitDashboard.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'
import AdminLogin from './AdminLogin.jsx'
import NearbyMap from './NearbyMap.jsx'
import {
  capNhatTrangThaiGps,
  capNhatViTri,
  guiHeartbeat,
  ketThucPhien,
  taoPhienTruyCap,
} from './tinh-nang/phien-truy-cap/dichVuPhienTruyCap.js'

const API_URL = '/api/POIs'
// Ảnh mặc định cho 15 địa điểm trong thư mục public/images.
// Ánh xạ ảnh theo tên địa điểm để tránh nhầm ảnh khi ID API thay đổi.
const POI_IMAGES = {
  'Dinh Độc Lập': 'dinh-doc-lap.jpg',
  'Nhà thờ Đức Bà': 'nha-tho-duc-ba.jpg',
  'Bưu điện Trung tâm Sài Gòn': 'buu-dien-trung-tam.webp',
  'Chợ Bến Thành': 'cho-ben-thanh.jpg',
  'Nhà hát Thành Phố': 'nha-hat-thanh-pho.jpg',
  'Bến Bạch Đằng': 'ben-bach-dang.jpeg',
  'Phố đi bộ Nguyễn Huệ': 'pho-di-bo-nguyen-hue.webp',
  'Bảo tàng Chứng tích Chiến tranh': 'bao-tang-chung-tich.png',
  'Bảo tàng TP Hồ Chí Minh': 'bao-tang-tphcm.jpg',
  'Thảo Cầm Viên Sài Gòn': 'thao-cam-vien.jpg',
  'Công viên Tao Đàn': 'cong-vien-tao-dan.jpg',
  'Chợ Bình Tây': 'cho-binh-tay.webp',
  'Chùa Bà Thiên Hậu': 'chua-ba-thien-hau.webp',
  'Địa đạo Củ Chi': 'dia-dao-cu-chi.webp',
  'Landmark 81': 'landmark-81.jpg',
}

// Chuẩn hóa tên để so khớp khi API có khác biệt chữ hoa/thường hoặc khoảng trắng.
function normalizePoiName(name) {
  return String(name ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('vi')
}

const POI_IMAGE_BY_NAME = Object.fromEntries(
  Object.entries(POI_IMAGES).map(([name, filename]) => [
    normalizePoiName(name),
    filename,
  ]),
)

// Tìm ảnh theo tên địa điểm, kể cả khi API trả về tên đầy đủ.
function getPoiImage(name) {
  const normalizedName = normalizePoiName(name)

  // Xử lý các tên địa điểm có nhiều cách viết.    
const aliases = [
  {
    keywords: ['nhà thờ đức bà', 'nhà thờ đức bà sài gòn'],
    filename: 'nha-tho-duc-ba.jpg',
  },
  {
    keywords: ['nhà hát thành phố', 'nhà hát thành phố hồ chí minh'],
    filename: 'nha-hat-thanh-pho.jpg',
  },
  {
    keywords: ['bảo tàng tp hồ chí minh', 'bảo tàng thành phố hồ chí minh'],
    filename: 'bao-tang-tphcm.jpg',
  },
  {
    keywords: ['địa đạo củ chi', 'địa đạo củ chi - bến dược'],
    filename: 'dia-dao-cu-chi.webp',
  },
]


  // Ưu tiên ánh xạ tên chính xác trước.
  const exactFilename = POI_IMAGE_BY_NAME[normalizedName]

  if (exactFilename) {
    return `/images/${encodeURIComponent(exactFilename)}`
  }

  // Nếu tên API dài hơn, tìm theo tên tương đương.
  const matched = aliases.find((item) =>
    item.keywords.some((keyword) =>
      normalizedName.includes(normalizePoiName(keyword))
    )
  )

  if (matched) {
    return `/images/${encodeURIComponent(matched.filename)}`
  }

  return ''
}
const AUDIO_SUPPORTED_LANGUAGES = ['vi', 'en', 'zh']
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
    listenGuide: 'Nghe thuyết minh',
    audioUnsupported: 'Giọng đọc cho ngôn ngữ này chưa được hỗ trợ. Bạn vẫn có thể tạo và đọc nội dung thuyết minh.',
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
    listenGuide: 'Listen to audio guide',
    audioUnsupported: 'Audio playback for this language is not supported yet. You can still generate and read the narration text.',
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
    listenGuide: '收听景点讲解',
    audioUnsupported: '暂不支持此语言的语音播放，但您仍然可以生成和阅读讲解文本。',
    id: '景点编号',
    category: '景点类型',
    status: '数据状态',
    connected: 'API 已连接',
    disconnected: '数据不可用',
  },
}

// Bổ sung ngôn ngữ giao diện Nhật và Hàn. Các trường chưa dịch riêng sẽ dùng tiếng Anh.
translations.ja = {
  ...translations.en,
  top: '多言語音声ガイド · 観光スポットを探索', navPlaces: '観光スポット', navGuide: 'ガイド', navAbout: '紹介', access: 'アクセスコード',
  eyebrow: 'デジタル文化遺産体験', heroTitle: '自分のペースで目的地を発見', heroText: '観光スポットを検索し、地図を探索して、選択した言語で観光情報を確認できます。',
  explore: 'スポットを探す', learn: '詳しく見る', heroNote: '多言語インターフェース · 観光情報 · デジタル体験', journey: 'あなたの旅',
  placesTitle: '観光スポット', placesDesc: 'システムのデータから読み込まれたスポット一覧です。', search: 'スポットを検索...', loading: 'スポットを読み込み中...',
  empty: '該当するスポットが見つかりません。', error: 'スポット情報を読み込めません。', retry: '再試行', total: '件', detail: '詳細を見る',
  detailTitle: 'スポット情報', choose: 'スポットを選択して情報を表示してください。', guide: '探索', guideTitle: 'それぞれの場所に物語がある',
  guideText: '一覧からスポットを選択すると、システムが提供する詳細情報を確認できます。', aboutTitle: 'より便利な観光体験',
  aboutText: '多言語ガイドは、スポット検索、現在地の確認、観光情報へのアクセスをサポートします。',
  feature1: '情報を一元管理', feature1Text: 'システムのデータからスポットを検索できます。', feature2: '多言語インターフェース', feature2Text: '表示言語を切り替えられます。',
  feature3: '柔軟なデザイン', feature3Text: 'パソコン、タブレット、スマートフォンで利用できます。', language: '表示言語', footer: 'デジタル観光ガイド',
  footerNote: 'スポット情報は POI Service から取得します。', accessTitle: '観光アクセスコード', accessText: 'コード認証にはシステムの認証 API との接続が必要です。',
  accessLabel: 'アクセスコード', accessPlaceholder: 'アクセスコードを入力', close: '閉じる', selected: '選択中のスポット',
  noDescription: 'このスポットの説明はありません。', noImage: 'スポット画像', listenGuide: '音声ガイドを聞く', id: 'スポット ID', category: 'カテゴリー',
  status: 'データ状態', connected: 'API 接続済み', disconnected: 'データを取得できません',
  gpsTitle: '現在地を確認', gpsText: 'GPS を許可すると、現在地を確認して Google マップを開けます。', gpsButton: '現在地を取得',
  qrTitle: 'スポット QR コード', qrText: 'スマートフォンのカメラでコードを読み取り、選択中のスポット情報を開きます。',
  qrCommon: '共通ページを開くにはコードをスキャンしてください', mapTitle: '探索マップ', mapText: '選択したスポットまたは現在地を Google マップで表示します。', openMaps: 'Google マップを開く',
  directions: '現在地から選択したスポットへの道順', nearbyTitle: '近くのスポット', shareGps: '近くのスポットを探すには GPS の位置情報を共有してください。',
  visitSession: '訪問セッション', visitSessionText: '共通 QR コードでこのページを開きます。開始するとセッションが記録されます。GPS の共有は任意です。',
  aiTitle: '多言語 AI 音声ガイド', narrationLanguage: 'ガイドの言語', readingSpeed: '読み上げ速度', aboutExperience: 'この体験について',
  qrModalTitle: '観光 QR コード', qrModalText: 'スマートフォンのカメラでスキャンして共通ページを開きます。', languageList: 'ベトナム語 · 英語 · 中国語 · ドイツ語 · スペイン語 · フランス語 · ロシア語 · 日本語 · 韓国語',
}
translations.ko = {
  ...translations.en,
  top: '다국어 오디오 가이드 · 관광지 탐색', navPlaces: '관광지', navGuide: '가이드', navAbout: '소개', access: '접속 코드',
  eyebrow: '디지털 문화유산 체험', heroTitle: '나만의 속도로 여행지를 발견하세요', heroText: '관광지를 찾고 지도를 둘러보며 원하는 언어로 관광 정보를 확인하세요.',
  explore: '관광지 둘러보기', learn: '자세히 보기', heroNote: '다국어 인터페이스 · 관광 정보 · 디지털 체험', journey: '나의 여행',
  placesTitle: '관광지', placesDesc: '시스템 데이터에서 불러온 관광지 목록입니다.', search: '관광지 검색...', loading: '관광지를 불러오는 중...',
  empty: '조건에 맞는 관광지가 없습니다.', error: '관광지 데이터를 불러올 수 없습니다.', retry: '다시 시도', total: '곳', detail: '상세 보기',
  detailTitle: '관광지 정보', choose: '정보를 보려면 관광지를 선택하세요.', guide: '탐색', guideTitle: '모든 장소에는 이야기가 있습니다.',
  guideText: '목록에서 관광지를 선택하면 시스템이 제공하는 상세 정보를 볼 수 있습니다.', aboutTitle: '더 편리한 관광 경험',
  aboutText: '다국어 가이드는 관광지 검색, 현재 위치 확인 및 관광 정보 이용을 지원합니다.', feature1: '정보 통합', feature1Text: '시스템 데이터에서 관광지를 검색하세요.',
  feature2: '다국어 인터페이스', feature2Text: '화면 표시 언어를 변경할 수 있습니다.', feature3: '유연한 디자인', feature3Text: '컴퓨터, 태블릿, 휴대전화에서 사용할 수 있습니다.',
  language: '인터페이스 언어', footer: '디지털 관광 가이드 플랫폼', footerNote: '관광지 데이터는 POI Service에서 제공합니다.',
  accessTitle: '관광 접속 코드', accessText: '코드 확인 기능은 시스템 인증 API와 연결해야 합니다.', accessLabel: '접속 코드', accessPlaceholder: '접속 코드를 입력하세요',
  close: '닫기', selected: '선택한 관광지', noDescription: '이 관광지에 대한 설명이 없습니다.', noImage: '관광지 이미지', listenGuide: '오디오 가이드 듣기',
  id: '관광지 ID', category: '관광지 유형', status: '데이터 상태', connected: 'API 연결됨', disconnected: '데이터를 사용할 수 없음',
  gpsTitle: '현재 위치 확인', gpsText: 'GPS를 허용하면 현재 위치를 확인하고 Google 지도를 열 수 있습니다.', gpsButton: '현재 위치 가져오기',
  qrTitle: '관광지 QR 코드', qrText: '휴대전화 카메라로 코드를 스캔하여 선택한 관광지 정보를 여세요.', qrCommon: '공통 체험 페이지를 열려면 코드를 스캔하세요',
  mapTitle: '탐색 지도', mapText: '선택한 관광지 또는 현재 위치를 Google 지도에서 확인하세요.', openMaps: 'Google 지도 열기', directions: '현재 위치에서 선택한 관광지까지 길 찾기',
  nearbyTitle: '내 주변 관광지', shareGps: '주변 관광지를 찾으려면 GPS 위치를 공유하세요.', visitSession: '방문 세션',
  visitSessionText: '공용 QR 코드로 이 페이지를 열 수 있습니다. 시작을 누르면 방문 세션이 기록됩니다. GPS 공유는 선택 사항입니다.',
  aiTitle: '다국어 AI 오디오 가이드', narrationLanguage: '가이드 언어', readingSpeed: '읽기 속도', aboutExperience: '체험 소개',
  qrModalTitle: '관광 QR 코드', qrModalText: '휴대전화 카메라로 스캔하여 공통 체험 페이지를 여세요.', languageList: '베트남어 · 영어 · 중국어 · 독일어 · 스페인어 · 프랑스어 · 러시아어 · 일본어 · 한국어',
}

Object.assign(translations.en, {
  gpsTitle: 'Find your location', gpsText: 'Allow GPS to determine your current location and open Google Maps.', gpsButton: 'Get current location',
  qrTitle: 'Place QR code', qrText: 'Scan this code with your phone camera to open the selected place information.', qrCommon: 'Scan to open the general visitor page',
  mapTitle: 'Explore the map', mapText: 'View the selected place or your current location on Google Maps.', openMaps: 'Open Google Maps',
  directions: 'Directions from your current location to the selected place', nearbyTitle: 'Places near you', shareGps: 'Share your GPS location to find nearby places.',
  visitSession: 'Visit session', visitSessionText: 'Open this page using the shared QR code. Press start to record a session; sharing GPS is optional.',
  aiTitle: 'Multilingual AI audio guide', narrationLanguage: 'Narration language', readingSpeed: 'Reading speed', aboutExperience: 'ABOUT THE EXPERIENCE',
  qrModalTitle: 'Visitor QR code', qrModalText: 'Scan with your phone camera to open the general visitor page.', languageList: 'Vietnamese · English · Chinese · German · Spanish · French · Russian · Japanese · Korean',
})
Object.assign(translations.zh, {
  gpsTitle: '获取您的位置', gpsText: '允许使用 GPS 以确定当前位置并打开 Google 地图。', gpsButton: '获取当前位置',
  qrTitle: '景点二维码', qrText: '使用手机相机扫描此码，打开当前所选景点的信息。', qrCommon: '扫描二维码以打开通用体验页面',
  mapTitle: '探索地图', mapText: '在 Google 地图中查看所选景点或当前位置。', openMaps: '打开 Google 地图',
  directions: '从当前位置前往所选景点的路线', nearbyTitle: '附近景点', shareGps: '分享 GPS 位置以查找附近景点。',
  visitSession: '参观记录', visitSessionText: '扫描通用二维码打开此页面。点击开始以记录参观会话；是否分享 GPS 位置由您决定。',
  aiTitle: '多语言 AI 语音讲解', narrationLanguage: '讲解语言', readingSpeed: '朗读速度', aboutExperience: '体验介绍',
  qrModalTitle: '参观二维码', qrModalText: '使用手机相机扫描二维码以打开通用体验页面。', languageList: '越南语 · 英语 · 中文 · 德语 · 西班牙语 · 法语 · 俄语 · 日语 · 韩语',
})



// Các nhãn còn thiếu được gom vào từ điển để tránh sót tiếng Việt khi đổi ngôn ngữ.
Object.assign(translations.vi, {
  gpsTitle: 'Định vị vị trí của bạn',
  gpsText: 'Cho phép GPS để xác định vị trí hiện tại và mở Google Maps.',
  gpsButton: 'Lấy vị trí hiện tại',
  heroSideExplore: 'KHÁM PHÁ', heroSideMultilingual: 'ĐA NGÔN NGỮ', heroFooterTagline: 'KHÁM PHÁ · TÌM HIỂU · TRẢI NGHIỆM', brandName: 'THUYẾT MINH', brandSubtitle: 'ĐA NGÔN NGỮ',
  toolsLabel: 'Công cụ tham quan', emptyMap: 'Chưa có địa điểm nào có tọa độ hợp lệ để hiển thị trên bản đồ.',
  nearbyDescription: 'Các địa điểm trong bán kính 4 km, được sắp xếp từ gần đến xa.', getLocation: 'Lấy vị trí hiện tại', noNearby: 'Chưa tìm thấy địa điểm nào trong bán kính 4 km có dữ liệu tọa độ hợp lệ.',
  distanceFromYou: 'Cách vị trí của bạn:', clearSearch: 'Xóa tìm kiếm', retryLoading: 'Đang tải...', apiHelp: 'Hãy kiểm tra API Gateway tại cổng 8080 và cấu hình proxy trong vite.config.js.',
  processing: 'Đang xử lý...', endVisit: 'Kết thúc trải nghiệm', startVisit: 'Bắt đầu trải nghiệm', detailArt: 'THUYẾT MINH ĐA NGÔN NGỮ',
  narrationLoading: 'Đang tạo thuyết minh...', createNarration: 'Tạo thuyết minh AI', audioLoading: 'Đang phát...', stopReading: 'Dừng đọc',
  narrationNote: 'Nội dung được tạo qua API AI; giọng đọc sử dụng tính năng đọc văn bản của trình duyệt và phụ thuộc vào các giọng đọc đã cài đặt.',
  gpsUnsupported: 'Trình duyệt này không hỗ trợ định vị GPS.', locating: 'Đang xác định vị trí...', currentLocation: 'Vị trí hiện tại:',
  gpsPermission: 'Bạn chưa cấp quyền vị trí. Hãy cho phép truy cập vị trí trong trình duyệt.', gpsUnavailable: 'Không xác định được vị trí. Hãy bật GPS và thử lại.',
  gpsTimeout: 'Định vị quá thời gian chờ. Vui lòng thử lại.', gpsFailed: 'Không thể lấy vị trí hiện tại.',
  sessionStarting: 'Đang ghi nhận lượt tham quan...', sessionRecorded: 'Đã ghi nhận lượt tham quan. Đang xác định vị trí nếu bạn cho phép...',
  sessionFailed: 'Chưa ghi nhận được lượt tham quan:', sessionUpdated: 'Đã ghi nhận lượt tham quan và cập nhật vị trí GPS.',
  sessionGpsFailed: 'Đã ghi nhận lượt tham quan nhưng chưa cập nhật được GPS:', sessionNoGpsSupport: 'Trình duyệt không hỗ trợ GPS. Lượt tham quan vẫn được ghi nhận ẩn danh.',
  sessionNoGpsSupportShort: 'Đã ghi nhận lượt tham quan. Trình duyệt không hỗ trợ GPS.', askingGps: 'Đang xin quyền xác định vị trí...',
  gpsConfirmed: 'Đã xác định vị trí:', gpsNotShared: 'Bạn chưa chia sẻ GPS. Lượt tham quan vẫn được ghi nhận, không lưu tọa độ.',
  sessionNotShared: 'Đã ghi nhận lượt tham quan. Bạn chưa chia sẻ vị trí GPS.', endingVisit: 'Đang kết thúc trải nghiệm...',
  visitEnded: 'Đã kết thúc trải nghiệm', visitEndFailed: 'Không thể kết thúc trải nghiệm:', noPlaceSelected: 'Vui lòng chọn một địa điểm trước.',
  invalidPlaceId: 'Mã địa điểm không hợp lệ. API cần trả về mã địa điểm dạng số.', unsupportedSpeech: 'Trình duyệt này không hỗ trợ đọc văn bản thành tiếng.',
  narrationCreateFailed: 'Không thể tạo thuyết minh', narrationInvalid: 'API không trả về nội dung thuyết minh hợp lệ.', narrationFailed: 'Đã xảy ra lỗi khi tạo thuyết minh.',
  speechFailed: 'Không thể phát thuyết minh. Hãy kiểm tra giọng đọc được cài đặt trong trình duyệt.', speechError: 'Đã xảy ra lỗi khi phát thuyết minh.',
  narrationLanguageAria: 'Ngôn ngữ thuyết minh', readingSpeedAria: 'Tốc độ đọc', addressLabel: 'Địa chỉ',
})
Object.assign(translations.en, {
  heroSideExplore: 'DISCOVER', heroSideMultilingual: 'MULTILINGUAL', heroFooterTagline: 'DISCOVER · LEARN · EXPERIENCE', brandName: 'AUDIO GUIDE', brandSubtitle: 'MULTILINGUAL', toolsLabel: 'Visitor tools',
  emptyMap: 'No places with valid coordinates are available to display on the map.', nearbyDescription: 'Places within 4 km, sorted from nearest to farthest.', getLocation: 'Get current location',
  noNearby: 'No places within 4 km have valid coordinate data.', distanceFromYou: 'Distance from you:', clearSearch: 'Clear search', retryLoading: 'Loading...',
  apiHelp: 'Check POI Service on port 5252 and the proxy configuration in vite.config.js.', processing: 'Processing...', endVisit: 'End visit', startVisit: 'Start visit', detailArt: 'MULTILINGUAL AUDIO GUIDE',
  narrationLoading: 'Generating narration...', createNarration: 'Generate AI narration', audioLoading: 'Playing...', stopReading: 'Stop reading',
  narrationNote: 'Content is generated through the AI API. Speech uses your browser’s text-to-speech feature and depends on the voices installed.',
  gpsUnsupported: 'This browser does not support GPS location.', locating: 'Finding your location...', currentLocation: 'Current location:',
  gpsPermission: 'Location permission was not granted. Allow location access in your browser.', gpsUnavailable: 'Could not determine your location. Turn on GPS and try again.',
  gpsTimeout: 'Location request timed out. Please try again.', gpsFailed: 'Could not get your current location.',
  sessionStarting: 'Recording your visit...', sessionRecorded: 'Your visit has been recorded. Checking your location if permission is granted...',
  sessionFailed: 'Could not record your visit:', sessionUpdated: 'Your visit and GPS location have been recorded.',
  sessionGpsFailed: 'Your visit was recorded, but GPS could not be updated:', sessionNoGpsSupport: 'This browser does not support GPS. Your visit is still recorded anonymously.',
  sessionNoGpsSupportShort: 'Your visit has been recorded. This browser does not support GPS.', askingGps: 'Requesting location permission...',
  gpsConfirmed: 'Location found:', gpsNotShared: 'You have not shared GPS. Your visit is recorded without storing coordinates.',
  sessionNotShared: 'Your visit has been recorded. You have not shared your GPS location.', endingVisit: 'Ending your visit...',
  visitEnded: 'Visit ended', visitEndFailed: 'Could not end the visit:', noPlaceSelected: 'Please select a place first.',
  invalidPlaceId: 'Invalid place ID. The API must return a numeric place ID.', unsupportedSpeech: 'This browser does not support text-to-speech.',
  narrationCreateFailed: 'Could not generate narration', narrationInvalid: 'The API did not return valid narration text.', narrationFailed: 'An error occurred while generating narration.',
  speechFailed: 'Could not play narration. Check the voices installed in your browser.', speechError: 'An error occurred while playing narration.',
  narrationLanguageAria: 'Narration language', readingSpeedAria: 'Reading speed', addressLabel: 'Address',
})
Object.assign(translations.zh, {
  heroSideExplore: '探索', heroSideMultilingual: '多语言', heroFooterTagline: '探索 · 学习 · 体验', brandName: '语音导览', brandSubtitle: '多语言', toolsLabel: '参观工具',
  emptyMap: '没有可在地图上显示的有效坐标景点。', nearbyDescription: '显示 4 公里范围内的景点，并按距离从近到远排序。', getLocation: '获取当前位置',
  noNearby: '4 公里范围内没有具有有效坐标数据的景点。', distanceFromYou: '距离您：', clearSearch: '清除搜索', retryLoading: '正在加载...',
  apiHelp: '请检查 5252 端口上的 POI Service 以及 vite.config.js 中的代理配置。', processing: '处理中...', endVisit: '结束参观', startVisit: '开始参观', detailArt: '多语言语音导览',
  narrationLoading: '正在生成讲解...', createNarration: '生成 AI 讲解', audioLoading: '正在播放...', stopReading: '停止朗读',
  narrationNote: '内容由 AI API 生成。语音使用浏览器的文本转语音功能，具体效果取决于已安装的语音。',
  gpsUnsupported: '此浏览器不支持 GPS 定位。', locating: '正在确定您的位置...', currentLocation: '当前位置：',
  gpsPermission: '您尚未授予位置权限。请在浏览器中允许访问位置。', gpsUnavailable: '无法确定位置。请开启 GPS 后重试。', gpsTimeout: '定位请求超时，请重试。', gpsFailed: '无法获取当前位置。',
  sessionStarting: '正在记录参观...', sessionRecorded: '参观记录已创建。如您允许，正在确定位置...', sessionFailed: '无法记录参观：',
  sessionUpdated: '已记录参观并更新 GPS 位置。', sessionGpsFailed: '已记录参观，但无法更新 GPS：', sessionNoGpsSupport: '此浏览器不支持 GPS。参观仍会以匿名方式记录。',
  sessionNoGpsSupportShort: '参观已记录。此浏览器不支持 GPS。', askingGps: '正在请求位置权限...', gpsConfirmed: '已确定位置：',
  gpsNotShared: '您尚未共享 GPS。参观仍会记录，但不会保存坐标。', sessionNotShared: '参观已记录。您尚未共享 GPS 位置。', endingVisit: '正在结束参观...',
  visitEnded: '参观已结束', visitEndFailed: '无法结束参观：', noPlaceSelected: '请先选择一个景点。', invalidPlaceId: '景点 ID 无效。API 必须返回数字 ID。',
  unsupportedSpeech: '此浏览器不支持文本转语音。', narrationCreateFailed: '无法生成讲解', narrationInvalid: 'API 未返回有效的讲解内容。', narrationFailed: '生成讲解时发生错误。',
  speechFailed: '无法播放讲解。请检查浏览器中已安装的语音。', speechError: '播放讲解时发生错误。', narrationLanguageAria: '讲解语言', readingSpeedAria: '朗读速度', addressLabel: '地址',
})
Object.assign(translations.ja, {
  heroSideExplore: '探索', heroSideMultilingual: '多言語', heroFooterTagline: '探索 · 学ぶ · 体験する', brandName: '音声ガイド', brandSubtitle: '多言語', toolsLabel: '観光ツール',
  emptyMap: '地図に表示できる有効な座標を持つスポットがありません。', nearbyDescription: '半径 4 km 以内のスポットを近い順に表示します。', getLocation: '現在地を取得',
  noNearby: '半径 4 km 以内に有効な座標データを持つスポットがありません。', distanceFromYou: '現在地からの距離：', clearSearch: '検索をクリア', retryLoading: '読み込み中...',
  apiHelp: 'ポート 5252 の POI Service と vite.config.js のプロキシ設定を確認してください。', processing: '処理中...', endVisit: '訪問を終了', startVisit: '訪問を開始', detailArt: '多言語音声ガイド',
  narrationLoading: '音声ガイドを生成中...', createNarration: 'AI ガイドを生成', audioLoading: '再生中...', stopReading: '読み上げを停止',
  narrationNote: '内容は AI API で生成されます。音声読み上げはブラウザーの機能を使用し、インストール済みの音声に依存します。',
  gpsUnsupported: 'このブラウザーは GPS 位置情報に対応していません。', locating: '現在地を確認中...', currentLocation: '現在地：',
  gpsPermission: '位置情報の許可がありません。ブラウザーで位置情報へのアクセスを許可してください。', gpsUnavailable: '位置情報を取得できません。GPS を有効にして再試行してください。',
  gpsTimeout: '位置情報の取得がタイムアウトしました。再試行してください。', gpsFailed: '現在地を取得できません。',
  sessionStarting: '訪問を記録中...', sessionRecorded: '訪問を記録しました。許可されている場合は位置情報を確認しています...', sessionFailed: '訪問を記録できませんでした：',
  sessionUpdated: '訪問と GPS 位置情報を記録しました。', sessionGpsFailed: '訪問は記録されましたが、GPS を更新できませんでした：', sessionNoGpsSupport: 'このブラウザーは GPS に対応していません。訪問は匿名で記録されます。',
  sessionNoGpsSupportShort: '訪問を記録しました。このブラウザーは GPS に対応していません。', askingGps: '位置情報の許可を確認中...', gpsConfirmed: '位置情報を確認しました：',
  gpsNotShared: 'GPS は共有されていません。訪問は記録されますが、座標は保存されません。', sessionNotShared: '訪問を記録しました。GPS 位置情報は共有されていません。', endingVisit: '訪問を終了中...',
  visitEnded: '訪問を終了しました', visitEndFailed: '訪問を終了できません：', noPlaceSelected: '先にスポットを選択してください。', invalidPlaceId: 'スポット ID が無効です。API は数値 ID を返す必要があります。',
  unsupportedSpeech: 'このブラウザーは音声読み上げに対応していません。', narrationCreateFailed: '音声ガイドを生成できません', narrationInvalid: 'API から有効なガイド内容が返されませんでした。', narrationFailed: '音声ガイドの生成中にエラーが発生しました。',
  speechFailed: '音声ガイドを再生できません。ブラウザーにインストールされた音声を確認してください。', speechError: '音声ガイドの再生中にエラーが発生しました。', narrationLanguageAria: 'ガイドの言語', readingSpeedAria: '読み上げ速度', addressLabel: '住所',
})
Object.assign(translations.ko, {
  heroSideExplore: '탐색', heroSideMultilingual: '다국어', heroFooterTagline: '탐색 · 학습 · 체험', brandName: '오디오 가이드', brandSubtitle: '다국어', toolsLabel: '관광 도구',
  emptyMap: '지도에 표시할 수 있는 유효한 좌표를 가진 관광지가 없습니다.', nearbyDescription: '반경 4km 이내 관광지를 가까운 순서로 표시합니다.', getLocation: '현재 위치 가져오기',
  noNearby: '반경 4km 이내에 유효한 좌표 데이터가 있는 관광지가 없습니다.', distanceFromYou: '현재 위치와의 거리:', clearSearch: '검색 지우기', retryLoading: '불러오는 중...',
  apiHelp: '5252 포트의 POI Service와 vite.config.js의 프록시 설정을 확인하세요.', processing: '처리 중...', endVisit: '방문 종료', startVisit: '방문 시작', detailArt: '다국어 오디오 가이드',
  narrationLoading: '안내 생성 중...', createNarration: 'AI 안내 생성', audioLoading: '재생 중...', stopReading: '읽기 중지',
  narrationNote: '콘텐츠는 AI API로 생성됩니다. 음성은 브라우저의 텍스트 음성 변환 기능을 사용하며 설치된 음성에 따라 달라집니다.',
  gpsUnsupported: '이 브라우저는 GPS 위치 기능을 지원하지 않습니다.', locating: '현재 위치 확인 중...', currentLocation: '현재 위치:',
  gpsPermission: '위치 권한이 없습니다. 브라우저에서 위치 접근을 허용하세요.', gpsUnavailable: '위치를 확인할 수 없습니다. GPS를 켜고 다시 시도하세요.', gpsTimeout: '위치 요청 시간이 초과되었습니다. 다시 시도하세요.', gpsFailed: '현재 위치를 가져올 수 없습니다.',
  sessionStarting: '방문 기록 중...', sessionRecorded: '방문이 기록되었습니다. 허용된 경우 위치를 확인합니다...', sessionFailed: '방문을 기록할 수 없습니다:',
  sessionUpdated: '방문 및 GPS 위치가 기록되었습니다.', sessionGpsFailed: '방문은 기록되었지만 GPS를 업데이트할 수 없습니다:', sessionNoGpsSupport: '이 브라우저는 GPS를 지원하지 않습니다. 방문은 익명으로 기록됩니다.',
  sessionNoGpsSupportShort: '방문이 기록되었습니다. 이 브라우저는 GPS를 지원하지 않습니다.', askingGps: '위치 권한 요청 중...', gpsConfirmed: '위치 확인됨:',
  gpsNotShared: 'GPS를 공유하지 않았습니다. 방문은 기록되지만 좌표는 저장되지 않습니다.', sessionNotShared: '방문이 기록되었습니다. GPS 위치를 공유하지 않았습니다.', endingVisit: '방문 종료 중...',
  visitEnded: '방문이 종료되었습니다', visitEndFailed: '방문을 종료할 수 없습니다:', noPlaceSelected: '먼저 관광지를 선택하세요.', invalidPlaceId: '관광지 ID가 올바르지 않습니다. API는 숫자 ID를 반환해야 합니다.',
  unsupportedSpeech: '이 브라우저는 텍스트 음성 변환을 지원하지 않습니다.', narrationCreateFailed: '안내를 생성할 수 없습니다', narrationInvalid: 'API에서 올바른 안내 내용을 반환하지 않았습니다.', narrationFailed: '안내 생성 중 오류가 발생했습니다.',
  speechFailed: '안내를 재생할 수 없습니다. 브라우저에 설치된 음성을 확인하세요.', speechError: '안내 재생 중 오류가 발생했습니다.', narrationLanguageAria: '안내 언어', readingSpeedAria: '읽기 속도', addressLabel: '주소',
})


// Bốn bộ dịch giao diện bổ sung. Mỗi khóa được khai báo trực tiếp để tránh
// âm thầm dùng tiếng Anh khi người dùng chọn ngôn ngữ khác.
const EXTRA_UI_TRANSLATIONS = {
  de: {
    top:'MEHRSPRACHIGER AUDIOGUIDE · ORTE ENTDECKEN',navPlaces:'Sehenswürdigkeiten',navGuide:'Audioguide',navAbout:'Über uns',access:'Zugangscode',eyebrow:'DIGITALES KULTURERBE',heroTitle:'Entdecken Sie Reiseziele in Ihrem eigenen Tempo',heroText:'Finden Sie Sehenswürdigkeiten, erkunden Sie die Karte und erhalten Sie Besucherinformationen auf Ihrem Smartphone in Ihrer bevorzugten Sprache.',explore:'Orte entdecken',learn:'Mehr erfahren',heroNote:'Mehrsprachige Oberfläche · Ortsinformationen · Digitales Erlebnis',journey:'IHRE REISE',placesTitle:'Sehenswürdigkeiten',placesDesc:'Orte aus der Systemdatenquelle.',search:'Orte suchen...',loading:'Sehenswürdigkeiten werden geladen...',empty:'Keine passenden Orte gefunden.',error:'Ortsdaten konnten nicht geladen werden.',retry:'Erneut versuchen',total:'Orte',detail:'Details ansehen',detailTitle:'Ortsinformationen',choose:'Wählen Sie einen Ort aus, um Informationen anzuzeigen.',guide:'ENTDECKEN',guideTitle:'Jeder Ort erzählt eine Geschichte',guideText:'Wählen Sie einen Ort aus der Liste, um die vom System bereitgestellten Informationen anzuzeigen.',aboutTitle:'Ein komfortableres Besuchserlebnis',aboutText:'Der mehrsprachige Audioguide hilft Besuchern, Orte zu finden, ihren Standort zu bestimmen und Besucherinformationen bequem abzurufen.',feature1:'Zentrale Informationen',feature1Text:'Orte aus der Systemdatenquelle abrufen.',feature2:'Mehrsprachige Oberfläche',feature2Text:'Die Anzeigesprache wechseln.',feature3:'Flexibles Design',feature3Text:'Für Computer, Tablets und Smartphones.',language:'Oberflächensprache',footer:'Digitale Besucherplattform',footerNote:'Ortsdaten werden vom POI Service bereitgestellt.',accessTitle:'Besucher-Zugangscode',accessText:'Die Codeprüfung muss mit der Authentifizierungs-API verbunden werden.',accessLabel:'Zugangscode',accessPlaceholder:'Zugangscode eingeben',close:'Schließen',selected:'Ausgewählter Ort',noDescription:'Für diesen Ort ist keine Beschreibung verfügbar.',noImage:'ORTSBILD',listenGuide:'Audioguide anhören',audioUnsupported:'Die Sprachausgabe für diese Sprache wird noch nicht unterstützt. Sie können weiterhin den Führungstext erstellen und lesen.',id:'Orts-ID',category:'Kategorie',status:'Datenstatus',connected:'API verbunden',disconnected:'Daten nicht verfügbar',gpsTitle:'Eigenen Standort finden',gpsText:'Erlauben Sie GPS, um Ihren aktuellen Standort zu bestimmen und Google Maps zu öffnen.',gpsButton:'Aktuellen Standort abrufen',qrTitle:'QR-Code des Ortes',qrText:'Scannen Sie diesen Code mit Ihrer Handykamera, um die Informationen des ausgewählten Ortes zu öffnen.',qrCommon:'Scannen, um die allgemeine Besucherseite zu öffnen',mapTitle:'Karte erkunden',mapText:'Zeigen Sie den ausgewählten Ort oder Ihren aktuellen Standort in Google Maps an.',openMaps:'Google Maps öffnen',directions:'Route von Ihrem Standort zum ausgewählten Ort',nearbyTitle:'Orte in Ihrer Nähe',shareGps:'Teilen Sie Ihren GPS-Standort, um Orte in der Nähe zu finden.',visitSession:'Besuchssitzung',visitSessionText:'Öffnen Sie diese Seite über den gemeinsamen QR-Code. Starten Sie die Sitzung, um den Besuch zu erfassen. Die GPS-Freigabe ist optional.',aiTitle:'Mehrsprachiger KI-Audioguide',narrationLanguage:'Sprache des Audioguides',readingSpeed:'Lesegeschwindigkeit',aboutExperience:'ÜBER DIESES ERLEBNIS',qrModalTitle:'Besucher-QR-Code',qrModalText:'Scannen Sie den Code mit Ihrer Handykamera, um die allgemeine Besucherseite zu öffnen.',languageList:'Vietnamesisch · Englisch · Chinesisch · Deutsch · Spanisch · Französisch · Russisch',heroSideExplore:'ENTDECKEN',heroSideMultilingual:'MEHRSPRACHIG',heroFooterTagline:'ENTDECKEN · LERNEN · ERLEBEN',brandName:'AUDIOGUIDE',brandSubtitle:'MEHRSPRACHIG',toolsLabel:'Besuchertools',emptyMap:'Keine Orte mit gültigen Koordinaten für die Karte verfügbar.',nearbyDescription:'Orte im Umkreis von 4 km, sortiert nach Entfernung.',getLocation:'Aktuellen Standort abrufen',noNearby:'Im Umkreis von 4 km wurden keine Orte mit gültigen Koordinaten gefunden.',distanceFromYou:'Entfernung von Ihnen:',clearSearch:'Suche löschen',retryLoading:'Wird geladen...',apiHelp:'Prüfen Sie den POI Service und die Proxy-Konfiguration in vite.config.js.',processing:'Wird verarbeitet...',endVisit:'Besuch beenden',startVisit:'Besuch starten',detailArt:'MEHRSPRACHIGER AUDIOGUIDE',narrationLoading:'Audioguide wird erstellt...',createNarration:'KI-Audioguide erstellen',audioLoading:'Wird abgespielt...',stopReading:'Wiedergabe stoppen',narrationNote:'Der Text wird über die KI-API erstellt. Die Sprachausgabe verwendet die Text-zu-Sprache-Funktion des Browsers und hängt von den installierten Stimmen ab.',gpsUnsupported:'Dieser Browser unterstützt keine GPS-Ortung.',locating:'Standort wird ermittelt...',currentLocation:'Aktueller Standort:',gpsPermission:'Sie haben den Standortzugriff nicht erlaubt. Erlauben Sie den Zugriff in Ihrem Browser.',gpsUnavailable:'Standort nicht verfügbar. Aktivieren Sie GPS und versuchen Sie es erneut.',gpsTimeout:'Zeitüberschreitung bei der Standortbestimmung. Bitte versuchen Sie es erneut.',gpsFailed:'Der aktuelle Standort konnte nicht abgerufen werden.',sessionStarting:'Besuch wird erfasst...',sessionRecorded:'Ihr Besuch wurde erfasst. Der Standort wird ermittelt, sofern Sie dies erlauben...',sessionFailed:'Besuch konnte nicht erfasst werden:',sessionUpdated:'Besuch und GPS-Standort wurden erfasst.',sessionGpsFailed:'Besuch erfasst, GPS konnte jedoch nicht aktualisiert werden:',sessionNoGpsSupport:'Dieser Browser unterstützt kein GPS. Ihr Besuch wird weiterhin anonym erfasst.',sessionNoGpsSupportShort:'Besuch erfasst. Dieser Browser unterstützt kein GPS.',askingGps:'Standortberechtigung wird angefragt...',gpsConfirmed:'Standort ermittelt:',gpsNotShared:'Sie haben GPS nicht freigegeben. Der Besuch wird ohne Koordinaten erfasst.',sessionNotShared:'Besuch erfasst. Sie haben Ihren GPS-Standort nicht freigegeben.',endingVisit:'Besuch wird beendet...',visitEnded:'Besuch beendet',visitEndFailed:'Besuch konnte nicht beendet werden:',noPlaceSelected:'Bitte wählen Sie zuerst einen Ort aus.',invalidPlaceId:'Ungültige Orts-ID. Die API muss eine numerische Orts-ID zurückgeben.',unsupportedSpeech:'Dieser Browser unterstützt keine Sprachausgabe.',narrationCreateFailed:'Audioguide konnte nicht erstellt werden',narrationInvalid:'Die API hat keinen gültigen Audioguide-Text zurückgegeben.',narrationFailed:'Beim Erstellen des Audioguides ist ein Fehler aufgetreten.',speechFailed:'Audioguide konnte nicht abgespielt werden. Prüfen Sie die im Browser installierten Stimmen.',speechError:'Bei der Audiowiedergabe ist ein Fehler aufgetreten.',narrationLanguageAria:'Sprache des Audioguides',readingSpeedAria:'Lesegeschwindigkeit',addressLabel:'Adresse'
  },
  es: {
    top:'GUÍA DE AUDIO MULTILINGÜE · DESCUBRE LUGARES',navPlaces:'Lugares de interés',navGuide:'Guía',navAbout:'Acerca de',access:'Código de acceso',eyebrow:'EXPERIENCIA DE PATRIMONIO DIGITAL',heroTitle:'Descubre destinos a tu propio ritmo',heroText:'Busca lugares, explora el mapa y consulta información para visitantes en el idioma que prefieras desde tu teléfono.',explore:'Explorar lugares',learn:'Más información',heroNote:'Interfaz multilingüe · Información de lugares · Experiencia digital',journey:'TU VIAJE',placesTitle:'Lugares de interés',placesDesc:'Lugares cargados desde los datos del sistema.',search:'Buscar lugares...',loading:'Cargando lugares...',empty:'No se encontraron lugares coincidentes.',error:'No se pudieron cargar los datos de los lugares.',retry:'Intentar de nuevo',total:'lugares',detail:'Ver detalles',detailTitle:'Información del lugar',choose:'Selecciona un lugar para ver su información.',guide:'DESCUBRIR',guideTitle:'Cada lugar tiene una historia',guideText:'Selecciona un lugar de la lista para ver la información proporcionada por el sistema.',aboutTitle:'Una experiencia de visita más cómoda',aboutText:'La guía multilingüe ayuda a los visitantes a encontrar lugares, localizarse y consultar información turística fácilmente.',feature1:'Información centralizada',feature1Text:'Consulta lugares desde los datos del sistema.',feature2:'Interfaz multilingüe',feature2Text:'Cambia el idioma de visualización.',feature3:'Diseño adaptable',feature3Text:'Diseñado para ordenadores, tabletas y móviles.',language:'Idioma de la interfaz',footer:'Plataforma digital de guía turística',footerNote:'Los datos de los lugares proceden de POI Service.',accessTitle:'Código de acceso para visitantes',accessText:'La validación del código debe conectarse con la API de autenticación del sistema.',accessLabel:'Código de acceso',accessPlaceholder:'Introduce el código de acceso',close:'Cerrar',selected:'Lugar seleccionado',noDescription:'No hay descripción disponible para este lugar.',noImage:'IMAGEN DEL LUGAR',listenGuide:'Escuchar la guía',audioUnsupported:'La reproducción de voz para este idioma aún no está disponible. Puedes generar y leer el texto de la guía.',id:'ID del lugar',category:'Categoría',status:'Estado de los datos',connected:'API conectada',disconnected:'Datos no disponibles',gpsTitle:'Encontrar tu ubicación',gpsText:'Permite el GPS para determinar tu ubicación actual y abrir Google Maps.',gpsButton:'Obtener ubicación actual',qrTitle:'Código QR del lugar',qrText:'Escanea este código con la cámara del teléfono para abrir la información del lugar seleccionado.',qrCommon:'Escanea para abrir la página general para visitantes',mapTitle:'Explorar el mapa',mapText:'Consulta el lugar seleccionado o tu ubicación actual en Google Maps.',openMaps:'Abrir Google Maps',directions:'Cómo llegar desde tu ubicación al lugar seleccionado',nearbyTitle:'Lugares cercanos',shareGps:'Comparte tu ubicación GPS para encontrar lugares cercanos.',visitSession:'Sesión de visita',visitSessionText:'Abre esta página con el código QR compartido. Inicia la sesión para registrar la visita. Compartir el GPS es opcional.',aiTitle:'Guía de audio con IA multilingüe',narrationLanguage:'Idioma de la narración',readingSpeed:'Velocidad de lectura',aboutExperience:'SOBRE ESTA EXPERIENCIA',qrModalTitle:'Código QR para visitantes',qrModalText:'Escanea con la cámara del teléfono para abrir la página general para visitantes.',languageList:'Vietnamita · Inglés · Chino · Alemán · Español · Francés · Ruso',heroSideExplore:'DESCUBRIR',heroSideMultilingual:'MULTILINGÜE',heroFooterTagline:'DESCUBRIR · APRENDER · VIVIR',brandName:'GUÍA DE AUDIO',brandSubtitle:'MULTILINGÜE',toolsLabel:'Herramientas para visitantes',emptyMap:'No hay lugares con coordenadas válidas para mostrar en el mapa.',nearbyDescription:'Lugares en un radio de 4 km, ordenados de menor a mayor distancia.',getLocation:'Obtener ubicación actual',noNearby:'No se encontraron lugares con coordenadas válidas en un radio de 4 km.',distanceFromYou:'Distancia desde tu ubicación:',clearSearch:'Borrar búsqueda',retryLoading:'Cargando...',apiHelp:'Comprueba POI Service y la configuración del proxy en vite.config.js.',processing:'Procesando...',endVisit:'Finalizar visita',startVisit:'Iniciar visita',detailArt:'GUÍA DE AUDIO MULTILINGÜE',narrationLoading:'Generando la narración...',createNarration:'Generar guía con IA',audioLoading:'Reproduciendo...',stopReading:'Detener lectura',narrationNote:'El contenido se genera mediante la API de IA. La voz utiliza la función de texto a voz del navegador y depende de las voces instaladas.',gpsUnsupported:'Este navegador no admite la ubicación GPS.',locating:'Buscando tu ubicación...',currentLocation:'Ubicación actual:',gpsPermission:'No has concedido permiso de ubicación. Permite el acceso en el navegador.',gpsUnavailable:'No se pudo determinar tu ubicación. Activa el GPS e inténtalo de nuevo.',gpsTimeout:'Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo.',gpsFailed:'No se pudo obtener tu ubicación actual.',sessionStarting:'Registrando tu visita...',sessionRecorded:'Tu visita se ha registrado. Se comprobará tu ubicación si lo permites...',sessionFailed:'No se pudo registrar la visita:',sessionUpdated:'Se han registrado la visita y la ubicación GPS.',sessionGpsFailed:'La visita se registró, pero no se pudo actualizar el GPS:',sessionNoGpsSupport:'Este navegador no admite GPS. La visita se registrará de forma anónima.',sessionNoGpsSupportShort:'Visita registrada. Este navegador no admite GPS.',askingGps:'Solicitando permiso de ubicación...',gpsConfirmed:'Ubicación encontrada:',gpsNotShared:'No has compartido el GPS. La visita se registra sin guardar coordenadas.',sessionNotShared:'Visita registrada. No has compartido tu ubicación GPS.',endingVisit:'Finalizando la visita...',visitEnded:'Visita finalizada',visitEndFailed:'No se pudo finalizar la visita:',noPlaceSelected:'Selecciona primero un lugar.',invalidPlaceId:'ID de lugar no válido. La API debe devolver un ID numérico.',unsupportedSpeech:'Este navegador no admite la conversión de texto a voz.',narrationCreateFailed:'No se pudo generar la narración',narrationInvalid:'La API no devolvió un texto de narración válido.',narrationFailed:'Se produjo un error al generar la narración.',speechFailed:'No se pudo reproducir la narración. Comprueba las voces instaladas en el navegador.',speechError:'Se produjo un error durante la reproducción.',narrationLanguageAria:'Idioma de la narración',readingSpeedAria:'Velocidad de lectura',addressLabel:'Dirección'
  },
  fr: {
    top:'GUIDE AUDIO MULTILINGUE · DÉCOUVRIR LES LIEUX',navPlaces:'Lieux à visiter',navGuide:'Guide',navAbout:'À propos',access:'Code d’accès',eyebrow:'EXPÉRIENCE DU PATRIMOINE NUMÉRIQUE',heroTitle:'Découvrez les destinations à votre rythme',heroText:'Recherchez des lieux, explorez la carte et consultez les informations pratiques dans la langue de votre choix, directement sur votre téléphone.',explore:'Explorer les lieux',learn:'En savoir plus',heroNote:'Interface multilingue · Informations sur les lieux · Expérience numérique',journey:'VOTRE PARCOURS',placesTitle:'Lieux à visiter',placesDesc:'Lieux chargés depuis les données du système.',search:'Rechercher un lieu...',loading:'Chargement des lieux...',empty:'Aucun lieu correspondant trouvé.',error:'Impossible de charger les données des lieux.',retry:'Réessayer',total:'lieux',detail:'Voir les détails',detailTitle:'Informations sur le lieu',choose:'Sélectionnez un lieu pour afficher ses informations.',guide:'DÉCOUVRIR',guideTitle:'Chaque lieu a son histoire',guideText:'Sélectionnez un lieu dans la liste pour consulter les informations fournies par le système.',aboutTitle:'Une visite plus pratique',aboutText:'Le guide multilingue aide les visiteurs à trouver des lieux, à se localiser et à accéder facilement aux informations touristiques.',feature1:'Informations centralisées',feature1Text:'Consultez les lieux depuis les données du système.',feature2:'Interface multilingue',feature2Text:'Changez la langue d’affichage.',feature3:'Design adaptatif',feature3Text:'Conçu pour les ordinateurs, tablettes et téléphones.',language:'Langue de l’interface',footer:'Plateforme de guide touristique numérique',footerNote:'Les données des lieux sont fournies par POI Service.',accessTitle:'Code d’accès visiteur',accessText:'La validation du code doit être reliée à l’API d’authentification du système.',accessLabel:'Code d’accès',accessPlaceholder:'Saisissez le code d’accès',close:'Fermer',selected:'Lieu sélectionné',noDescription:'Aucune description disponible pour ce lieu.',noImage:'IMAGE DU LIEU',listenGuide:'Écouter le guide',audioUnsupported:'La lecture vocale dans cette langue n’est pas encore prise en charge. Vous pouvez toujours générer et lire le texte du guide.',id:'Identifiant du lieu',category:'Catégorie',status:'État des données',connected:'API connectée',disconnected:'Données indisponibles',gpsTitle:'Trouver votre position',gpsText:'Autorisez le GPS pour déterminer votre position actuelle et ouvrir Google Maps.',gpsButton:'Obtenir ma position',qrTitle:'Code QR du lieu',qrText:'Scannez ce code avec l’appareil photo de votre téléphone pour ouvrir les informations du lieu sélectionné.',qrCommon:'Scannez pour ouvrir la page générale des visiteurs',mapTitle:'Explorer la carte',mapText:'Afficher le lieu sélectionné ou votre position actuelle dans Google Maps.',openMaps:'Ouvrir Google Maps',directions:'Itinéraire depuis votre position jusqu’au lieu sélectionné',nearbyTitle:'Lieux à proximité',shareGps:'Partagez votre position GPS pour trouver les lieux à proximité.',visitSession:'Session de visite',visitSessionText:'Ouvrez cette page avec le QR code partagé. Démarrez la session pour enregistrer la visite. Le partage GPS est facultatif.',aiTitle:'Guide audio IA multilingue',narrationLanguage:'Langue du commentaire',readingSpeed:'Vitesse de lecture',aboutExperience:'À PROPOS DE CETTE EXPÉRIENCE',qrModalTitle:'QR code visiteur',qrModalText:'Scannez avec l’appareil photo de votre téléphone pour ouvrir la page générale des visiteurs.',languageList:'Vietnamien · Anglais · Chinois · Allemand · Espagnol · Français · Russe',heroSideExplore:'DÉCOUVRIR',heroSideMultilingual:'MULTILINGUE',heroFooterTagline:'DÉCOUVRIR · APPRENDRE · VIVRE',brandName:'GUIDE AUDIO',brandSubtitle:'MULTILINGUE',toolsLabel:'Outils de visite',emptyMap:'Aucun lieu avec des coordonnées valides à afficher sur la carte.',nearbyDescription:'Lieux dans un rayon de 4 km, triés du plus proche au plus éloigné.',getLocation:'Obtenir ma position',noNearby:'Aucun lieu avec des coordonnées valides trouvé dans un rayon de 4 km.',distanceFromYou:'Distance depuis votre position :',clearSearch:'Effacer la recherche',retryLoading:'Chargement...',apiHelp:'Vérifiez POI Service et la configuration du proxy dans vite.config.js.',processing:'Traitement...',endVisit:'Terminer la visite',startVisit:'Commencer la visite',detailArt:'GUIDE AUDIO MULTILINGUE',narrationLoading:'Génération du commentaire...',createNarration:'Générer le guide IA',audioLoading:'Lecture en cours...',stopReading:'Arrêter la lecture',narrationNote:'Le contenu est généré par l’API IA. La voix utilise la synthèse vocale du navigateur et dépend des voix installées.',gpsUnsupported:'Ce navigateur ne prend pas en charge la géolocalisation GPS.',locating:'Localisation en cours...',currentLocation:'Position actuelle :',gpsPermission:'Vous n’avez pas autorisé la localisation. Autorisez l’accès dans votre navigateur.',gpsUnavailable:'Position introuvable. Activez le GPS et réessayez.',gpsTimeout:'La demande de localisation a expiré. Veuillez réessayer.',gpsFailed:'Impossible d’obtenir votre position actuelle.',sessionStarting:'Enregistrement de votre visite...',sessionRecorded:'Votre visite a été enregistrée. Recherche de votre position si vous l’autorisez...',sessionFailed:'Impossible d’enregistrer la visite :',sessionUpdated:'Votre visite et votre position GPS ont été enregistrées.',sessionGpsFailed:'Visite enregistrée, mais la position GPS n’a pas pu être mise à jour :',sessionNoGpsSupport:'Ce navigateur ne prend pas en charge le GPS. Votre visite est enregistrée anonymement.',sessionNoGpsSupportShort:'Visite enregistrée. Ce navigateur ne prend pas en charge le GPS.',askingGps:'Demande d’autorisation de localisation...',gpsConfirmed:'Position trouvée :',gpsNotShared:'Vous n’avez pas partagé votre GPS. La visite est enregistrée sans coordonnées.',sessionNotShared:'Visite enregistrée. Vous n’avez pas partagé votre position GPS.',endingVisit:'Fin de la visite...',visitEnded:'Visite terminée',visitEndFailed:'Impossible de terminer la visite :',noPlaceSelected:'Veuillez d’abord sélectionner un lieu.',invalidPlaceId:'Identifiant de lieu invalide. L’API doit renvoyer un identifiant numérique.',unsupportedSpeech:'Ce navigateur ne prend pas en charge la synthèse vocale.',narrationCreateFailed:'Impossible de générer le commentaire',narrationInvalid:'L’API n’a pas renvoyé de texte de commentaire valide.',narrationFailed:'Une erreur est survenue lors de la génération du commentaire.',speechFailed:'Impossible de lire le commentaire. Vérifiez les voix installées dans le navigateur.',speechError:'Une erreur est survenue pendant la lecture.',narrationLanguageAria:'Langue du commentaire',readingSpeedAria:'Vitesse de lecture',addressLabel:'Adresse'
  },
  ru: {
    top:'МНОГОЯЗЫЧНЫЙ АУДИОГИД · ОТКРЫВАЙТЕ НОВЫЕ МЕСТА',navPlaces:'Достопримечательности',navGuide:'Аудиогид',navAbout:'О проекте',access:'Код доступа',eyebrow:'ЦИФРОВОЕ КУЛЬТУРНОЕ НАСЛЕДИЕ',heroTitle:'Открывайте новые места в своём темпе',heroText:'Ищите достопримечательности, изучайте карту и получайте информацию для посетителей на выбранном языке прямо на телефоне.',explore:'Посмотреть места',learn:'Подробнее',heroNote:'Многоязычный интерфейс · Информация о местах · Цифровой формат',journey:'ВАШЕ ПУТЕШЕСТВИЕ',placesTitle:'Достопримечательности',placesDesc:'Список мест загружен из системных данных.',search:'Поиск мест...',loading:'Загрузка мест...',empty:'Подходящие места не найдены.',error:'Не удалось загрузить данные о местах.',retry:'Повторить',total:'мест',detail:'Подробнее',detailTitle:'Информация о месте',choose:'Выберите место, чтобы посмотреть информацию.',guide:'ОТКРЫВАЙТЕ',guideTitle:'У каждого места своя история',guideText:'Выберите место из списка, чтобы увидеть информацию, предоставленную системой.',aboutTitle:'Более удобное посещение',aboutText:'Многоязычный гид помогает находить места, определять своё местоположение и удобно получать туристическую информацию.',feature1:'Вся информация в одном месте',feature1Text:'Просматривайте места из системной базы данных.',feature2:'Многоязычный интерфейс',feature2Text:'Меняйте язык отображения.',feature3:'Адаптивный дизайн',feature3Text:'Для компьютеров, планшетов и смартфонов.',language:'Язык интерфейса',footer:'Цифровая платформа туристического гида',footerNote:'Данные о местах предоставляет POI Service.',accessTitle:'Код доступа посетителя',accessText:'Проверка кода должна быть подключена к API аутентификации системы.',accessLabel:'Код доступа',accessPlaceholder:'Введите код доступа',close:'Закрыть',selected:'Выбранное место',noDescription:'Описание этого места отсутствует.',noImage:'ФОТО МЕСТА',listenGuide:'Слушать аудиогид',audioUnsupported:'Озвучивание на этом языке пока не поддерживается. Вы по-прежнему можете создать и прочитать текст экскурсии.',id:'Идентификатор места',category:'Категория',status:'Состояние данных',connected:'API подключён',disconnected:'Данные недоступны',gpsTitle:'Определить ваше местоположение',gpsText:'Разрешите GPS, чтобы определить ваше местоположение и открыть Google Maps.',gpsButton:'Получить текущее местоположение',qrTitle:'QR-код места',qrText:'Отсканируйте этот код камерой телефона, чтобы открыть информацию о выбранном месте.',qrCommon:'Отсканируйте, чтобы открыть общую страницу для посетителей',mapTitle:'Изучить карту',mapText:'Посмотрите выбранное место или своё текущее местоположение в Google Maps.',openMaps:'Открыть Google Maps',directions:'Маршрут от вашего местоположения до выбранного места',nearbyTitle:'Места поблизости',shareGps:'Поделитесь местоположением GPS, чтобы найти места поблизости.',visitSession:'Сеанс посещения',visitSessionText:'Откройте эту страницу с помощью общего QR-кода. Начните сеанс, чтобы записать посещение. Передача GPS необязательна.',aiTitle:'Многоязычный аудиогид с ИИ',narrationLanguage:'Язык экскурсии',readingSpeed:'Скорость чтения',aboutExperience:'ОБ ЭТОМ ПРОЕКТЕ',qrModalTitle:'QR-код посетителя',qrModalText:'Отсканируйте код камерой телефона, чтобы открыть общую страницу для посетителей.',languageList:'Вьетнамский · Английский · Китайский · Немецкий · Испанский · Французский · Русский',heroSideExplore:'ОТКРЫВАТЬ',heroSideMultilingual:'МНОГОЯЗЫЧНЫЙ',heroFooterTagline:'ОТКРЫВАТЬ · УЗНАВАТЬ · ПОЗНАВАТЬ',brandName:'АУДИОГИД',brandSubtitle:'МНОГОЯЗЫЧНЫЙ',toolsLabel:'Инструменты посетителя',emptyMap:'Нет мест с корректными координатами для отображения на карте.',nearbyDescription:'Места в радиусе 4 км, отсортированные от ближайшего к дальнему.',getLocation:'Получить текущее местоположение',noNearby:'В радиусе 4 км не найдено мест с корректными координатами.',distanceFromYou:'Расстояние от вас:',clearSearch:'Очистить поиск',retryLoading:'Загрузка...',apiHelp:'Проверьте POI Service и настройки прокси в vite.config.js.',processing:'Обработка...',endVisit:'Завершить посещение',startVisit:'Начать посещение',detailArt:'МНОГОЯЗЫЧНЫЙ АУДИОГИД',narrationLoading:'Создание экскурсии...',createNarration:'Создать экскурсию с ИИ',audioLoading:'Воспроизведение...',stopReading:'Остановить чтение',narrationNote:'Текст создаётся через AI API. Озвучивание выполняется средствами браузера и зависит от установленных голосов.',gpsUnsupported:'Этот браузер не поддерживает определение местоположения GPS.',locating:'Определение местоположения...',currentLocation:'Текущее местоположение:',gpsPermission:'Вы не разрешили доступ к местоположению. Разрешите его в браузере.',gpsUnavailable:'Не удалось определить местоположение. Включите GPS и попробуйте снова.',gpsTimeout:'Время ожидания определения местоположения истекло. Повторите попытку.',gpsFailed:'Не удалось получить ваше текущее местоположение.',sessionStarting:'Запись посещения...',sessionRecorded:'Посещение записано. Местоположение будет определено, если вы разрешите доступ...',sessionFailed:'Не удалось записать посещение:',sessionUpdated:'Посещение и координаты GPS записаны.',sessionGpsFailed:'Посещение записано, но не удалось обновить GPS:',sessionNoGpsSupport:'Этот браузер не поддерживает GPS. Посещение всё равно будет записано анонимно.',sessionNoGpsSupportShort:'Посещение записано. Этот браузер не поддерживает GPS.',askingGps:'Запрос разрешения на доступ к местоположению...',gpsConfirmed:'Местоположение определено:',gpsNotShared:'Вы не передали данные GPS. Посещение записывается без сохранения координат.',sessionNotShared:'Посещение записано. Вы не поделились местоположением GPS.',endingVisit:'Завершение посещения...',visitEnded:'Посещение завершено',visitEndFailed:'Не удалось завершить посещение:',noPlaceSelected:'Сначала выберите место.',invalidPlaceId:'Недопустимый ID места. API должен возвращать числовой идентификатор.',unsupportedSpeech:'Этот браузер не поддерживает синтез речи.',narrationCreateFailed:'Не удалось создать экскурсию',narrationInvalid:'API не вернул корректный текст экскурсии.',narrationFailed:'При создании экскурсии произошла ошибка.',speechFailed:'Не удалось воспроизвести экскурсию. Проверьте установленные голоса браузера.',speechError:'Во время воспроизведения произошла ошибка.',narrationLanguageAria:'Язык экскурсии',readingSpeedAria:'Скорость чтения',addressLabel:'Адрес'
  }
}
Object.assign(translations, EXTRA_UI_TRANSLATIONS)

// Dịch tên/mô tả các địa điểm đã biết chỉ ở lớp hiển thị; dữ liệu API gốc không bị thay đổi.
const POI_DISPLAY_TRANSLATIONS = {
  en: {
    'Dinh Độc Lập': 'Independence Palace', 'Nhà thờ Đức Bà': 'Notre-Dame Cathedral Basilica of Saigon',
    'Bưu điện Trung tâm Sài Gòn': 'Saigon Central Post Office', 'Chợ Bến Thành': 'Ben Thanh Market',
    'Nhà hát Thành Phố': 'Saigon Opera House', 'Bến Bạch Đằng': 'Bach Dang Wharf',
    'Phố đi bộ Nguyễn Huệ': 'Nguyen Hue Walking Street', 'Bảo tàng Chứng tích Chiến tranh': 'War Remnants Museum',
    'Bảo tàng TP Hồ Chí Minh': 'Ho Chi Minh City Museum', 'Thảo Cầm Viên Sài Gòn': 'Saigon Zoo and Botanical Gardens',
    'Công viên Tao Đàn': 'Tao Dan Park', 'Chợ Bình Tây': 'Binh Tay Market', 'Chùa Bà Thiên Hậu': 'Thien Hau Temple',
    'Địa đạo Củ Chi': 'Cu Chi Tunnels', 'Landmark 81': 'Landmark 81',
    'Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.': 'A historic landmark associated with the end of the Vietnam War in 1975.',
    'Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.': 'A public green space with mature trees and walking paths.',
  },
  zh: {
    'Dinh Độc Lập': '统一宫', 'Nhà thờ Đức Bà': '西贡圣母圣殿主教座堂', 'Bưu điện Trung tâm Sài Gòn': '西贡中心邮局',
    'Chợ Bến Thành': '滨城市场', 'Nhà hát Thành Phố': '西贡歌剧院', 'Bến Bạch Đằng': '白藤码头', 'Phố đi bộ Nguyễn Huệ': '阮惠步行街',
    'Bảo tàng Chứng tích Chiến tranh': '战争遗迹博物馆', 'Bảo tàng TP Hồ Chí Minh': '胡志明市博物馆', 'Thảo Cầm Viên Sài Gòn': '西贡动物园与植物园',
    'Công viên Tao Đàn': '陶丹公园', 'Chợ Bình Tây': '平西市场', 'Chùa Bà Thiên Hậu': '天后宫', 'Địa đạo Củ Chi': '古芝地道', 'Landmark 81': 'Landmark 81',
    'Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.': '这座历史建筑与 1975 年越南战争结束的事件密切相关。',
    'Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.': '拥有许多古树和步行道的公共绿地。',
  },
  ja: {
    'Dinh Độc Lập': '統一会堂', 'Nhà thờ Đức Bà': 'サイゴン大教会', 'Bưu điện Trung tâm Sài Gòn': 'サイゴン中央郵便局', 'Chợ Bến Thành': 'ベンタイン市場',
    'Nhà hát Thành Phố': 'サイゴン・オペラハウス', 'Bến Bạch Đằng': 'バクダン埠頭', 'Phố đi bộ Nguyễn Huệ': 'グエンフエ歩行者天国',
    'Bảo tàng Chứng tích Chiến tranh': '戦争証跡博物館', 'Bảo tàng TP Hồ Chí Minh': 'ホーチミン市博物館', 'Thảo Cầm Viên Sài Gòn': 'サイゴン動植物園',
    'Công viên Tao Đàn': 'タオダン公園', 'Chợ Bình Tây': 'ビンタイ市場', 'Chùa Bà Thiên Hậu': 'ティエンハウ寺', 'Địa đạo Củ Chi': 'クチトンネル', 'Landmark 81': 'ランドマーク81',
    'Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.': '1975年のベトナム戦争終結にゆかりのある歴史的建造物です。',
    'Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.': '大きな木々と遊歩道がある公共の緑地です。',
  },
  ko: {
    'Dinh Độc Lập': '통일궁', 'Nhà thờ Đức Bà': '사이공 노트르담 대성당', 'Bưu điện Trung tâm Sài Gòn': '사이공 중앙우체국', 'Chợ Bến Thành': '벤탄 시장',
    'Nhà hát Thành Phố': '사이공 오페라 하우스', 'Bến Bạch Đằng': '박당 부두', 'Phố đi bộ Nguyễn Huệ': '응우옌후에 보행자 거리',
    'Bảo tàng Chứng tích Chiến tranh': '전쟁박물관', 'Bảo tàng TP Hồ Chí Minh': '호찌민시 박물관', 'Thảo Cầm Viên Sài Gòn': '사이공 동식물원',
    'Công viên Tao Đàn': '타오단 공원', 'Chợ Bình Tây': '빈떠이 시장', 'Chùa Bà Thiên Hậu': '티엔허우 사원', 'Địa đạo Củ Chi': '꾸찌 터널', 'Landmark 81': '랜드마크 81',
    'Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.': '1975년 베트남 전쟁 종전과 관련된 역사적 건축물입니다.',
    'Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.': '오래된 나무와 산책로가 있는 공공 녹지 공간입니다.',
  },
  de: {
    'Dinh Độc Lập':'Wiedervereinigungspalast','Nhà thờ Đức Bà':'Kathedrale Notre-Dame von Saigon','Bưu điện Trung tâm Sài Gòn':'Zentrales Postamt von Saigon','Chợ Bến Thành':'Ben-Thanh-Markt','Nhà hát Thành Phố':'Opernhaus von Saigon','Bến Bạch Đằng':'Bach-Dang-Kai','Phố đi bộ Nguyễn Huệ':'Nguyen-Hue-Fußgängerzone','Bảo tàng Chứng tích Chiến tranh':'Kriegsmuseum','Bảo tàng TP Hồ Chí Minh':'Museum von Ho-Chi-Minh-Stadt','Thảo Cầm Viên Sài Gòn':'Zoo und Botanischer Garten von Saigon','Công viên Tao Đàn':'Tao-Dan-Park','Chợ Bình Tây':'Binh-Tay-Markt','Chùa Bà Thiên Hậu':'Thien-Hau-Tempel','Địa đạo Củ Chi':'Tunnel von Cu Chi','Landmark 81':'Landmark 81','Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.':'Historische Stätte, die mit dem Ende des Vietnamkriegs im Jahr 1975 verbunden ist.','Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.':'Öffentliche Grünanlage mit alten Bäumen und Spazierwegen.'
  },
  es: {
    'Dinh Độc Lập':'Palacio de la Reunificación','Nhà thờ Đức Bà':'Basílica de Notre-Dame de Saigón','Bưu điện Trung tâm Sài Gòn':'Oficina Central de Correos de Saigón','Chợ Bến Thành':'Mercado Ben Thanh','Nhà hát Thành Phố':'Ópera de Saigón','Bến Bạch Đằng':'Muelle Bach Dang','Phố đi bộ Nguyễn Huệ':'Calle peatonal Nguyen Hue','Bảo tàng Chứng tích Chiến tranh':'Museo de los Vestigios de la Guerra','Bảo tàng TP Hồ Chí Minh':'Museo de Ciudad Ho Chi Minh','Thảo Cầm Viên Sài Gòn':'Jardín Botánico y Zoológico de Saigón','Công viên Tao Đàn':'Parque Tao Dan','Chợ Bình Tây':'Mercado Binh Tay','Chùa Bà Thiên Hậu':'Templo de Thien Hau','Địa đạo Củ Chi':'Túneles de Cu Chi','Landmark 81':'Landmark 81','Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.':'Lugar histórico relacionado con el final de la guerra de Vietnam en 1975.','Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.':'Espacio verde público con árboles antiguos y senderos.'
  },
  fr: {
    'Dinh Độc Lập':'Palais de la Réunification','Nhà thờ Đức Bà':'Basilique Notre-Dame de Saïgon','Bưu điện Trung tâm Sài Gòn':'Bureau central de poste de Saïgon','Chợ Bến Thành':'Marché Ben Thanh','Nhà hát Thành Phố':'Opéra de Saïgon','Bến Bạch Đằng':'Quai Bach Dang','Phố đi bộ Nguyễn Huệ':'Rue piétonne Nguyen Hue','Bảo tàng Chứng tích Chiến tranh':'Musée des vestiges de la guerre','Bảo tàng TP Hồ Chí Minh':'Musée de Hô Chi Minh-Ville','Thảo Cầm Viên Sài Gòn':'Jardin botanique et zoo de Saïgon','Công viên Tao Đàn':'Parc Tao Dan','Chợ Bình Tây':'Marché Binh Tay','Chùa Bà Thiên Hậu':'Temple de Thiên Hậu','Địa đạo Củ Chi':'Tunnels de Cu Chi','Landmark 81':'Landmark 81','Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.':'Site historique lié à la fin de la guerre du Vietnam en 1975.','Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.':'Espace vert public avec de grands arbres et des sentiers.'
  },
  ru: {
    'Dinh Độc Lập':'Дворец Воссоединения','Nhà thờ Đức Bà':'Собор Нотр-Дам в Сайгоне','Bưu điện Trung tâm Sài Gòn':'Центральный почтамт Сайгона','Chợ Bến Thành':'Рынок Бен Тхань','Nhà hát Thành Phố':'Оперный театр Сайгона','Bến Bạch Đằng':'Причал Батьданг','Phố đi bộ Nguyễn Huệ':'Пешеходная улица Нгуен Хюэ','Bảo tàng Chứng tích Chiến tranh':'Музей военной истории','Bảo tàng TP Hồ Chí Minh':'Музей города Хошимин','Thảo Cầm Viên Sài Gòn':'Сайгонский зоопарк и ботанический сад','Công viên Tao Đàn':'Парк Тао Дан','Chợ Bình Tây':'Рынок Бинь Тэй','Chùa Bà Thiên Hậu':'Храм Тхьен Хау','Địa đạo Củ Chi':'Туннели Кути','Landmark 81':'Landmark 81','Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.':'Историческое место, связанное с окончанием войны во Вьетнаме в 1975 году.','Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.':'Общественная зелёная зона со взрослыми деревьями и прогулочными дорожками.'
  },
}
function displayPoiText(value, language) {
  if (!value || language === 'vi') return value || ''
  const dictionary = POI_DISPLAY_TRANSLATIONS[language]
  if (!dictionary) return value
  if (dictionary[value]) return dictionary[value]
  if (language === 'en') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'Ho Chi Minh City, Vietnam').replace('Thành phố Hồ Chí Minh', 'Ho Chi Minh City')
  if (language === 'zh') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', '越南胡志明市').replace('Thành phố Hồ Chí Minh', '胡志明市')
  if (language === 'ja') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'ベトナム・ホーチミン市').replace('Thành phố Hồ Chí Minh', 'ホーチミン市')
  if (language === 'ko') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', '베트남 호찌민시').replace('Thành phố Hồ Chí Minh', '호찌민시')
  if (language === 'de') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'Ho-Chi-Minh-Stadt, Vietnam').replace('Thành phố Hồ Chí Minh', 'Ho-Chi-Minh-Stadt')
  if (language === 'es') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'Ciudad Ho Chi Minh, Vietnam').replace('Thành phố Hồ Chí Minh', 'Ciudad Ho Chi Minh')
  if (language === 'fr') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'Hô Chi Minh-Ville, Vietnam').replace('Thành phố Hồ Chí Minh', 'Hô Chi Minh-Ville')
  if (language === 'ru') return value.replace('Thành phố Hồ Chí Minh, Việt Nam', 'Хошимин, Вьетнам').replace('Thành phố Hồ Chí Minh', 'Хошимин')
  return value
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

function readCoordinate(item, keys) {
  const value = readField(item, keys)

  if (value === '') return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}


 // Chuẩn hóa dữ liệu API để giao diện dùng thống nhất.
function normalizePlace(item, index) {
  const id =
    readField(item, ['poiId', 'PoiId', 'POIId', 'id', 'maPOI', 'maDiaDiem']) || String(index + 1)

  const apiImage = readField(item, [
    'imageUrl',
    'image',
    'photoUrl',
    'thumbnailUrl',
    'hinhAnh',
  ])

  return {
    id,
    name:
      readField(item, [
        'name',
        'poiName',
        'POIName',
        'tenPOI',
        'tenDiaDiem',
        'title',
      ]) || `Địa điểm ${index + 1}`,

    category:
      readField(item, [
        'category',
        'categoryName',
        'type',
        'poiType',
        'loaiDiaDiem',
        'tenLoai',
      ]) || '',

    description:
      readField(item, [
        'description',
        'shortDescription',
        'content',
        'moTa',
        'gioiThieu',
      ]) || '',

    isVisible: (() => {
      const rawVisibility = readField(item, ['isVisible', 'IsVisible'])
      if (rawVisibility === '') return true
      return !['false', '0', 'no'].includes(String(rawVisibility).trim().toLowerCase())
    })(),

    address:
      readField(item, [
        'address',
        'location',
        'diaChi',
        'viTri',
      ]) || '',

// Nếu POI có ảnh Admin upload, lấy ảnh qua endpoint của POI Service.
// Nếu chưa có ảnh upload, dùng ảnh mặc định theo tên địa điểm.
image: apiImage
  ? `/api/POIs/${encodeURIComponent(id)}/image`
  : getPoiImage(
      readField(item, [
        'name',
        'poiName',
        'POIName',
        'tenPOI',
        'tenDiaDiem',
        'title',
      ])
    ),

    // Đọc được cả tên thuộc tính tiếng Anh và tiếng Việt.
    lat: readCoordinate(item, [
      'latitude',
      'lat',
      'viDo',
      'vĩ độ',
    ]),

    lng: readCoordinate(item, [
      'longitude',
      'lng',
      'kinhDo',
      'kinh độ',
      'lon',
    ]),

    raw: item,
  }
}
// Tính khoảng cách đường chim bay giữa hai tọa độ, đơn vị km.
function getDistanceKm(from, to) {
  if (!from || !to) return null

  const values = [from.lat, from.lng, to.lat, to.lng]

  if (!values.every(Number.isFinite)) return null

  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371

  const latitudeDifference = toRadians(to.lat - from.lat)
  const longitudeDifference = toRadians(to.lng - from.lng)

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(longitudeDifference / 2) ** 2

  const safeA = Math.min(1, Math.max(0, a))

  return 2 * earthRadiusKm * Math.atan2(
    Math.sqrt(safeA),
    Math.sqrt(1 - safeA),
  )
}

// Hiển thị khoảng cách dễ đọc với khách tham quan.
function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return ''

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }

  return `${distanceKm.toFixed(1)} km`
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
   // Ngôn ngữ và tốc độ đọc chỉ áp dụng cho phần thuyết minh.
  const [audioLanguage, setAudioLanguage] = useState('vi')
  const [audioSpeed, setAudioSpeed] = useState('1')
  const [narrationText, setNarrationText] = useState('')
  const [narrationLoading, setNarrationLoading] = useState(false)
  const [narrationError, setNarrationError] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState('')
  const narrationRequestRef = useRef(0)
  const speechRequestRef = useRef(0)
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
  const sessionStartPromiseRef = useRef(null)
  const visitStartRequestedRef = useRef(false)

  const t = translations[language]
  const isAudioSupported = AUDIO_SUPPORTED_LANGUAGES.includes(audioLanguage)

// Chỉ lấy và chuẩn hóa dữ liệu POI, không cập nhật state.
async function fetchPlacesData() {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()
  const rows = extractPlaces(data)
  return rows.map(normalizePlace)
}

// Dùng cho nút tải lại danh sách địa điểm.
async function loadPlaces() {
  setLoading(true)
  setError('')

  try {
    const normalized = await fetchPlacesData()

    setPlaces(normalized)

    const poiFromUrl = new URLSearchParams(window.location.search).get('poi')

    setSelectedPlace((current) => {
      if (!normalized.length) return null

      if (poiFromUrl) {
        return normalized.find(
          (place) => String(place.id) === String(poiFromUrl),
        ) || normalized[0]
      }

      if (current) {
        return normalized.find(
          (place) => place.id === current.id,
        ) || normalized[0]
      }

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
  let cancelled = false

  // Tải dữ liệu POI ban đầu.
  async function fetchInitialPlaces() {
    try {
      const normalized = await fetchPlacesData()

      if (cancelled) return

      setPlaces(normalized)

      const poiFromUrl = new URLSearchParams(window.location.search).get('poi')

      setSelectedPlace((current) => {
        if (!normalized.length) return null

        if (poiFromUrl) {
          return normalized.find(
            (place) => String(place.id) === String(poiFromUrl),
          ) || normalized[0]
        }

        if (current) {
          return normalized.find(
            (place) => place.id === current.id,
          ) || normalized[0]
        }

        return normalized[0]
      })
    } catch (err) {
      if (cancelled) return

      console.error('Lỗi tải danh sách POI:', err)
      setError(`${t.error} (${err.message})`)
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  fetchInitialPlaces()

  // Vẫn ghi nhận phiên ngay khi mở website, không phụ thuộc GPS.
  beginVisit()

  return () => {
    cancelled = true
  }
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
      await guiHeartbeat(sessionId)
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
  // Chỉ lấy các địa điểm có tọa độ hợp lệ để hiển thị trên bản đồ.
const mapPlaces = useMemo(() => {
  return places.filter(
    (place) =>
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng) &&
      place.lat >= -90 &&
      place.lat <= 90 &&
      place.lng >= -180 &&
      place.lng <= 180,
  )
}, [places])
// Tìm các địa điểm trong bán kính 4 km tính từ GPS của người dùng.
const nearbyPlaces = useMemo(() => {
  if (!userPosition) return []

  return mapPlaces
    .map((place) => ({
      ...place,
      distanceKm: getDistanceKm(userPosition, place),
    }))
    .filter(
      (place) =>
        place.distanceKm !== null &&
        place.distanceKm <= 4,
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
}, [mapPlaces, userPosition])
  function clearNarrationState() {
    narrationRequestRef.current += 1
    speechRequestRef.current += 1

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setNarrationText('')
    setNarrationLoading(false)
    setNarrationError('')
    setAudioLoading(false)
    setAudioError('')
  }

  function handleAudioLanguageChange(event) {
    const nextLanguage = event.target.value
    if (nextLanguage === audioLanguage) return
    clearNarrationState()
    setAudioLanguage(nextLanguage)
  }
  
  async function requestNarration(poiId) {
    const currentSessionId =
      sessionIdRef.current || await startVisitSession()
  
    if (!currentSessionId) {
      throw new Error('Không tìm thấy phiên tham quan hợp lệ.')
    }
  
    const languageCodeMap = {
      vi: 'vi-VN',
      en: 'en-US',
      zh: 'zh-CN',
      de: 'de-DE',
      es: 'es-ES',
      fr: 'fr-FR',
      ru: 'ru-RU',
    }
    
    const languageCode = languageCodeMap[audioLanguage]
    
    if (!languageCode) {
      throw new Error('Ngôn ngữ thuyết minh không được hỗ trợ.')
    }
    
    return fetch('/api/ai/narration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        poiId,
        sessionId: currentSessionId,
        languageCode,
        idempotencyKey: crypto.randomUUID(),
      }),
    })
  }

  async function generateNarration() {
    if (!selectedPlace) {
      setNarrationError(t.noPlaceSelected)
      return
    }
    const poiId = String(selectedPlace.id)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(poiId)) {
      setNarrationError(t.invalidPlaceId)
      return
    }
    const requestId = ++narrationRequestRef.current
    speechRequestRef.current += 1
    if (window.speechSynthesis) window.speechSynthesis.cancel()

    setNarrationLoading(true)
    setNarrationError('')
    setAudioError('')
    setNarrationText('')

    try {
      const response = await requestNarration(poiId)
      const data = await response.json().catch(() => ({}))

      if (requestId !== narrationRequestRef.current) return
      if (!response.ok || data.success === false) {
        throw new Error(data.message || `${t.narrationCreateFailed} (HTTP ${response.status}).`)
      }
      if (typeof data.narration !== 'string' || !data.narration.trim()) {
        throw new Error(t.narrationInvalid)
      }

      setNarrationText(data.narration.trim())
    } catch (err) {
      if (requestId === narrationRequestRef.current) {
        console.error('Không thể tạo thuyết minh AI:', err)
        setNarrationError(err instanceof Error ? err.message : t.narrationFailed)
      }
    } finally {
      if (requestId === narrationRequestRef.current) setNarrationLoading(false)
    }
  }

  async function generateAudio() {
    if (!isAudioSupported) {
      setAudioError(t.audioUnsupported)
      return
    }

    if (!selectedPlace) {
      setAudioError(t.noPlaceSelected)
      return
    }

    const poiId = String(selectedPlace.id)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(poiId)) {
      setAudioError(t.invalidPlaceId)
      return
    }

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      setAudioError(t.unsupportedSpeech)
      return
    }

    const requestId = ++speechRequestRef.current
    const narrationRequestId = ++narrationRequestRef.current
    setAudioLoading(true)
    setAudioError('')
    setNarrationError('')

    try {
      let textToSpeak = narrationText.trim()
      if (!textToSpeak) {
        const response = await requestNarration(poiId)
        const data = await response.json().catch(() => ({}))

        if (
          requestId !== speechRequestRef.current ||
          narrationRequestId !== narrationRequestRef.current
        ) return

        if (!response.ok || data.success === false) {
          throw new Error(data.message || `${t.narrationCreateFailed} (HTTP ${response.status}).`)
        }
        if (typeof data.narration !== 'string' || !data.narration.trim()) {
          throw new Error(t.narrationInvalid)
        }
        textToSpeak = data.narration.trim()
        setNarrationText(textToSpeak)
      }

      if (requestId !== speechRequestRef.current) return

      const localeByLanguage = {
        vi: 'vi-VN',
        en: 'en-US',
        zh: 'zh-CN',
        ja: 'ja-JP',
        ko: 'ko-KR',
      }
      const locale = localeByLanguage[audioLanguage] || 'vi-VN'
      const utterance = new window.SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = locale
      utterance.rate = Number(audioSpeed) || 1

      const voices = window.speechSynthesis.getVoices()
      const languagePrefix = locale.split('-')[0].toLowerCase()
      const matchingVoice = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
        || voices.find((voice) => voice.lang.toLowerCase().startsWith(`${languagePrefix}-`))
      if (matchingVoice) utterance.voice = matchingVoice

      utterance.onend = () => {
        if (requestId === speechRequestRef.current) {
          setAudioLoading(false)
        }
      }
      utterance.onerror = () => {
        if (requestId === speechRequestRef.current) {
          setAudioError(t.speechFailed)
          setAudioLoading(false)
        }
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch (err) {
      if (requestId === speechRequestRef.current) {
        console.error('Không thể phát thuyết minh:', err)
        setAudioError(err instanceof Error ? err.message : t.speechError)
        setAudioLoading(false)
      }
    }
  }

  function stopAudio() {
    speechRequestRef.current += 1
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setAudioLoading(false)
  }

  
  async function selectPlace(place) {
    clearNarrationState()
    setSelectedPlace(place)
    document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })
  
    try {
      const id = sessionIdRef.current || await startVisitSession()
  
      if (!id) {
        console.error('Không tìm thấy SessionId để lưu POI')
        return
      }
  
      const response = await fetch(
        `/api/VisitSessions/${encodeURIComponent(id)}/selected-poi`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            poiId: place.id,
          }),
        },
      )
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Không lưu được POI:', errorText)
      }
    } catch (error) {
      console.error('Lỗi khi lưu POI đã chọn:', error)
    }
  }
  
  async function getCurrentLocation() {
    const id = sessionIdRef.current || await startVisitSession()
    if (!id) {
      setLocationMessage(t.sessionFailed)
      return
    }
    if (!navigator.geolocation) {
      setLocationMessage(t.gpsUnsupported)
      await updateGpsPermissionStatus('unavailable')
      return
    }

    setLocationMessage(t.locating)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserPosition(coords)
        setLocationMessage(`${t.currentLocation} ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
        await updateVisitLocation(id, coords)
      },
      async (error) => {
        const status =
        error.code === 1
          ? 'denied'
          : error.code === 2
            ? 'unavailable'
            : 'error'
        await updateGpsPermissionStatus(status)
        const messages = { 1: t.gpsPermission, 2: t.gpsUnavailable, 3: t.gpsTimeout }
        setLocationMessage(messages[error.code] || t.gpsFailed)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  // Một QR dùng chung cho tất cả khách, không gắn cứng mã POI.
  const qrUrl = `${window.location.origin}${window.location.pathname}?source=qr#guide`

  async function updateGpsPermissionStatus(status) {
    const id = sessionIdRef.current || await startVisitSession()
    if (!id) return
    try {
      await capNhatTrangThaiGps(id, status)
    } catch (error) {
      console.warn('Không thể cập nhật trạng thái GPS:', error)
    }
  }

  // Tạo phiên ngay khi mở trang, không chờ người dùng cho phép GPS.
  async function startVisitSession() {
    if (sessionIdRef.current) return sessionIdRef.current
    if (sessionStartPromiseRef.current) return sessionStartPromiseRef.current

    const startPromise = (async () => {
      sessionBusyRef.current = true
      setSessionBusy(true)
      setSessionMessage(t.sessionStarting)

      try {
        const data = await taoPhienTruyCap({
          uiLanguageCode: language,
        })

        const id = data.id || data.sessionId
        if (!id) throw new Error('API chưa trả về mã phiên tham quan.')
        sessionIdRef.current = String(id)
        setSessionId(String(id))
        sessionStorage.setItem('visitSessionId', String(id))
        setSessionMessage(t.sessionRecorded)
        return String(id)
      } catch (err) {
        console.error('Không thể bắt đầu phiên tham quan:', err)
        setSessionMessage(`${t.sessionFailed} ${err.message}`)
        return null
      } finally {
        sessionBusyRef.current = false
        setSessionBusy(false)
      }
    })()

    sessionStartPromiseRef.current = startPromise
    try {
      return await startPromise
    } finally {
      if (sessionStartPromiseRef.current === startPromise) {
        sessionStartPromiseRef.current = null
      }
    }
  }

  async function updateVisitLocation(id, coords) {
    if (!id || !coords) return
  
    try {
      await capNhatViTri(id, coords)
      setSessionMessage(t.sessionUpdated)
    } catch (err) {
      console.error('Không thể cập nhật vị trí phiên tham quan:', err)
      setSessionMessage(`${t.sessionGpsFailed} ${err.message}`)
    }
  }

  async function beginVisit() {
    if (visitStartRequestedRef.current) return
    visitStartRequestedRef.current = true
    const id = await startVisitSession()
    if (!id) visitStartRequestedRef.current = false
    // Không xin GPS tại đây. Khách chỉ cấp quyền khi chủ động bấm nút tìm vị trí.
  }

  async function endVisitSession() {
    if (!sessionId || sessionBusyRef.current) return
  
    sessionBusyRef.current = true
    setSessionBusy(true)
    setSessionMessage(t.endingVisit)
  
    try {
      await ketThucPhien(sessionId)
  
      sessionStorage.removeItem('visitSessionId')
      sessionIdRef.current = ''
      visitStartRequestedRef.current = false
      setSessionId('')
      setSessionMessage(t.visitEnded)
    } catch (err) {
      console.error('Không thể kết thúc phiên tham quan:', err)
      setSessionMessage(`${t.visitEndFailed} ${err.message}`)
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

      const data = new Blob([], {
        type: 'application/json',
      })

      // Gửi yêu cầu kết thúc phiên khi trang sắp rời đi.
      const sent = navigator.sendBeacon(url, data)

      // Dự phòng nếu trình duyệt không thể xếp yêu cầu vào hàng đợi.
      if (!sent) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: null,
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
        <a className="brand" href="#home" aria-label={t.brandName}>
          <span className="brand-mark">L</span>
          <span className="brand-copy">
            <span className="brand-name">{t.brandName}</span>
            <span className="brand-subtitle">{t.brandSubtitle}</span>
          </span>
        </a>

        <nav className="nav-links" aria-label={t.navPlaces}>
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
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ru">Русский</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
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
              <span>{t.heroSideExplore}</span>
              <span className="hero-side-rule" />
              <span>{t.heroSideMultilingual}</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>{t.detailArt}</span>
            <span>{t.heroFooterTagline}</span>
          </div>
        </section>

        <section className="quick-tools-section" aria-label={t.toolsLabel}>
          <div className="container quick-tools-grid">
            <article className="quick-tool-card">
              <div className="quick-tool-icon" aria-hidden="true">GPS</div>
              <div className="quick-tool-copy">
                <h2>{t.gpsTitle}</h2>
                <p>{t.gpsText}</p>
                <button className="button button-primary" type="button" onClick={getCurrentLocation}>{t.gpsButton}</button>
                {locationMessage && <p className="tool-feedback" role="status">{locationMessage}</p>}
              </div>
            </article>
            <article className="quick-tool-card qr-display-card">
              <div className="quick-tool-icon" aria-hidden="true">QR</div>
              <div className="quick-tool-copy">
                <h2>{t.qrTitle || "Mã QR địa điểm"}</h2>
                <p>{t.qrText || "Khách dùng camera điện thoại quét mã này để mở thông tin địa điểm đang chọn."}</p>
                <div className="qr-code-wrap">
                  <QRCodeSVG value={qrUrl} size={176} level="M" includeMargin />
                  <strong>{t.brandName}</strong>
                  <small>{t.qrCommon}</small>
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
                <h2>{t.mapTitle}</h2>
                <p className="section-description">{t.mapText}</p>
              </div>
              <a className="button button-outline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">{t.openMaps}</a>
            </div>
            
<div className="map-frame-wrap">
  <NearbyMap
    userPosition={userPosition}
    places={mapPlaces}
    onSelectPlace={selectPlace}
    language={language}
    translateText={(value) => displayPoiText(value, language)}
  />
</div>
{mapPlaces.length === 0 && !loading && (
  <p className="map-data-note" role="status">{t.emptyMap}</p>
)}

            {selectedPlace && (Number.isFinite(selectedPlace.lat) && Number.isFinite(selectedPlace.lng) || selectedPlace.address || selectedPlace.name) && (
              <a
                className="map-direction-link"
                href={`https://www.google.com/maps/dir/?api=1${userPosition ? `&origin=${userPosition.lat},${userPosition.lng}` : ''}&destination=${encodeURIComponent(
                  Number.isFinite(selectedPlace.lat) && Number.isFinite(selectedPlace.lng)
                    ? `${selectedPlace.lat},${selectedPlace.lng}`
                    : selectedPlace.address || selectedPlace.name
                )}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
              >
                {t.directions}
              </a>
            )}
          </div>
        </section>
        <section className="section nearby-section" id="nearby">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-kicker">{language === 'en' ? 'EXPLORE NEARBY' : language === 'zh' ? '探索周边' : language === 'ja' ? '周辺を探索' : language === 'ko' ? '주변 탐색' : 'KHÁM PHÁ XUNG QUANH'}</div>
                <h2>{t.nearbyTitle}</h2>
                <p className="section-description">{t.nearbyDescription}</p>
              </div>
            </div>

            {!userPosition ? (
              <div className="empty-state">
                <p>{t.shareGps}</p>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={getCurrentLocation}
                >
                  {t.getLocation}
                </button>
              </div>
            ) : nearbyPlaces.length === 0 ? (
              <div className="empty-state">
                <p>
                  {t.noNearby}
                </p>
              </div>
            ) : (
              <div className="places-grid">
                {nearbyPlaces.map((place) => (
                  <article className="place-card" key={`nearby-${place.id}`}>
                    <div className="place-card-visual">
                      {place.image ? (
                        <img
                          src={place.image}
                          alt={place.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true
                          }}
                        />
                      ) : (
                        <div className="detail-art">
                          <span>{displayPoiText(place.category || t.placesTitle, language)}</span>
                        </div>
                      )}
                    </div>

                    <div className="place-card-content">
                      <h3>{displayPoiText(place.name, language)}</h3>

                      {place.address && <p>{displayPoiText(place.address, language)}</p>}

                      <p>
                        {t.distanceFromYou} {formatDistance(place.distanceKm)}
                      </p>

                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => selectPlace(place)}
                      >
                        {t.detail}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
                  <button className="clear-search" onClick={() => setSearch('')} type="button" aria-label={t.clearSearch}>
                    ×
                  </button>
                )}
              </label>
              <button className="button button-outline" onClick={loadPlaces} disabled={loading}>
                {loading ? t.retryLoading : t.retry}
              </button>
            </div>

            {error && (
              <div className="error-panel" role="alert">
                <div>
                  <strong>{t.error}</strong>
                  <p>{error}</p>
                  <small>{t.apiHelp}</small>
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
                          <span className="place-art-title">{displayPoiText(place.name, language)}</span>
                          <span className="place-art-caption">{t.brandSubtitle}</span>
                        </div>
                      )}
                      <span className="place-index">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="place-card-body">
                      <div className="place-category">{displayPoiText(place.category || t.detailArt, language)}</div>
                      <h3>{displayPoiText(place.name, language)}</h3>
                      <p>{displayPoiText(place.description, language) || t.noDescription}</p>
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
                <h3 style={{ marginTop: 0 }}>{t.visitSession}</h3>
                <p>{t.visitSessionText}</p>
                {sessionId ? (
                  <button className="button button-outline" type="button" onClick={endVisitSession} disabled={sessionBusy}>
                    {sessionBusy ? t.processing : t.endVisit}
                  </button>
                ) : (
                  <button className="button button-primary" type="button" onClick={beginVisit} disabled={sessionBusy}>
                    {sessionBusy ? t.processing : t.startVisit}
                  </button>
                )}
                {sessionMessage && <p role="status" style={{ marginBottom: 0 }}>{sessionMessage}</p>}
              </div>
            </div>

            <div className="detail-panel">
              <div className="detail-visual">
                {selectedPlace?.image ? (
                  <img src={selectedPlace.image} alt={displayPoiText(selectedPlace.name, language)} />
                ) : (
                  <div className="detail-art">
                    <span className="detail-art-overline">{t.selected}</span>
                    <span className="detail-art-title">{selectedPlace ? displayPoiText(selectedPlace.name, language) : t.detailTitle}</span>
                    <span className="detail-art-bottom">{t.brandSubtitle}</span>
                  </div>
                )}
              </div>
              <div className="detail-content">
                <div className="section-kicker">{t.detailTitle}</div>
                <h3>{selectedPlace ? displayPoiText(selectedPlace.name, language) : t.choose}</h3>
                {selectedPlace ? (
                  <>
                    <p>{displayPoiText(selectedPlace.description, language) || t.noDescription}</p>
                    {selectedPlace.address && (
                      <div className="detail-field">
                        <span>{t.addressLabel}</span>
                        <strong>{displayPoiText(selectedPlace.address, language)}</strong>
                      </div>
                    )}
                    <div className="detail-field">
                      <span>{t.id}</span>
                      <strong>{selectedPlace.id}</strong>
                    </div>
                    {selectedPlace.category && (
                      <div className="detail-field">
                        <span>{t.category}</span>
                        <strong>{displayPoiText(selectedPlace.category, language)}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{t.choose}</p>
                )}
                {selectedPlace && (
                  <div className="guide-actions narration-panel" style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 10 }}>{t.aiTitle}</h4>

                    <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span>{t.narrationLanguage}</span>
                      <select
                      value={audioLanguage}
                      onChange={handleAudioLanguageChange}
                      disabled={narrationLoading || audioLoading}
                      aria-label={t.narrationLanguageAria}
                      style={{ padding: '8px 10px', border: '1px solid #d5e0d8', borderRadius: 8, background: '#fff' }}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                      <option value="de">Deutsch</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="ru">Русский</option>
                    </select>
                    </label>

                    <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span>{t.readingSpeed}</span>
                      <select
                        value={audioSpeed}
                        onChange={(event) => setAudioSpeed(event.target.value)}
                        disabled={!isAudioSupported || audioLoading}
                        aria-label={t.readingSpeedAria}
                        style={{ padding: '8px 10px', border: '1px solid #d5e0d8', borderRadius: 8, background: '#fff' }}
                      >
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                      </select>
                    </label>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <button
                        className="button button-primary detail-button"
                        type="button"
                        onClick={generateNarration}
                        disabled={narrationLoading || audioLoading}
                      >
                        {narrationLoading ? t.narrationLoading : t.createNarration}
                      </button>
                      <button
                        className="button button-outline detail-button"
                        type="button"
                        onClick={generateAudio}
                        disabled={!isAudioSupported || audioLoading || narrationLoading}
                        title={!isAudioSupported ? t.audioUnsupported : undefined}
                      >
                        {audioLoading ? t.audioLoading : t.listenGuide}
                      </button>
                      {audioLoading && (
                        <button className="button button-outline detail-button" type="button" onClick={stopAudio}>
                          {t.stopReading}
                        </button>
                      )}
                    </div>
                    {!isAudioSupported && (
                      <p role="status" style={{ color: '#b45309', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 12px', marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                        {t.audioUnsupported}
                      </p>
                    )}

                    {narrationError && <p role="alert" style={{ color: '#b42318', marginTop: 12 }}>{narrationError}</p>}
                    {audioError && <p role="alert" style={{ color: '#b42318', marginTop: 12 }}>{audioError}</p>}
                    {narrationText && (
                      <div aria-live="polite" style={{ marginTop: 14, lineHeight: 1.8 }}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{narrationText}</p>
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
                      {t.narrationNote}
                    </p>
                  </div>
                )}

                <a
                  className="button button-outline detail-button"
                  href="#places"
                >
                  {t.placesTitle}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container">
            <div className="about-intro">
              <div className="section-kicker">{t.aboutExperience || "ABOUT THE EXPERIENCE"}</div>
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
                <p>{t.languageList || "Vietnamese · English · Chinese · Japanese · Korean"}</p>
              </div>
              <div className="language-options">
                {[
                  ['vi', 'Tiếng Việt'],
                  ['en', 'English'],
                  ['zh', '中文'],
                  ['de', 'Deutsch'],
                  ['es', 'Español'],
                  ['fr', 'Français'],
                  ['ru', 'Русский'],
                  ['ja', '日本語'],
                  ['ko', '한국어'],
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
          <a className="footer-brand" href="#home">THUYẾT MINH <span>{t.heroSideMultilingual}</span></a>
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
            <div className="section-kicker">{t.brandSubtitle}</div>
            <h2 id="qr-modal-title">{t.qrModalTitle || "Mã QR tham quan"}</h2>
            <div className="qr-code-wrap qr-modal-code">
              <QRCodeSVG value={qrUrl} size={240} level="M" includeMargin />
              <strong>{t.brandName}</strong>
              <p>{t.qrModalText}</p>
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

  // Hiển thị trang đăng nhập quản trị.
  if (path === '/admin/login') {
    return <AdminLogin />
  }

  // Chỉ cho phép vào dashboard khi JWT còn hạn (JWT backend đặt hạn 24 giờ).
if (path === '/admin/visits') {
  const token = sessionStorage.getItem('adminToken')
  let tokenValid = false

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      tokenValid = typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
    } catch {
      tokenValid = false
    }
  }

  if (!tokenValid) {
    sessionStorage.removeItem('adminToken')
    window.location.replace('/admin/login')
    return null
  }

  return <VisitDashboard />
}

  // Giữ nguyên website dành cho khách tham quan.
  return <TourismHome />
}

export default App
