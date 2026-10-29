
import VisitDashboard from './VisitDashboard.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const API_URL = '/api/POIs'

const LANGUAGE_OPTIONS = [
  ['vi', 'Tiếng Việt'],
  ['en', 'English'],
  ['zh', '中文'],
  ['ja', '日本語'],
  ['ko', '한국어'],
]

const translations = {
  vi: {
    brandTitle: 'THUYẾT MINH',
    brandSubtitle: 'ĐA NGÔN NGỮ',
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
    clearSearch: 'Xóa tìm kiếm',
    loading: 'Đang tải danh sách địa điểm...',
    refreshing: 'Đang tải...',
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
    aboutEyebrow: 'GIỚI THIỆU TRẢI NGHIỆM',
    feature1: 'Thông tin tập trung',
    feature1Text: 'Tra cứu địa điểm từ nguồn dữ liệu của hệ thống.',
    feature2: 'Giao diện đa ngôn ngữ',
    feature2Text: 'Chuyển đổi ngôn ngữ hiển thị của giao diện.',
    feature3: 'Thiết kế linh hoạt',
    feature3Text: 'Sử dụng trên máy tính, máy tính bảng và điện thoại.',
    language: 'Ngôn ngữ giao diện',
    languageList: 'Tiếng Việt · English · 中文 · 日本語 · 한국어',
    footer: 'Nền tảng hướng dẫn tham quan số',
    footerNote: 'Dữ liệu địa điểm được lấy từ POI Service.',
    close: 'Đóng',
    selected: 'Địa điểm đã chọn',
    noDescription: 'Chưa có mô tả cho địa điểm này.',
    noImage: 'HÌNH ẢNH ĐỊA ĐIỂM',
    id: 'Mã địa điểm',
    category: 'Loại địa điểm',
    address: 'Địa chỉ',
    status: 'Trạng thái dữ liệu',
    connected: 'Đã kết nối API',
    disconnected: 'Chưa tải được dữ liệu',
    poiSource: 'POI Service · /api/POIs',
    apiHelp: 'Hãy kiểm tra POI Service ở cổng 5252 và cấu hình proxy trong vite.config.js.',
    toolsTitle: 'Công cụ tham quan',
    gpsTitle: 'Định vị vị trí của bạn',
    gpsDescription: 'Cho phép GPS để xác định vị trí hiện tại và mở bản đồ Google Maps.',
    getLocation: 'Lấy vị trí hiện tại',
    gpsUnsupported: 'Trình duyệt không hỗ trợ GPS.',
    gpsRequesting: 'Đang xác định vị trí...',
    gpsPosition: 'Vị trí hiện tại: {lat}, {lng}',
    gpsPermissionDenied: 'Bạn chưa cấp quyền vị trí. Hãy cho phép truy cập vị trí trong trình duyệt.',
    gpsUnknown: 'Không xác định được vị trí. Hãy bật GPS và thử lại.',
    gpsTimeout: 'Định vị quá thời gian chờ. Vui lòng thử lại.',
    gpsUnavailable: 'Không thể lấy vị trí hiện tại.',
    qrTitle: 'Mã QR địa điểm',
    qrDescription: 'Dùng camera điện thoại quét mã này để mở trang trải nghiệm.',
    qrSharedTitle: 'Thuyết minh Đa ngôn ngữ',
    qrScanHint: 'Quét mã để mở trang trải nghiệm chung',
    qrModalTitle: 'Mã QR tham quan',
    qrInstructions: 'Dùng camera điện thoại quét mã để mở trang trải nghiệm chung.',
    mapTitle: 'Bản đồ khám phá',
    mapDescription: 'Xem địa điểm đang chọn hoặc vị trí hiện tại trên Google Maps.',
    openMap: 'Mở Google Maps',
    directions: 'Chỉ đường đến địa điểm đã chọn',
    discover: 'KHÁM PHÁ',
    multilingual: 'ĐA NGÔN NGỮ',
    motto: 'KHÁM PHÁ · TÌM HIỂU · TRẢI NGHIỆM',
    sessionTitle: 'Phiên tham quan',
    sessionDescription: 'Phiên tham quan được ghi nhận khi mở trang. Chia sẻ GPS là tùy chọn.',
    sessionStarting: 'Đang ghi nhận lượt tham quan...',
    sessionPendingGps: 'Đã ghi nhận lượt tham quan. Đang chờ quyền GPS...',
    sessionStartFailed: 'Chưa ghi nhận được lượt tham quan',
    sessionGpsUpdated: 'Đã ghi nhận lượt tham quan và cập nhật vị trí GPS.',
    sessionGpsUpdateFailed: 'Đã ghi nhận lượt tham quan nhưng chưa cập nhật được GPS',
    sessionNoGps: 'Đã ghi nhận lượt tham quan. Bạn chưa chia sẻ vị trí GPS.',
    sessionGpsDenied: 'Bạn chưa chia sẻ GPS. Lượt tham quan vẫn được ghi nhận, không lưu tọa độ.',
    sessionGpsRequest: 'Đang xin quyền xác định vị trí...',
    gpsAnonymous: 'Trình duyệt không hỗ trợ GPS. Lượt tham quan vẫn được ghi nhận ẩn danh.',
    sessionEnding: 'Đang kết thúc trải nghiệm...',
    sessionEnded: 'Đã kết thúc trải nghiệm',
    sessionEndFailed: 'Không thể kết thúc trải nghiệm',
    startVisit: 'Bắt đầu trải nghiệm',
    endVisit: 'Kết thúc trải nghiệm',
    processing: 'Đang xử lý...',
    duration: 'Thời lượng: {seconds} giây',
    narrationTitle: 'Thuyết minh AI',
    generateNarration: 'Tạo thuyết minh',
    generatingNarration: 'Đang tạo thuyết minh...',
    selectPlace: 'Vui lòng chọn một địa điểm trước.',
    invalidPoiId: 'Mã địa điểm không hợp lệ.',
    narrationFailed: 'Không thể tạo thuyết minh.',
    narrationEmpty: 'AI Service không trả về nội dung thuyết minh.',
    audioTitle: 'Nghe thuyết minh',
    generateAudio: 'Đọc thuyết minh',
    generatingAudio: 'Đang đọc thuyết minh...',
    audioFailed: 'Trình duyệt không thể phát giọng đọc.',
    audioVoiceMissing: 'Thiết bị chưa có giọng đọc phù hợp với ngôn ngữ đã chọn. Hãy kiểm tra các voice trên thiết bị.',
    audioSpeedLabel: 'Tốc độ đọc',
    audioQuotaHint: 'Giọng đọc phụ thuộc các voice có sẵn trên thiết bị.',
    detailDescriptionLabel: 'Mô tả',
    detailAudioKicker: 'THUYẾT MINH ĐA NGÔN NGỮ',
    detailDistanceLabel: 'Khoảng cách từ bạn',
    detailNoAddress: 'Chưa có địa chỉ trong dữ liệu địa điểm',
  },

  en: {
    brandTitle: 'AUDIO GUIDE',
    brandSubtitle: 'MULTILINGUAL',
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
    clearSearch: 'Clear search',
    loading: 'Loading places...',
    refreshing: 'Loading...',
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
    aboutEyebrow: 'ABOUT THE EXPERIENCE',
    feature1: 'Centralized information',
    feature1Text: 'Browse places from the system data source.',
    feature2: 'Multilingual interface',
    feature2Text: 'Change the interface language.',
    feature3: 'Responsive design',
    feature3Text: 'Designed for desktop, tablet and mobile.',
    language: 'Interface language',
    languageList: 'Tiếng Việt · English · 中文 · 日本語 · 한국어',
    footer: 'Digital visitor guide platform',
    footerNote: 'Place data is provided by POI Service.',
    close: 'Close',
    selected: 'Selected place',
    noDescription: 'No description is available for this place.',
    noImage: 'PLACE IMAGE',
    id: 'Place ID',
    category: 'Category',
    address: 'Address',
    status: 'Data status',
    connected: 'API connected',
    disconnected: 'Data unavailable',
    poiSource: 'POI Service · /api/POIs',
    apiHelp: 'Check POI Service on port 5252 and the proxy configuration in vite.config.js.',
    toolsTitle: 'Visitor tools',
    gpsTitle: 'Find your location',
    gpsDescription: 'Use GPS to determine your current location and open Google Maps.',
    getLocation: 'Get my location',
    gpsUnsupported: 'This browser does not support GPS.',
    gpsRequesting: 'Getting your location...',
    gpsPosition: 'Current location: {lat}, {lng}',
    gpsPermissionDenied: 'Location permission was denied. Allow location access in your browser.',
    gpsUnknown: 'Could not determine your location. Enable GPS and try again.',
    gpsTimeout: 'Location request timed out. Please try again.',
    gpsUnavailable: 'Could not get your current location.',
    qrTitle: 'Place QR code',
    qrDescription: 'Scan this code with your phone camera to open the visitor experience.',
    qrSharedTitle: 'Multilingual Audio Guide',
    qrScanHint: 'Scan to open the visitor experience',
    qrModalTitle: 'Visitor QR code',
    qrInstructions: 'Scan this code with your phone camera to open the visitor experience.',
    mapTitle: 'Explore the map',
    mapDescription: 'View the selected place or your current location on Google Maps.',
    openMap: 'Open Google Maps',
    directions: 'Directions to the selected place',
    discover: 'DISCOVER',
    multilingual: 'MULTILINGUAL',
    motto: 'DISCOVER · LEARN · EXPERIENCE',
    sessionTitle: 'Visit session',
    sessionDescription: 'The visit is recorded when the page opens. Sharing GPS is optional.',
    sessionStarting: 'Recording your visit...',
    sessionPendingGps: 'Visit recorded. Waiting for GPS permission...',
    sessionStartFailed: 'Could not start the visit',
    sessionGpsUpdated: 'Visit recorded and GPS location updated.',
    sessionGpsUpdateFailed: 'Visit recorded, but GPS could not be updated',
    sessionNoGps: 'Visit recorded. You have not shared your GPS location.',
    sessionGpsDenied: 'You have not shared GPS. Your visit is recorded without coordinates.',
    sessionGpsRequest: 'Requesting location permission...',
    gpsAnonymous: 'This browser does not support GPS. Your visit is still recorded anonymously.',
    sessionEnding: 'Ending your visit...',
    sessionEnded: 'Visit ended',
    sessionEndFailed: 'Could not end the visit',
    startVisit: 'Start visit',
    endVisit: 'End visit',
    processing: 'Processing...',
    duration: 'Duration: {seconds} seconds',
    narrationTitle: 'AI narration',
    generateNarration: 'Generate narration',
    generatingNarration: 'Generating narration...',
    selectPlace: 'Please select a place first.',
    invalidPoiId: 'The selected place has an invalid ID.',
    narrationFailed: 'Could not generate narration.',
    narrationEmpty: 'AI Service returned no narration text.',
    audioTitle: 'Listen to narration',
    generateAudio: 'Read narration aloud',
    generatingAudio: 'Speaking narration...',
    audioFailed: 'The browser could not speak this narration.',
    audioVoiceMissing: 'No voice is available for the selected language on this device.',
    audioSpeedLabel: 'Reading speed',
    audioQuotaHint: 'Voice availability depends on your device.',
    detailDescriptionLabel: 'Description',
    detailAudioKicker: 'MULTILINGUAL AUDIO GUIDE',
    detailDistanceLabel: 'Distance from you',
    detailNoAddress: 'No address is available for this place.',
  },

  zh: {
    brandTitle: '多语言导览',
    brandSubtitle: '语音讲解',
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
    clearSearch: '清除搜索',
    loading: '正在加载景点...',
    refreshing: '正在加载...',
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
    aboutEyebrow: '体验介绍',
    feature1: '集中信息',
    feature1Text: '从系统数据源查询景点。',
    feature2: '多语言界面',
    feature2Text: '切换界面语言。',
    feature3: '灵活设计',
    feature3Text: '适用于电脑、平板和手机。',
    language: '界面语言',
    languageList: 'Tiếng Việt · English · 中文 · 日本語 · 한국어',
    footer: '数字旅游导览平台',
    footerNote: '景点数据来自 POI Service。',
    close: '关闭',
    selected: '已选景点',
    noDescription: '暂无该景点的介绍。',
    noImage: '景点图片',
    id: '景点编号',
    category: '景点类型',
    address: '地址',
    status: '数据状态',
    connected: 'API 已连接',
    disconnected: '数据不可用',
    poiSource: 'POI Service · /api/POIs',
    apiHelp: '请检查 5252 端口的 POI Service 以及 vite.config.js 中的代理配置。',
    toolsTitle: '游览工具',
    gpsTitle: '定位您的位置',
    gpsDescription: '使用 GPS 获取当前位置并打开 Google 地图。',
    getLocation: '获取当前位置',
    gpsUnsupported: '此浏览器不支持 GPS。',
    gpsRequesting: '正在获取位置...',
    gpsPosition: '当前位置：{lat}, {lng}',
    gpsPermissionDenied: '未获得位置权限，请在浏览器中允许访问位置。',
    gpsUnknown: '无法确定位置，请开启 GPS 后重试。',
    gpsTimeout: '定位请求超时，请重试。',
    gpsUnavailable: '无法获取当前位置。',
    qrTitle: '景点二维码',
    qrDescription: '使用手机相机扫描二维码，打开游览页面。',
    qrSharedTitle: '多语言讲解系统',
    qrScanHint: '扫描二维码以打开游览页面',
    qrModalTitle: '游客二维码',
    qrInstructions: '使用手机相机扫描二维码，打开游览页面。',
    mapTitle: '探索地图',
    mapDescription: '在 Google 地图上查看所选景点或当前位置。',
    openMap: '打开 Google 地图',
    directions: '前往所选景点的路线',
    discover: '探索',
    multilingual: '多语言',
    motto: '探索 · 学习 · 体验',
    sessionTitle: '游览会话',
    sessionDescription: '打开页面时记录游览。是否分享 GPS 位置由您决定。',
    sessionStarting: '正在记录游览...',
    sessionPendingGps: '游览已记录，正在等待 GPS 权限...',
    sessionStartFailed: '无法开始游览',
    sessionGpsUpdated: '游览已记录，GPS 位置已更新。',
    sessionGpsUpdateFailed: '游览已记录，但无法更新 GPS 位置',
    sessionNoGps: '游览已记录。您尚未分享 GPS 位置。',
    sessionGpsDenied: '您尚未分享 GPS。游览记录不会保存坐标。',
    sessionGpsRequest: '正在请求位置权限...',
    gpsAnonymous: '此浏览器不支持 GPS。您的游览仍会以匿名方式记录。',
    sessionEnding: '正在结束游览...',
    sessionEnded: '游览已结束',
    sessionEndFailed: '无法结束游览',
    startVisit: '开始游览',
    endVisit: '结束游览',
    processing: '正在处理...',
    duration: '时长：{seconds} 秒',
    narrationTitle: 'AI 讲解',
    generateNarration: '生成讲解',
    generatingNarration: '正在生成讲解...',
    selectPlace: '请先选择一个景点。',
    invalidPoiId: '所选景点 ID 无效。',
    narrationFailed: '无法生成讲解。',
    narrationEmpty: 'AI Service 未返回讲解内容。',
    audioTitle: '收听讲解',
    generateAudio: '朗读讲解',
    generatingAudio: '正在朗读讲解...',
    audioFailed: '浏览器无法朗读此讲解。',
    audioVoiceMissing: '此设备没有所选语言的可用语音，请检查设备的语音设置。',
    audioSpeedLabel: '朗读速度',
    audioQuotaHint: '语音取决于设备上可用的语音。',
    detailDescriptionLabel: '景点介绍',
    detailAudioKicker: '多语言语音导览',
    detailDistanceLabel: '距您距离',
    detailNoAddress: '暂无该景点地址信息。',
  },

  ja: {
    brandTitle: '音声ガイド',
    brandSubtitle: '多言語対応',
    top: '多言語音声ガイド · 観光スポットを巡る',
    navPlaces: '観光スポット',
    navGuide: '音声ガイド',
    navAbout: '紹介',
    access: 'アクセスコード',
    eyebrow: 'デジタル文化遺産体験',
    heroTitle: '自分のペースで目的地を探索',
    heroText: 'スポットを検索し、地図を確認して、お好みの言語で観光情報を利用できます。',
    explore: 'スポットを探す',
    learn: '詳しく見る',
    heroNote: '多言語対応 · スポット情報 · デジタル体験',
    journey: 'あなたの旅',
    placesTitle: '観光スポット',
    placesDesc: 'システムのデータから取得したスポット一覧です。',
    search: 'スポットを検索...',
    clearSearch: '検索をクリア',
    loading: 'スポットを読み込み中...',
    refreshing: '読み込み中...',
    empty: '該当するスポットがありません。',
    error: 'スポット情報を読み込めません。',
    retry: '再試行',
    total: '件',
    detail: '詳細を見る',
    detailTitle: 'スポット情報',
    choose: 'スポットを選択してください。',
    guide: '探索',
    guideTitle: 'それぞれの場所に物語がある',
    guideText: '一覧からスポットを選択して詳細を確認してください。',
    aboutTitle: 'より便利な観光体験',
    aboutText: '多言語ガイドでスポット検索、位置確認、観光情報の閲覧ができます。',
    aboutEyebrow: '体験について',
    feature1: '情報を一元管理',
    feature1Text: 'システムのデータからスポットを検索できます。',
    feature2: '多言語インターフェース',
    feature2Text: '画面に表示する言語を切り替えられます。',
    feature3: '柔軟なデザイン',
    feature3Text: 'パソコン、タブレット、スマートフォンに対応。',
    language: '表示言語',
    languageList: 'Tiếng Việt · English · 中文 · 日本語 · 한국어',
    footer: 'デジタル観光ガイド',
    footerNote: 'スポット情報は POI Service から取得します。',
    close: '閉じる',
    selected: '選択中のスポット',
    noDescription: '説明はありません。',
    noImage: 'スポット画像',
    id: 'スポット ID',
    category: 'カテゴリ',
    address: '住所',
    status: 'データ状態',
    connected: 'API 接続済み',
    disconnected: 'データを取得できません',
    poiSource: 'POI Service · /api/POIs',
    apiHelp: '5252 ポートの POI Service と vite.config.js のプロキシ設定を確認してください。',
    toolsTitle: '観光ツール',
    gpsTitle: '現在地を確認',
    gpsDescription: 'GPS で現在地を取得し、Google マップを開きます。',
    getLocation: '現在地を取得',
    gpsUnsupported: 'このブラウザーは GPS に対応していません。',
    gpsRequesting: '現在地を取得しています...',
    gpsPosition: '現在地：{lat}, {lng}',
    gpsPermissionDenied: '位置情報が許可されていません。ブラウザーで位置情報へのアクセスを許可してください。',
    gpsUnknown: '位置を特定できません。GPS を有効にして再試行してください。',
    gpsTimeout: '位置情報の取得がタイムアウトしました。再試行してください。',
    gpsUnavailable: '現在地を取得できませんでした。',
    qrTitle: 'スポットの QR コード',
    qrDescription: 'スマートフォンのカメラでスキャンして観光ページを開きます。',
    qrSharedTitle: '多言語音声ガイド',
    qrScanHint: 'スキャンして観光ページを開く',
    qrModalTitle: '観光用 QR コード',
    qrInstructions: 'スマートフォンのカメラでスキャンして観光ページを開きます。',
    mapTitle: '地図で探索',
    mapDescription: '選択したスポットまたは現在地を Google マップで確認します。',
    openMap: 'Google マップを開く',
    directions: '選択したスポットへの道順',
    discover: '探索',
    multilingual: '多言語',
    motto: '探索 · 学習 · 体験',
    sessionTitle: '観光セッション',
    sessionDescription: 'ページを開くと観光セッションが記録されます。GPS の共有は任意です。',
    sessionStarting: '観光を記録しています...',
    sessionPendingGps: '観光を記録しました。GPS の許可を待っています...',
    sessionStartFailed: '観光を開始できませんでした',
    sessionGpsUpdated: '観光を記録し、GPS の位置情報を更新しました。',
    sessionGpsUpdateFailed: '観光は記録されましたが、GPS を更新できませんでした',
    sessionNoGps: '観光を記録しました。GPS の位置情報は共有されていません。',
    sessionGpsDenied: 'GPS は共有されていません。座標を保存せずに観光を記録しました。',
    sessionGpsRequest: '位置情報の許可を求めています...',
    gpsAnonymous: 'このブラウザーは GPS に対応していません。訪問は匿名で記録されます。',
    sessionEnding: '観光を終了しています...',
    sessionEnded: '観光を終了しました',
    sessionEndFailed: '観光を終了できませんでした',
    startVisit: '観光を開始',
    endVisit: '観光を終了',
    processing: '処理中...',
    duration: '所要時間：{seconds} 秒',
    narrationTitle: 'AI 音声ガイド',
    generateNarration: '音声ガイドを生成',
    generatingNarration: '音声ガイドを生成中...',
    selectPlace: '先に観光スポットを選択してください。',
    invalidPoiId: '選択したスポット ID が無効です。',
    narrationFailed: '音声ガイドを生成できませんでした。',
    narrationEmpty: 'AI Service から音声ガイドの文章が返されませんでした。',
    audioTitle: '音声で聞く',
    generateAudio: '解説を読み上げる',
    generatingAudio: '解説を読み上げています...',
    audioFailed: 'ブラウザーで読み上げできません。',
    audioVoiceMissing: 'このデバイスでは選択した言語の音声を利用できません。音声設定を確認してください。',
    audioSpeedLabel: '読み上げ速度',
    audioQuotaHint: '利用できる音声は端末の環境によって異なります。',
    detailDescriptionLabel: '説明',
    detailAudioKicker: '多言語音声ガイド',
    detailDistanceLabel: '現在地からの距離',
    detailNoAddress: 'このスポットの住所情報はありません。',
  },

  ko: {
    brandTitle: '오디오 가이드',
    brandSubtitle: '다국어 지원',
    top: '다국어 오디오 가이드 · 관광지 탐방',
    navPlaces: '관광지',
    navGuide: '해설',
    navAbout: '소개',
    access: '접근 코드',
    eyebrow: '디지털 문화유산 체험',
    heroTitle: '나만의 속도로 여행지를 탐험하세요',
    heroText: '관광지를 검색하고 지도를 확인하며 원하는 언어로 관광 정보를 이용하세요.',
    explore: '관광지 둘러보기',
    learn: '자세히 알아보기',
    heroNote: '다국어 지원 · 관광지 정보 · 디지털 체험',
    journey: '나의 여행',
    placesTitle: '관광지',
    placesDesc: '시스템 데이터에서 불러온 관광지 목록입니다.',
    search: '관광지 검색...',
    clearSearch: '검색 지우기',
    loading: '관광지 목록을 불러오는 중...',
    refreshing: '불러오는 중...',
    empty: '검색 결과가 없습니다.',
    error: '관광지 데이터를 불러올 수 없습니다.',
    retry: '다시 시도',
    total: '곳',
    detail: '상세 보기',
    detailTitle: '관광지 정보',
    choose: '정보를 보려면 관광지를 선택하세요.',
    guide: '탐험',
    guideTitle: '모든 장소에는 이야기가 있습니다',
    guideText: '목록에서 관광지를 선택하여 상세 정보를 확인하세요.',
    aboutTitle: '더 편리한 관광 경험',
    aboutText: '다국어 가이드를 통해 관광지 검색, 위치 확인 및 관광 정보를 이용할 수 있습니다.',
    aboutEyebrow: '서비스 소개',
    feature1: '통합 정보',
    feature1Text: '시스템 데이터에서 관광지를 검색합니다.',
    feature2: '다국어 인터페이스',
    feature2Text: '화면 표시 언어를 변경할 수 있습니다.',
    feature3: '반응형 디자인',
    feature3Text: '데스크톱, 태블릿, 휴대폰에서 사용할 수 있습니다.',
    language: '인터페이스 언어',
    languageList: 'Tiếng Việt · English · 中文 · 日本語 · 한국어',
    footer: '디지털 관광 가이드 플랫폼',
    footerNote: '관광지 데이터는 POI Service에서 제공합니다.',
    close: '닫기',
    selected: '선택한 관광지',
    noDescription: '등록된 설명이 없습니다.',
    noImage: '관광지 이미지',
    id: '관광지 ID',
    category: '관광지 유형',
    address: '주소',
    status: '데이터 상태',
    connected: 'API 연결됨',
    disconnected: '데이터를 불러올 수 없음',
    poiSource: 'POI Service · /api/POIs',
    apiHelp: '5252 포트의 POI Service와 vite.config.js 프록시 설정을 확인하세요.',
    toolsTitle: '관광 도구',
    gpsTitle: '현재 위치 찾기',
    gpsDescription: 'GPS로 현재 위치를 확인하고 Google 지도를 엽니다.',
    getLocation: '현재 위치 가져오기',
    gpsUnsupported: '이 브라우저는 GPS를 지원하지 않습니다.',
    gpsRequesting: '현재 위치를 확인하는 중...',
    gpsPosition: '현재 위치: {lat}, {lng}',
    gpsPermissionDenied: '위치 권한이 거부되었습니다. 브라우저에서 위치 접근을 허용해 주세요.',
    gpsUnknown: '위치를 확인할 수 없습니다. GPS를 켜고 다시 시도해 주세요.',
    gpsTimeout: '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.',
    gpsUnavailable: '현재 위치를 가져올 수 없습니다.',
    qrTitle: '관광지 QR 코드',
    qrDescription: '휴대전화 카메라로 QR 코드를 스캔하여 관광 페이지를 엽니다.',
    qrSharedTitle: '다국어 오디오 가이드',
    qrScanHint: '스캔하여 관광 페이지 열기',
    qrModalTitle: '방문 QR 코드',
    qrInstructions: '휴대전화 카메라로 QR 코드를 스캔하여 관광 페이지를 여세요.',
    mapTitle: '지도 탐색',
    mapDescription: '선택한 관광지 또는 현재 위치를 Google 지도에서 확인합니다.',
    openMap: 'Google 지도 열기',
    directions: '선택한 관광지 길찾기',
    discover: '탐험',
    multilingual: '다국어',
    motto: '탐험 · 학습 · 체험',
    sessionTitle: '방문 세션',
    sessionDescription: '페이지를 열면 방문 기록이 생성됩니다. GPS 공유는 선택 사항입니다.',
    sessionStarting: '방문을 기록하는 중...',
    sessionPendingGps: '방문이 기록되었습니다. GPS 권한을 기다리는 중...',
    sessionStartFailed: '방문을 시작할 수 없습니다',
    sessionGpsUpdated: '방문 기록과 GPS 위치가 업데이트되었습니다.',
    sessionGpsUpdateFailed: '방문은 기록되었지만 GPS를 업데이트하지 못했습니다',
    sessionNoGps: '방문이 기록되었습니다. GPS 위치는 공유되지 않았습니다.',
    sessionGpsDenied: 'GPS를 공유하지 않았습니다. 좌표 없이 방문을 기록했습니다.',
    sessionGpsRequest: '위치 권한을 요청하는 중...',
    gpsAnonymous: '이 브라우저는 GPS를 지원하지 않습니다. 방문은 익명으로 기록됩니다.',
    sessionEnding: '방문을 종료하는 중...',
    sessionEnded: '방문이 종료되었습니다',
    sessionEndFailed: '방문을 종료할 수 없습니다',
    startVisit: '방문 시작',
    endVisit: '방문 종료',
    processing: '처리 중...',
    duration: '이용 시간: {seconds}초',
    narrationTitle: 'AI 해설',
    generateNarration: '해설 생성',
    generatingNarration: '해설을 생성하는 중...',
    selectPlace: '먼저 관광지를 선택하세요.',
    invalidPoiId: '선택한 관광지 ID가 올바르지 않습니다.',
    narrationFailed: '해설을 생성할 수 없습니다.',
    narrationEmpty: 'AI Service에서 해설 텍스트를 반환하지 않았습니다.',
    audioTitle: '해설 듣기',
    generateAudio: '해설 읽어주기',
    generatingAudio: '해설을 읽는 중...',
    audioFailed: '브라우저에서 음성을 재생할 수 없습니다.',
    audioVoiceMissing: '이 기기에서 선택한 언어의 음성을 사용할 수 없습니다. 기기의 음성 설정을 확인하세요.',
    audioSpeedLabel: '읽기 속도',
    audioQuotaHint: '사용 가능한 음성은 기기에 따라 다릅니다.',
    detailDescriptionLabel: '설명',
    detailAudioKicker: '다국어 오디오 가이드',
    detailDistanceLabel: '현재 위치와의 거리',
    detailNoAddress: '이 장소의 주소 정보가 없습니다.',
  },
}


const POI_TRANSLATIONS = {
  1: {
    en: ['Independence Palace', 'Independence Palace, also known as Reunification Palace, is an important historical landmark associated with the events of April 30, 1975. The current building was constructed between 1962 and 1966 and designed by architect Ngo Viet Thu. Inside, visitors can explore offices, reception rooms, ceremonial halls, and an underground command bunker. Its modern design incorporates decorative elements inspired by Vietnamese culture. The site offers an opportunity to learn about the country’s history, architecture, and significant historical events.'],
    zh: ['统一宫', '统一宫又称独立宫，是一处重要的历史遗迹，与1975年4月30日发生的历史事件密切相关。现在的建筑建于1962年至1966年，由建筑师吴越墅设计。宫内设有办公区域、接待室、礼仪大厅以及地下指挥掩体。建筑采用现代设计，同时融入体现越南文化内涵的装饰元素。游客可以在这里了解越南历史、建筑特色以及国家发展中的重要事件。'],
    ja: ['統一会堂', '統一会堂は、旧独立宮とも呼ばれる重要な歴史的建造物で、1975年4月30日の出来事と深く関わっています。現在の建物は1962年から1966年にかけて建設され、建築家ゴ・ヴィエット・トゥが設計しました。館内には執務室、応接室、式典用のホール、地下の指揮施設などがあります。現代的な建築様式に、ベトナム文化を感じさせる装飾が取り入れられています。ここでは、ベトナムの歴史や建築、国の重要な出来事について学ぶことができます。'],
    ko: ['통일궁', '통일궁은 독립궁이라고도 불리며, 1975년 4월 30일의 역사적 사건과 관련된 중요한 유적지입니다. 현재의 건물은 1962년부터 1966년까지 건설되었으며 건축가 응오비엣투가 설계했습니다. 내부에는 사무실, 접견실, 의전 홀과 지하 지휘 시설이 있습니다. 현대적인 건축 양식에 베트남 문화를 반영한 장식 요소가 어우러져 있습니다. 방문객은 이곳에서 베트남의 역사와 건축, 국가의 중요한 역사적 사건을 살펴볼 수 있습니다.'],
  },
  2: {
    en: ['War Remnants Museum', 'The War Remnants Museum preserves and presents extensive materials about wars in Vietnam. Its exhibitions include photographs, documents, military artifacts, and accounts of how war affected people’s lives. Outdoors, visitors can see military equipment such as aircraft, tanks, and artillery. The galleries explore historical events, human suffering, and the importance of peace. The museum offers a meaningful historical and human perspective for both Vietnamese and international visitors.'],
    zh: ['战争遗迹博物馆', '战争遗迹博物馆收藏并展示了大量与越南战争历史有关的资料。展品包括照片、文献、军事遗物，以及战争对人们生活造成影响的相关记录。户外区域陈列着飞机、坦克和火炮等军事装备。馆内展览帮助游客了解战争历史、人们经历的苦难以及和平的重要意义。这里也是越南本地游客和国际游客认识历史与人文问题的重要场所。'],
    ja: ['戦争証跡博物館', '戦争証跡博物館は、ベトナムで起きた戦争に関する多くの資料を保存し、紹介しています。館内では写真、文書、軍事関連の展示物に加え、戦争が人々の生活に与えた影響について学べます。屋外には航空機、戦車、火砲などの軍事装備が展示されています。展示を通して、戦争の歴史や人々が受けた被害、平和の大切さを考えることができます。ベトナム国内外の来館者にとって、歴史と人間について学ぶ意義深い場所です。'],
    ko: ['전쟁박물관', '전쟁박물관은 베트남의 전쟁과 관련된 다양한 자료를 보존하고 전시합니다. 전시관에는 사진, 문서, 군사 유물과 전쟁이 사람들의 삶에 미친 영향을 보여 주는 기록이 있습니다. 야외에서는 항공기, 탱크, 포와 같은 군사 장비도 볼 수 있습니다. 전시를 통해 전쟁의 역사와 인명 피해, 평화의 중요성을 살펴볼 수 있습니다. 이곳은 베트남 국내외 방문객 모두에게 역사와 인간의 경험을 이해할 기회를 제공합니다.'],
  },
  3: {
    en: ['Saigon Central Post Office', 'Saigon Central Post Office is a notable architectural landmark built in the late nineteenth century. It features a classical façade, a high vaulted ceiling, and a spacious interior. Postal services are still available inside, alongside architectural details and historical maps. The building reflects the influence of European architecture on the development of Saigon. Visitors often come to learn about its history, take photographs, and experience this heritage site in the heart of the city.'],
    zh: ['西贡中央邮局', '西贡中央邮局是建于19世纪末的一座著名建筑。建筑拥有古典风格的外立面、高耸的拱形天花板和宽敞的内部空间。馆内仍设有邮政服务区域，并保留了建筑装饰细节和历史地图。这座建筑体现了欧洲建筑风格对西贡城市发展的影响。游客经常来此了解历史、拍照，并感受市中心的历史文化氛围。'],
    ja: ['サイゴン中央郵便局', 'サイゴン中央郵便局は、19世紀末に建てられた代表的な建築物です。古典的な外観、高いアーチ状の天井、広々とした内部空間が特徴です。館内では郵便サービスが利用でき、建築の細部や歴史的な地図も見ることができます。この建物は、サイゴンの都市形成におけるヨーロッパ建築の影響を伝えています。歴史を学んだり、写真を撮ったり、街の中心で文化遺産の雰囲気を感じたりするのに適した場所です。'],
    ko: ['사이공 중앙우체국', '사이공 중앙우체국은 19세기 말에 지어진 대표적인 건축물입니다. 고전적인 외관과 높은 아치형 천장, 넓은 실내 공간이 특징입니다. 내부에서는 우편 서비스를 이용할 수 있으며 건축 장식과 역사적인 지도도 살펴볼 수 있습니다. 이 건물은 사이공의 도시 발전 과정에서 유럽 건축 양식이 미친 영향을 보여 줍니다. 방문객은 이곳에서 역사를 알아보고 사진을 찍으며 도심 속 문화유산의 분위기를 경험할 수 있습니다.'],
  },
  4: {
    en: ['Saigon Notre-Dame Cathedral Basilica', 'Saigon Notre-Dame Cathedral Basilica is one of the city’s best-known religious landmarks. Built in the late nineteenth century, it is recognized for its European architectural style. Its distinctive red-brick exterior is complemented by detailed windows, decorative elements, and two tall bell towers. The square in front of the cathedral is a familiar meeting place and a popular spot for photographs. Together with nearby heritage buildings, the cathedral forms an important part of the architectural character of central Saigon.'],
    zh: ['西贡圣母圣殿主教座堂', '西贡圣母圣殿主教座堂是胡志明市著名的宗教建筑之一，建于19世纪末，以欧洲建筑风格闻名。建筑外墙采用醒目的红砖，并搭配精致的窗户、装饰细节和两座高耸的钟楼。教堂前的广场是当地居民熟悉的聚会空间，也是游客拍照的热门地点。这座教堂与周边的历史建筑共同构成了西贡市中心独特的建筑景观。'],
    ja: ['サイゴン・ノートルダム大聖堂', 'サイゴン・ノートルダム大聖堂は、ホーチミン市を代表する宗教建築の一つです。19世紀末に建てられ、ヨーロッパの建築様式が特徴となっています。赤レンガの外壁に加え、細かな意匠の窓や装飾、二つの高い鐘楼が目を引きます。正面の広場は地元の人々が集まる場所で、観光客の写真撮影スポットとしても親しまれています。周辺の歴史的建造物とともに、サイゴン中心部の印象的な建築景観を形作っています。'],
    ko: ['사이공 노트르담 대성당', '사이공 노트르담 대성당은 호찌민시를 대표하는 종교 건축물 중 하나입니다. 19세기 말에 지어졌으며 유럽 건축 양식이 특징입니다. 붉은 벽돌 외벽과 세밀한 창문 장식, 두 개의 높은 종탑이 눈길을 끕니다. 성당 앞 광장은 지역 주민들이 만나는 익숙한 공간이자 관광객들이 사진을 찍는 장소입니다. 주변의 역사적인 건물들과 함께 사이공 중심부의 독특한 건축 경관을 이루고 있습니다.'],
  },
  5: {
    en: ['Ben Thanh Market', 'Ben Thanh Market is one of the best-known traditional markets in Ho Chi Minh City. Its characteristic entrance features a clock tower, with multiple entrances leading to different areas inside. Vendors sell a wide range of products, including food, clothing, souvenirs, and local specialties. The market offers visitors a glimpse of everyday trading and local shopping culture. Its central location also makes it convenient to combine a visit with nearby streets, landmarks, and food stops.'],
    zh: ['滨城市场', '滨城市场是胡志明市最著名的传统市场之一。市场正门以标志性的钟楼为特色，多个入口通向内部不同区域。商贩出售食品、服装、纪念品和当地特产等多种商品。游客可以在这里观察当地的日常交易活动，了解城市的购物和商业文化。市场位于市中心，方便游客顺路参观周边街道、地标和美食店。'],
    ja: ['ベンタイン市場', 'ベンタイン市場は、ホーチミン市で最もよく知られた伝統市場の一つです。正面入口の時計塔が特徴で、複数の入口からさまざまな売り場へ入ることができます。市場では食品、衣類、お土産、地元の特産品など、多くの商品が販売されています。買い物の様子を見ながら、地元の日常生活や商業文化に触れられる場所です。中心部に位置しているため、周辺の通りや観光名所、飲食店と組み合わせて訪れるのにも便利です。'],
    ko: ['벤탄 시장', '벤탄 시장은 호찌민시에서 가장 잘 알려진 전통 시장 중 하나입니다. 정문에 있는 시계탑이 특징이며 여러 출입구를 통해 다양한 판매 구역으로 들어갈 수 있습니다. 시장에서는 식품, 의류, 기념품, 지역 특산품 등 여러 상품을 판매합니다. 방문객은 이곳에서 현지의 일상적인 상거래와 쇼핑 문화를 살펴볼 수 있습니다. 도심에 위치해 있어 주변 거리와 관광 명소, 음식점을 함께 둘러보기에도 편리합니다.'],
  },
  6: {
    en: ['Nguyen Hue Walking Street', 'Nguyen Hue Walking Street is a prominent public space in the city centre. Its wide pedestrian area and open square are surrounded by commercial buildings, hotels, and urban architecture. Community activities, performances, and special events are often held here. In the evening, many people come to walk, take photographs, and enjoy the lively city atmosphere. From here, visitors can easily continue to nearby attractions or walk toward the Saigon River.'],
    zh: ['阮惠步行街', '阮惠步行街是胡志明市中心一处重要的公共空间。宽阔的步行区域和开放式广场周围分布着商业建筑、酒店及城市景观。这里经常举办社区活动、表演和特别节庆活动。到了晚上，许多人会来散步、拍照并感受热闹的城市氛围。从步行街出发，游客还可以轻松前往附近景点，或继续走向西贡河畔。'],
    ja: ['グエンフエ歩行者通り', 'グエンフエ歩行者通りは、市の中心部にある代表的な公共空間です。広い歩行者エリアと開放的な広場の周りには、商業施設やホテル、都市建築が並んでいます。地域の催しやパフォーマンス、特別なイベントが行われることもあります。夕方から夜にかけては、散歩や写真撮影を楽しみ、街の活気を感じる人々でにぎわいます。ここから周辺の観光名所へ向かったり、サイゴン川の方向へ歩いたりすることもできます。'],
    ko: ['응우옌후에 보행자 거리', '응우옌후에 보행자 거리는 도심에 자리한 대표적인 공공 공간입니다. 넓은 보행로와 탁 트인 광장 주변에는 상업 시설, 호텔과 다양한 도시 건축물이 있습니다. 이곳에서는 지역 행사와 공연, 특별 이벤트가 열리기도 합니다. 저녁에는 산책하고 사진을 찍으며 활기찬 도시 분위기를 즐기는 사람들이 많이 모입니다. 여기에서 주변 관광 명소로 이동하거나 사이공강 방향으로 계속 걸어갈 수 있습니다.'],
  },
  7: {
    en: ['Bach Dang Wharf', 'Bach Dang Wharf is a riverside public area along the Saigon River near the city centre. Walking paths and open spaces offer views of the river and the urban landscape on both banks. Visitors can stroll, relax, take photographs, and watch boats moving along the water. The area is also close to Nguyen Hue Walking Street and several popular attractions. It is a convenient place to pause and enjoy the meeting of river scenery and modern city life.'],
    zh: ['白藤码头', '白藤码头位于胡志明市中心附近的西贡河沿岸，是一处公共滨水空间。步行道和开放区域让游客可以欣赏河流以及两岸的城市景观。游客可以在这里散步、休息、拍照，并观察水上的船只活动。这里距离阮惠步行街和多个热门景点也很近。对于想暂时放慢脚步、感受河景与现代城市生活交融的游客来说，这里是一个方便的停留地点。'],
    ja: ['バクダン埠頭', 'バクダン埠頭は、市の中心部に近いサイゴン川沿いの公共エリアです。遊歩道や開放的な空間から、川の景色と両岸の都市風景を眺めることができます。散歩や休憩、写真撮影のほか、川を行き交う船を観察するのにも適しています。グエンフエ歩行者通りや人気の観光名所にも近い場所です。川辺の風景と現代的な都市生活が交わる様子を楽しみながら、一息つけるスポットです。'],
    ko: ['박당 부두', '박당 부두는 도심 가까이 사이공강을 따라 자리한 공공 강변 공간입니다. 산책로와 열린 공간에서 강과 양쪽 강변의 도시 풍경을 감상할 수 있습니다. 방문객은 산책하거나 휴식을 취하고 사진을 찍으며 강을 오가는 배도 구경할 수 있습니다. 응우옌후에 보행자 거리와 여러 인기 관광 명소가 가까이에 있습니다. 강변 풍경과 현대적인 도시 생활이 어우러지는 모습을 느끼며 잠시 쉬어 가기 좋은 장소입니다.'],
  },
  8: {
    en: ['Ho Chi Minh City Opera House', 'Ho Chi Minh City Opera House is a historic venue for performing arts. Its French architectural style, elaborate façade, and artistic details make it a distinctive landmark. The building hosts performances such as concerts, dance, and stage productions. Its location near Dong Khoi Street makes it an important feature of the central city landscape. Visitors can admire the exterior or attend a performance when a suitable show is scheduled.'],
    zh: ['胡志明市大剧院', '胡志明市大剧院是一座历史悠久的表演艺术场所。建筑采用法国风格，外立面装饰精致，具有鲜明的艺术特色。这里举办音乐会、舞蹈和舞台剧等多种演出。剧院靠近同起街，是市中心城市景观中的重要地标。游客可以欣赏建筑外观，也可以根据演出安排选择观看合适的节目。'],
    ja: ['ホーチミン市民劇場', 'ホーチミン市民劇場は、長い歴史を持つ舞台芸術施設です。フランス風の建築様式や装飾が施された正面、芸術的な細部が特徴です。館内ではコンサート、ダンス、演劇などの公演が行われます。ドンコイ通りに近く、中心市街地を象徴する建物の一つです。外観を見学するほか、公演日程に合わせて舞台を鑑賞することもできます。'],
    ko: ['호찌민시 오페라하우스', '호찌민시 오페라하우스는 오랜 역사를 지닌 공연 예술 시설입니다. 프랑스풍 건축 양식과 정교한 정면 장식, 예술적인 세부 요소가 특징입니다. 이곳에서는 음악회와 무용, 무대 공연 등 다양한 행사가 열립니다. 동커이 거리와 가까워 도심 경관을 이루는 중요한 건축물입니다. 외관을 감상하거나 공연 일정에 맞춰 적합한 작품을 관람할 수 있습니다.'],
  },
  9: {
    en: ['Ho Chi Minh City Museum', 'Ho Chi Minh City Museum preserves materials about the city’s formation and development. It is housed in a classical building with distinctive corridors, staircases, and exhibition spaces. Displays cover urban life, culture, the economy, and different periods of local history. Through artifacts and documents, visitors can learn how Saigon developed into modern Ho Chi Minh City. It is a useful stop for anyone interested in local history, architecture, and culture.'],
    zh: ['胡志明市博物馆', '胡志明市博物馆收藏并介绍这座城市形成与发展的相关资料。博物馆位于一座古典风格建筑内，拥有特色走廊、楼梯和展览空间。展览主题涉及城市生活、文化、经济以及不同历史时期。通过文物和文献，游客可以了解西贡逐渐发展为今天胡志明市的过程。对于对地方历史、建筑和文化感兴趣的游客来说，这里值得一游。'],
    ja: ['ホーチミン市博物館', 'ホーチミン市博物館では、街の形成と発展に関する資料が保存・紹介されています。古典的な建物の中には、特徴的な廊下や階段、展示スペースがあります。展示テーマは都市生活、文化、経済、そして地域のさまざまな歴史的時代に及びます。資料や展示物を通して、サイゴンが現在のホーチミン市へと発展した過程を学ぶことができます。地域の歴史や建築、文化に興味がある人に適した場所です。'],
    ko: ['호찌민시 박물관', '호찌민시 박물관은 도시의 형성과 발전에 관한 자료를 보존하고 소개합니다. 고전적인 건물 안에는 독특한 복도와 계단, 전시 공간이 마련되어 있습니다. 전시는 도시 생활과 문화, 경제, 지역의 여러 역사적 시기를 다룹니다. 유물과 문서를 통해 사이공이 오늘날의 호찌민시로 발전해 온 과정을 알아볼 수 있습니다. 지역의 역사와 건축, 문화에 관심이 있는 방문객에게 알맞은 장소입니다.'],
  },
  10: {
    en: ['Thien Hau Temple', 'Thien Hau Temple is a well-known place of worship for the Chinese community in the Cho Lon area. It is dedicated to Thien Hau, a revered figure associated with seafaring and Chinese religious traditions. The temple features tiled roofs, detailed carvings, religious statues, and traditional ceremonial objects. Large coils of incense hanging overhead create one of its most recognizable sights. Visitors can learn about folk beliefs and cultural traditions preserved across generations.'],
    zh: ['天后宫', '天后宫是堤岸地区华人社区著名的信仰场所。这里供奉天后圣母，她受到许多航海者和华人群体的敬奉。寺庙内有瓦顶、精细雕刻、神像以及传统祭祀用品。悬挂在高处的大型盘香形成了这里颇具代表性的景象。游客可以借此了解民间信仰，以及世代相传的文化传统。'],
    ja: ['ティエンハウ廟', 'ティエンハウ廟は、チョロン地区の華人コミュニティでよく知られる信仰の場所です。航海に関わる人々や華人社会から敬われてきた天后聖母を祀っています。境内には瓦屋根、精巧な彫刻、祭神像、伝統的な祭具などがあります。頭上に吊るされた大きな渦巻き状の線香も、この廟を特徴づける景色です。訪れる人は、民間信仰や世代を超えて受け継がれてきた文化を学ぶことができます。'],
    ko: ['티엔하우 사원', '티엔하우 사원은 쩌런 지역의 화교 공동체에서 잘 알려진 신앙 공간입니다. 바다와 항해와 관련된 사람들과 중국계 공동체가 숭배하는 천후 성모를 모시고 있습니다. 사원에는 기와지붕과 정교한 조각, 신상, 전통 의례용 물품이 있습니다. 위쪽에 매달린 커다란 나선형 향도 이곳의 특징적인 풍경입니다. 방문객은 이곳에서 민간 신앙과 여러 세대에 걸쳐 이어져 온 문화적 전통을 살펴볼 수 있습니다.'],
  },
  11: {
    en: ['Binh Tay Market', 'Binh Tay Market is an important traditional market in the Cho Lon area and has long been associated with local commerce. Its distinctive design includes an inner courtyard, passageways, and stalls arranged by type of goods. The market supplies a wide variety of products, food, and ingredients for daily life and business. Its atmosphere reflects the area’s longstanding trading traditions. Visitors can explore traditional market architecture and learn more about commercial life in Cho Lon.'],
    zh: ['平西市场', '平西市场是堤岸地区重要的传统市场，长期以来与当地商业活动密切相关。市场建筑具有鲜明特色，设有内院、通道以及按商品类别排列的摊位。这里出售各种商品、食品和供日常生活及经营使用的原材料。市场的氛围体现了当地悠久的贸易传统。游客可以在这里了解传统市场建筑，并感受堤岸地区的商业生活。'],
    ja: ['ビンタイ市場', 'ビンタイ市場は、チョロン地区の重要な伝統市場で、長年にわたり地域の商業活動を支えてきました。建物には中庭や通路があり、商品ごとに売り場が配置されています。日用品から食品、商売に使われるさまざまな品まで、幅広い商品が扱われています。市場の雰囲気からは、この地域に根付いた長い商取引の伝統を感じられます。伝統市場の建築やチョロンの商業文化を知るのに適した場所です。'],
    ko: ['빈떠이 시장', '빈떠이 시장은 쩌런 지역의 중요한 전통 시장으로, 오랫동안 지역 상업 활동의 중심 역할을 해 왔습니다. 건물에는 안뜰과 통로가 있으며 상품 종류에 따라 판매 공간이 나뉘어 있습니다. 생활용품과 식품, 상업 활동에 필요한 다양한 물품을 판매합니다. 시장의 분위기에는 이 지역의 오랜 거래 전통이 담겨 있습니다. 방문객은 전통 시장 건축을 살펴보고 쩌런 지역의 상업 문화를 이해할 수 있습니다.'],
  },
  12: {
    en: ['Tao Dan Park', 'Tao Dan Park is a green public space surrounded by the busy urban environment of Ho Chi Minh City. Mature trees, lawns, and walking paths provide room for relaxation and exercise. In the morning, people often come to walk, stay active, and take part in community activities. The shade makes the park a pleasant resting point during a city visit. Visitors can combine a walk here with nearby landmarks, including Independence Palace and other central streets.'],
    zh: ['陶丹公园', '陶丹公园是胡志明市繁忙城区中的一片公共绿地。公园内有许多大树、草坪和步行小径，为休息和锻炼提供了空间。清晨，人们常来这里散步、健身和参加社区活动。树荫使公园成为游览城市途中舒适的休息地点。游客还可以将公园与统一宫及市中心其他街道和景点安排在同一行程中。'],
    ja: ['タオダン公園', 'タオダン公園は、ホーチミン市のにぎやかな市街地にある公共の緑地です。大きな木々や芝生、遊歩道があり、休憩や運動に利用されています。朝には散歩や健康づくり、地域の活動を楽しむ人々の姿が見られます。木陰が多く、街を観光する途中に一息つく場所としても適しています。統一会堂や中心部の通りなど、近隣の名所と組み合わせて訪れることもできます。'],
    ko: ['따오단 공원', '따오단 공원은 호찌민시의 번화한 도심 속에 자리한 공공 녹지 공간입니다. 큰 나무와 잔디밭, 산책로가 있어 휴식과 운동을 즐기기 좋습니다. 아침에는 산책과 건강 관리를 하거나 지역 활동에 참여하는 사람들을 볼 수 있습니다. 나무 그늘이 많아 도시를 여행하는 도중 편하게 쉬어 가기에도 알맞습니다. 통일궁과 도심의 다른 거리 및 관광 명소를 함께 방문하는 일정에 포함할 수 있습니다.'],
  },
  13: {
    en: ['Saigon Zoo and Botanical Gardens', 'Saigon Zoo and Botanical Gardens is one of Vietnam’s oldest institutions dedicated to animals and plants. Its grounds include green spaces, animal-care areas, and a diverse collection of plants. The site is suitable for families, students, and people interested in nature. Visitors can learn about different animal species, their habitats, and the importance of biodiversity conservation. The spacious greenery also offers places to walk and rest while exploring the city.'],
    zh: ['西贡动植物园', '西贡动植物园是越南历史悠久的动植物保护与展示机构之一。园区内有大片绿地、动物照护区域以及多样的植物收藏。这里适合家庭、学生以及对自然感兴趣的游客。参观过程中，游客可以了解不同动物、它们的栖息环境以及保护生物多样性的重要性。宽敞的绿化空间也为城市游览提供了散步和休息的场所。'],
    ja: ['サイゴン動植物園', 'サイゴン動植物園は、ベトナムで長い歴史を持つ動植物関連施設の一つです。園内には緑豊かな空間や動物の飼育エリア、多様な植物のコレクションがあります。家族連れや学生、自然に関心のある人に適した観光スポットです。さまざまな動物やその生息環境、生物多様性を守ることの重要性について学べます。広々とした緑の空間は、街歩きの途中で散策や休憩をする場所にもなります。'],
    ko: ['사이공 동식물원', '사이공 동식물원은 베트남에서 오랜 역사를 지닌 동식물 관련 시설 중 하나입니다. 넓은 녹지와 동물 관리 구역, 다양한 식물 컬렉션을 갖추고 있습니다. 가족과 학생, 자연에 관심이 있는 사람들에게 적합한 관광지입니다. 방문객은 여러 동물과 서식 환경, 생물 다양성 보전의 중요성을 배울 수 있습니다. 넓은 녹지 공간은 도시를 둘러보는 동안 산책하고 휴식하기에도 좋습니다.'],
  },
  14: {
    en: ['Landmark 81', 'Landmark 81 is a prominent skyscraper in the Vinhomes Central Park urban area beside the Saigon River. Its modern design combines shopping, services, dining, and entertainment facilities. The tower contributes to the distinctive skyline of contemporary Ho Chi Minh City. Visitors can explore the available retail and dining areas and use visitor attractions according to their opening arrangements. The surrounding riverside park also offers space for walking and enjoying city views.'],
    zh: ['Landmark 81', 'Landmark 81是位于西贡河畔Vinhomes Central Park城市区域的一座标志性高楼。现代化建筑内设有购物、服务、餐饮和娱乐设施。它构成了当代胡志明市独特天际线的重要部分。游客可以根据开放安排前往商店、餐饮区域和可参观的设施。周边的河畔公园也适合散步，并欣赏城市景观。'],
    ja: ['ランドマーク81', 'ランドマーク81は、サイゴン川沿いのビンホームズ・セントラルパーク地区にある代表的な高層ビルです。現代的な建物には、ショッピング、各種サービス、飲食、娯楽の施設が集まっています。ホーチミン市の現代的なスカイラインを特徴づける建築物の一つです。営業時間や利用条件に応じて、店舗や飲食エリア、見学可能な施設を楽しめます。周辺の川沿いの公園では、散歩をしながら都市の景色を眺めることもできます。'],
    ko: ['랜드마크 81', '랜드마크 81은 사이공강 옆 빈홈즈 센트럴파크 도시 구역에 자리한 대표적인 초고층 건물입니다. 현대적인 건물 안에는 쇼핑과 서비스, 음식점, 엔터테인먼트 시설이 마련되어 있습니다. 호찌민시의 현대적인 스카이라인을 형성하는 중요한 건축물 중 하나입니다. 운영 시간과 이용 조건에 맞춰 상점과 식음료 공간, 관람 시설을 이용할 수 있습니다. 주변 강변 공원은 산책하며 도시 풍경을 감상하기에도 좋습니다.'],
  },
  15: {
    en: ['Cu Chi Tunnels', 'The Cu Chi Tunnels are a historic underground network associated with the resistance in the Saigon–Gia Dinh region. The tunnels were developed over several periods and served purposes including shelter, communication, daily living, and military operations. The historical site now presents tunnel sections and exhibits that recreate aspects of wartime life. Visitors can learn about living conditions underground and how the tunnel network was organized. The site provides insight into a distinctive and important period of Vietnamese history.'],
    zh: ['古芝地道', '古芝地道是与西贡—嘉定地区抗战历史密切相关的地下通道系统。这套地道经过多个阶段逐步发展，曾用于隐蔽、联络、日常生活和军事活动。如今，历史遗址向游客展示部分地道，并设有反映战时生活的展览。参观者可以了解地下生活条件以及地道系统的组织方式。这里帮助人们认识越南历史上一段独特而重要的时期。'],
    ja: ['クチトンネル', 'クチトンネルは、サイゴン・ザーディン地域の抵抗活動と関わる歴史的な地下通路網です。トンネルは複数の時期にわたって整備され、避難、連絡、生活、軍事活動などに利用されました。現在の史跡では、トンネルの一部や戦時中の生活を再現する展示を見ることができます。地下での生活環境や、トンネル網がどのように構成されていたかを学べます。ベトナムの歴史における重要な時代を理解するうえで意義のある場所です。'],
    ko: ['꾸찌 터널', '꾸찌 터널은 사이공·자딘 지역의 항쟁 역사와 관련된 지하 터널망입니다. 이 터널은 여러 시기에 걸쳐 확장되었으며 은신과 연락, 일상생활, 군사 활동 등에 사용되었습니다. 현재 유적지에서는 터널 일부와 전시를 통해 전쟁 당시의 생활 모습을 살펴볼 수 있습니다. 방문객은 지하 생활 환경과 터널망의 구성 방식을 알아볼 수 있습니다. 이곳은 베트남 역사의 중요하고 독특한 시기를 이해하는 데 도움이 되는 장소입니다.'],
  },
}

const POI_ADDRESS_TRANSLATIONS = {
  en: ['Ho Chi Minh City, Vietnam', 'Cu Chi, Ho Chi Minh City, Vietnam'],
  zh: ['越南胡志明市', '越南胡志明市古芝县'],
  ja: ['ベトナム・ホーチミン市', 'ベトナム・ホーチミン市クチ県'],
  ko: ['베트남 호찌민시', '베트남 호찌민시 꾸찌현'],
}


function interpolate(template, values = {}) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function readField(item, keys) {
  for (const key of keys) {
    const foundKey = Object.keys(item || {}).find(
      (currentKey) => currentKey.toLowerCase() === key.toLowerCase(),
    )
    if (foundKey && item[foundKey] !== null && item[foundKey] !== undefined) {
      const value = item[foundKey]
      if ((typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '') {
        return String(value)
      }
    }
  }
  return ''
}

function normalizePlace(item, index, t) {
  return {
    id: readField(item, ['id', 'poiId', 'POIId', 'maPOI', 'maDiaDiem']) || String(index + 1),
    name: readField(item, ['name', 'poiName', 'POIName', 'tenPOI', 'tenDiaDiem', 'title']) || `Place ${index + 1}`,
    category: readField(item, ['category', 'categoryName', 'type', 'poiType', 'loaiDiaDiem', 'tenLoai']) || '',
    description: readField(item, ['description', 'shortDescription', 'content', 'moTa', 'gioiThieu']) || '',
    address: readField(item, ['address', 'location', 'diaChi', 'viTri']) || '',
    image: readField(item, ['imageUrl', 'image', 'photoUrl', 'thumbnailUrl', 'hinhAnh']) || '',
    raw: item,
  }
}

function extractPlaces(data) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  for (const key of ['data', 'items', 'results', 'pois', 'records']) {
    const foundKey = Object.keys(data).find((currentKey) => currentKey.toLowerCase() === key)
    if (foundKey && Array.isArray(data[foundKey])) return data[foundKey]
  }
  return []
}


function localizePlace(place, language) {
  // Luôn đọc dữ liệu gốc để đổi ngôn ngữ qua lại không bị mất tiếng Việt.
  const raw = place.raw || place

  const sourceName =
    readField(raw, [
      'name', 'poiName', 'POIName', 'tenPOI', 'tenDiaDiem', 'title',
    ]) || place.sourceName || place.name || ''

  const sourceDescription =
    readField(raw, [
      'description', 'shortDescription', 'content', 'moTa', 'gioiThieu',
    ]) || place.sourceDescription || place.description || ''

  const sourceAddress =
    readField(raw, ['address', 'location', 'diaChi', 'viTri']) ||
    place.sourceAddress ||
    place.address ||
    ''

  const translated = POI_TRANSLATIONS[String(place.id)]?.[language]

  let address = sourceAddress

  if (language !== 'vi' && sourceAddress) {
    const addressOptions = POI_ADDRESS_TRANSLATIONS[language]
    if (addressOptions) {
      address = String(place.id) === '15'
        ? addressOptions[1]
        : addressOptions[0]
    }
  }

  return {
    ...place,
    sourceName,
    sourceDescription,
    sourceAddress,
    name: language === 'vi' ? sourceName : translated?.[0] || sourceName,
    description:
      language === 'vi'
        ? sourceDescription
        : translated?.[1] || sourceDescription,
    address: language === 'vi' ? sourceAddress : address,
  }
}


function TourismHome() {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('tourismLanguage')
      return translations[saved] ? saved : 'vi'
    } catch {
      return 'vi'
    }
  })

  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [narrationText, setNarrationText] = useState('')
  const [narrationLoading, setNarrationLoading] = useState(false)
  const [narrationError, setNarrationError] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioSpeed, setAudioSpeed] = useState('1')

  const speechRequestRef = useRef(0)
  const narrationRequestRef = useRef(0)
  const [showAccess, setShowAccess] = useState(false)
  const [userPosition, setUserPosition] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('visitSessionId') || '')
  const sessionIdRef = useRef(sessionStorage.getItem('visitSessionId') || '')
  const [sessionMessage, setSessionMessage] = useState('')
  const [sessionBusy, setSessionBusy] = useState(false)
  const sessionBusyRef = useRef(false)
  const visitStartRequestedRef = useRef(false)

  const t = translations[language] || translations.vi
  const displaySelectedPlace = selectedPlace
  ? localizePlace(selectedPlace, language)
  : null

  function changeLanguage(nextLanguage) {
    if (!translations[nextLanguage] || nextLanguage === language) return

    // Vô hiệu hóa các yêu cầu đang chạy bằng ngôn ngữ cũ.
    narrationRequestRef.current += 1
    speechRequestRef.current += 1

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setLanguage(nextLanguage)

    // Không sử dụng lại lời thuyết minh của ngôn ngữ trước.
    setNarrationText('')
    setNarrationLoading(false)
    setNarrationError('')
    setAudioLoading(false)
    setAudioError('')
    setAudioUrl('')

    try {
      localStorage.setItem('tourismLanguage', nextLanguage)
    } catch {
      // Vẫn đổi được ngôn ngữ nếu bộ nhớ trình duyệt không khả dụng.
    }
  }


  async function loadPlaces() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const normalized = extractPlaces(data).map((item, index) => normalizePlace(item, index, t))
      setPlaces(normalized)

      const poiFromUrl = new URLSearchParams(window.location.search).get('poi')
      setSelectedPlace((current) => {
        if (!normalized.length) return null
        if (poiFromUrl) {
          return normalized.find((place) => String(place.id) === String(poiFromUrl)) || normalized[0]
        }
        if (current) {
          return normalized.find((place) => String(place.id) === String(current.id)) || normalized[0]
        }
        return normalized[0]
      })
    } catch (err) {
      console.error('Could not load POIs:', err)
      setError(`${t.error} (${err instanceof Error ? err.message : 'unknown error'})`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlaces()
    beginVisit()
    // Initialize POIs and visit tracking once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sessionId) return undefined
    let isSending = false

    async function sendHeartbeat() {
      if (isSending) return
      isSending = true
      try {
        const response = await fetch(`/api/VisitSessions/${encodeURIComponent(sessionId)}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || `HTTP ${response.status}`)
        }
      } catch (err) {
        console.error('Could not update visit heartbeat:', err)
      } finally {
        isSending = false
      }
    }

    sendHeartbeat()
    const heartbeatTimer = setInterval(sendHeartbeat, 60 * 1000)
    return () => clearInterval(heartbeatTimer)
  }, [sessionId])


  const filteredPlaces = useMemo(() => {
    const localizedPlaces = places.map((place) =>
      localizePlace(place, language),
    )

    const keyword = search.trim().toLocaleLowerCase()

    if (!keyword) return localizedPlaces

    return localizedPlaces.filter((place) =>
      `${place.name} ${place.category} ${place.description} ${place.address}`
        .toLocaleLowerCase()
        .includes(keyword),
    )
  }, [places, search, language])


  function selectPlace(place) {
    narrationRequestRef.current += 1
    speechRequestRef.current += 1

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setSelectedPlace(place)
    setNarrationText('')
    setNarrationLoading(false)
    setNarrationError('')
    setAudioLoading(false)
    setAudioUrl('')
    setAudioError('')

    document.getElementById('guide')?.scrollIntoView({
      behavior: 'smooth',
    })
  }



  async function generateNarration() {
    if (!selectedPlace) {
      setNarrationError(t.selectPlace)
      return
    }

    const poiId = Number(selectedPlace.id)
    if (!Number.isInteger(poiId) || poiId <= 0) {
      setNarrationError(t.invalidPoiId)
      return
    }

    const requestId = ++narrationRequestRef.current
    speechRequestRef.current += 1

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setAudioLoading(false)
    setAudioError('')
    setAudioUrl('')
    setNarrationLoading(true)
    setNarrationError('')
    setNarrationText('')

    try {
      const response = await fetch('/api/ai/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ poiId, language }),
      })

      const data = await response.json().catch(() => ({}))

      // Bỏ qua phản hồi thuộc ngôn ngữ đã bị thay đổi.
      if (requestId !== narrationRequestRef.current) return

      if (!response.ok || data.success === false) {
        throw new Error(data.message || t.narrationFailed)
      }

      if (typeof data.narration !== 'string' || !data.narration.trim()) {
        throw new Error(t.narrationEmpty)
      }

      setNarrationText(data.narration.trim())
    } catch (err) {
      if (requestId === narrationRequestRef.current) {
        console.error('Failed to generate narration:', err)
        setNarrationError(
          err instanceof Error ? err.message : t.narrationFailed,
        )
      }
    } finally {
      if (requestId === narrationRequestRef.current) {
        setNarrationLoading(false)
      }
    }
  }



  async function generateAudio() {
    if (!selectedPlace) {
      setAudioError(t.selectPlace)
      return
    }

    const poiId = Number(selectedPlace.id)
    if (!Number.isInteger(poiId) || poiId <= 0) {
      setAudioError(t.invalidPoiId)
      return
    }

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      setAudioError(t.audioFailed)
      return
    }

    const requestId = ++speechRequestRef.current
    const narrationRequestId = ++narrationRequestRef.current

    setAudioLoading(true)
    setAudioError('')
    setAudioUrl('')

    const synth = window.speechSynthesis

    try {
      let textToSpeak = narrationText.trim()

      // Nếu chưa có văn bản thì tạo bằng AI theo ngôn ngữ đang chọn.
      if (!textToSpeak) {
        const response = await fetch('/api/ai/narration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ poiId, language }),
        })

        const data = await response.json().catch(() => ({}))

        if (
          requestId !== speechRequestRef.current ||
          narrationRequestId !== narrationRequestRef.current
        ) {
          return
        }

        if (!response.ok || data.success === false) {
          throw new Error(data.message || t.narrationFailed)
        }

        if (typeof data.narration !== 'string' || !data.narration.trim()) {
          throw new Error(t.narrationEmpty)
        }

        textToSpeak = data.narration.trim()
        setNarrationText(textToSpeak)
      }

      const localeByLanguage = {
        vi: 'vi-VN',
        en: 'en-US',
        zh: 'zh-CN',
        ja: 'ja-JP',
        ko: 'ko-KR',
      }

      const locale = localeByLanguage[language] || 'vi-VN'
      const languagePrefix = locale.split('-')[0].toLowerCase()

      // Một số trình duyệt chỉ trả về danh sách voice sau khi tải xong.
      const voices = await new Promise((resolve) => {
        const existingVoices = synth.getVoices()

        if (existingVoices.length) {
          resolve(existingVoices)
          return
        }

        let settled = false
        let timeoutId

        function finish(voiceList) {
          if (settled) return
          settled = true
          window.clearTimeout(timeoutId)
          synth.removeEventListener('voiceschanged', handleVoicesChanged)
          resolve(voiceList)
        }

        function handleVoicesChanged() {
          const available = synth.getVoices()
          if (available.length) finish(available)
        }

        synth.addEventListener('voiceschanged', handleVoicesChanged)
        timeoutId = window.setTimeout(
          () => finish(synth.getVoices()),
          1500,
        )
      })

      if (
        requestId !== speechRequestRef.current ||
        narrationRequestId !== narrationRequestRef.current
      ) {
        return
      }

      // Chỉ chọn voice cùng ngôn ngữ, tránh dùng nhầm giọng tiếng Anh.
      const selectedVoice =
        voices.find(
          (voice) => voice.lang.toLowerCase() === locale.toLowerCase(),
        ) ||
        voices.find(
          (voice) =>
            voice.lang.toLowerCase().split('-')[0] === languagePrefix,
        )

      if (!selectedVoice) {
        setAudioError(t.audioVoiceMissing)
        setAudioLoading(false)
        return
      }

      const utterance = new window.SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = locale
      utterance.voice = selectedVoice
      utterance.rate = Number(audioSpeed)
      utterance.pitch = 1

      utterance.onend = () => {
        if (requestId === speechRequestRef.current) {
          setAudioLoading(false)
        }
      }

      utterance.onerror = (event) => {
        if (requestId !== speechRequestRef.current) return

        setAudioLoading(false)

        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setAudioError(t.audioFailed)
        }
      }

      // Hủy lời đọc trước, sau đó đọc nội dung mới.
      synth.cancel()
      synth.speak(utterance)
    } catch (err) {
      if (requestId === speechRequestRef.current) {
        console.error('Failed to read narration:', err)
        setAudioError(
          err instanceof Error ? err.message : t.audioFailed,
        )
        setAudioLoading(false)
      }
    }
  }


  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage(t.gpsUnsupported)
      return
    }

    setLocationMessage(t.gpsRequesting)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserPosition(coords)
        setLocationMessage(interpolate(t.gpsPosition, {
          lat: coords.lat.toFixed(5),
          lng: coords.lng.toFixed(5),
        }))
      },
      (err) => {
        const messages = {
          1: t.gpsPermissionDenied,
          2: t.gpsUnknown,
          3: t.gpsTimeout,
        }
        setLocationMessage(messages[err.code] || t.gpsUnavailable)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  const qrUrl = `${window.location.origin}${window.location.pathname}#guide`

  async function startVisitSession() {
    if (sessionBusyRef.current) return null
    if (sessionIdRef.current) return sessionIdRef.current

    sessionBusyRef.current = true
    setSessionBusy(true)
    setSessionMessage(t.sessionStarting)

    try {
      const response = await fetch('/api/VisitSessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationConsent: false, latitude: null, longitude: null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)

      const id = data.id || data.sessionId
      if (!id) throw new Error('No visit session ID was returned.')

      sessionIdRef.current = String(id)
      setSessionId(String(id))
      sessionStorage.setItem('visitSessionId', String(id))
      setSessionMessage(t.sessionPendingGps)
      return String(id)
    } catch (err) {
      console.error('Could not start visit session:', err)
      setSessionMessage(`${t.sessionStartFailed}: ${err instanceof Error ? err.message : ''}`)
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

      setSessionMessage(t.sessionGpsUpdated)
      const poiId = data.poiId ?? data.POIId ?? data.poi?.id ?? data.poi?.Id
      if (poiId != null) {
        const match = places.find((place) => String(place.id) === String(poiId))
        if (match) setSelectedPlace(match)
      }
    } catch (err) {
      console.error('Could not update visit location:', err)
      setSessionMessage(`${t.sessionGpsUpdateFailed}: ${err instanceof Error ? err.message : ''}`)
    }
  }

  async function beginVisit() {
    if (visitStartRequestedRef.current) return
    visitStartRequestedRef.current = true

    const id = await startVisitSession()
    if (!id) {
      visitStartRequestedRef.current = false
      return
    }

    if (!navigator.geolocation) {
      setLocationMessage(t.gpsUnsupported)
      setSessionMessage(t.gpsAnonymous)
      return
    }

    setLocationMessage(t.sessionGpsRequest)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserPosition(coords)
        setLocationMessage(interpolate(t.gpsPosition, {
          lat: coords.lat.toFixed(5),
          lng: coords.lng.toFixed(5),
        }))
        await updateVisitLocation(id, coords)
      },
      () => {
        setLocationMessage(t.sessionGpsDenied)
        setSessionMessage(t.sessionNoGps)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  async function endVisitSession() {
    if (!sessionId || sessionBusyRef.current) return
    sessionBusyRef.current = true
    setSessionBusy(true)
    setSessionMessage(t.sessionEnding)

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
      setSessionMessage(
        data.durationSeconds != null
          ? `${t.sessionEnded} · ${interpolate(t.duration, { seconds: Math.max(0, Math.round(data.durationSeconds)) })}`
          : t.sessionEnded,
      )
    } catch (err) {
      console.error('Could not end visit session:', err)
      setSessionMessage(`${t.sessionEndFailed}: ${err instanceof Error ? err.message : ''}`)
    } finally {
      sessionBusyRef.current = false
      setSessionBusy(false)
    }
  }

  useEffect(() => {
    if (!sessionId) return undefined

    const handlePageHide = (event) => {
      if (event.persisted) return

      const url = `/api/VisitSessions/${encodeURIComponent(sessionId)}/end`
      const data = new Blob([JSON.stringify({ reason: 'PageExit' })], {
        type: 'application/json',
      })
      const sent = navigator.sendBeacon(url, data)

      if (!sent) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'PageExit' }),
          keepalive: true,
        }).catch((err) => console.error('Could not end visit on page exit:', err))
      }

      sessionStorage.removeItem('visitSessionId')
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [sessionId])

  const mapQuery = userPosition
    ? `${userPosition.lat},${userPosition.lng}`
    : displaySelectedPlace?.address ||
      displaySelectedPlace?.name ||
      'Vietnam tourist attractions'

  return (
    <div className="app-shell">
      <div className="topbar">{t.top}</div>

      <header className="navbar">
        <a className="brand" href="#home" aria-label={t.qrSharedTitle}>
          <span className="brand-mark">L</span>
          <span className="brand-copy">
            <span className="brand-name">{t.brandTitle}</span>
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
            onChange={(event) => changeLanguage(event.target.value)}
          >
            {LANGUAGE_OPTIONS.map(([code, label]) => (
              <option value={code} key={code}>{label}</option>
            ))}
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
              <span>{t.discover}</span>
              <span className="hero-side-rule" />
              <span>{t.multilingual}</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>{t.qrSharedTitle}</span>
            <span>{t.motto}</span>
          </div>
        </section>

        <section className="quick-tools-section" aria-label={t.toolsTitle}>
          <div className="container quick-tools-grid">
            <article className="quick-tool-card">
              <div className="quick-tool-icon" aria-hidden="true">GPS</div>
              <div className="quick-tool-copy">
                <h2>{t.gpsTitle}</h2>
                <p>{t.gpsDescription}</p>
                <button className="button button-primary" type="button" onClick={getCurrentLocation}>
                  {t.getLocation}
                </button>
                {locationMessage && (
                  <p className="tool-feedback" role="status">{locationMessage}</p>
                )}
              </div>
            </article>

            <article className="quick-tool-card qr-display-card">
              <div className="quick-tool-icon" aria-hidden="true">QR</div>
              <div className="quick-tool-copy">
                <h2>{t.qrTitle}</h2>
                <p>{t.qrDescription}</p>
                <div className="qr-code-wrap">
                  <QRCodeSVG value={qrUrl} size={176} level="M" includeMargin />
                  <strong>{t.qrSharedTitle}</strong>
                  <small>{t.qrScanHint}</small>
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
                <p className="section-description">{t.mapDescription}</p>
              </div>
              <a
                className="button button-outline"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t.openMap}
              </a>
            </div>

            <div className="map-frame-wrap">
              <iframe
                title={t.mapTitle}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {userPosition && selectedPlace?.address && (
              <a
                className="map-direction-link"
                href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${encodeURIComponent(selectedPlace.address)}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
              >
                {t.directions}
              </a>
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
              <span className="status-source">{t.poiSource}</span>
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
                  <button
                    className="clear-search"
                    onClick={() => setSearch('')}
                    type="button"
                    aria-label={t.clearSearch}
                  >
                    ×
                  </button>
                )}
              </label>

              <button className="button button-outline" onClick={loadPlaces} disabled={loading}>
                {loading ? t.refreshing : t.retry}
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
                          <span className="place-art-title">{place.name}</span>
                          <span className="place-art-caption">{t.qrSharedTitle}</span>
                        </div>
                      )}
                      <span className="place-index">{String(index + 1).padStart(2, '0')}</span>
                    </div>

                    <div className="place-card-body">
                      <div className="place-category">{place.category || t.qrSharedTitle}</div>
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

              <div
                className="visit-session-panel"
                style={{
                  marginTop: 20,
                  padding: 18,
                  border: '1px solid #d8e2dc',
                  borderRadius: 14,
                  background: '#fff',
                }}
              >
                <h3 style={{ marginTop: 0 }}>{t.sessionTitle}</h3>
                <p>{t.sessionDescription}</p>
                {sessionId ? (
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={endVisitSession}
                    disabled={sessionBusy}
                  >
                    {sessionBusy ? t.processing : t.endVisit}
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={beginVisit}
                    disabled={sessionBusy}
                  >
                    {sessionBusy ? t.processing : t.startVisit}
                  </button>
                )}
                {sessionMessage && (
                  <p role="status" style={{ marginBottom: 0 }}>{sessionMessage}</p>
                )}
              </div>
            </div>
            <div className="detail-panel detail-panel-vertical">
              {/* 1. Tiêu đề địa điểm */}
              <div className="detail-content">
                <div className="section-kicker">{t.detailTitle}</div>
                <h3>{displaySelectedPlace?.name || t.choose}</h3>
              </div>

              {/* 2. Ảnh địa điểm */}
              <div className="detail-visual">
                {displaySelectedPlace?.image ? (
                  <img
                    src={displaySelectedPlace.image}
                    alt={displaySelectedPlace.name}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                      const message =
                        event.currentTarget.parentElement?.querySelector(
                          '.image-error-message',
                        )
                      if (message) message.hidden = false
                    }}
                  />
                ) : (
                  <div className="detail-art">
                    <span className="detail-art-overline">{t.selected}</span>
                    <span className="detail-art-title">
                      {displaySelectedPlace?.name || t.detailTitle}
                    </span>
                    <span className="detail-art-bottom">{t.qrSharedTitle}</span>
                  </div>
                )}

                {displaySelectedPlace?.image && (
                  <div className="image-error-message" hidden>
                    {t.noImage}
                  </div>
                )}
              </div>

              {/* 3. Nội dung và chức năng hiện tại */}
              <div className="detail-content">
                {displaySelectedPlace ? (
                  <>
                    <div className="detail-description">
                      <h4>{t.detailDescriptionLabel}</h4>
                      <p>{displaySelectedPlace.description || t.noDescription}</p>
                    </div>

                    {/* Giữ nguyên chức năng tạo thuyết minh và đọc thành tiếng */}
                    <div className="narration-panel audio-guide-panel">
                      <div className="audio-guide-heading">
                        <div>
                          <span className="section-kicker">{t.detailAudioKicker}</span>
                          <h4>{t.narrationTitle}</h4>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={generateNarration}
                          disabled={narrationLoading || !selectedPlace}
                        >
                          {narrationLoading
                            ? t.generatingNarration
                            : t.generateNarration}
                        </button>

                        <button
                          className="button button-outline"
                          type="button"
                          onClick={generateAudio}
                          disabled={audioLoading || !selectedPlace}
                        >
                          {audioLoading ? t.generatingAudio : t.generateAudio}
                        </button>
                      </div>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          marginTop: 14,
                          color: 'var(--green-dark)',
                          fontSize: 13,
                        }}
                      >
                        {t.audioSpeedLabel}
                        <select
                          value={audioSpeed}
                          onChange={(event) => setAudioSpeed(event.target.value)}
                          disabled={audioLoading}
                          aria-label={t.audioSpeedLabel}
                          style={{
                            padding: '7px 10px',
                            border: '1px solid #d5e0d8',
                            borderRadius: 8,
                            background: '#fff',
                            color: 'var(--green-dark)',
                          }}
                        >
                          <option value="0.75">0.75×</option>
                          <option value="1">1×</option>
                          <option value="1.25">1.25×</option>
                          <option value="1.5">1.5×</option>
                        </select>
                      </label>

                      {narrationError && (
                        <p role="alert" style={{ color: '#b42318' }}>
                          {narrationError}
                        </p>
                      )}

                      {narrationText && (
                        <div
                          aria-live="polite"
                          style={{ marginTop: 14, lineHeight: 1.8 }}
                        >
                          <p>{narrationText}</p>
                        </div>
                      )}

                      {audioError && (
                        <div
                          role="alert"
                          style={{ color: '#b42318', marginTop: 12 }}
                        >
                          <p>{audioError}</p>
                          <small>{t.audioQuotaHint}</small>
                        </div>
                      )}

                      {audioUrl && (
                        <div style={{ marginTop: 14 }}>
                          <p>{t.audioTitle}</p>
                          <audio
                            controls
                            src={audioUrl}
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Thông tin địa điểm */}
                    {displaySelectedPlace.address && (
                      <div className="detail-field">
                        <span>{t.address}</span>
                        <strong>{selectedPlace.address}</strong>
                      </div>
                    )}

                    <div className="detail-field">
                      <span>{t.id}</span>
                      <strong>{displaySelectedPlace.id}</strong>
                    </div>

                    {displaySelectedPlace.category && (
                      <div className="detail-field">
                        <span>{t.category}</span>
                        <strong>{selectedPlace.category}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="detail-empty">
                    {t.choose}
                  </div>
                )}
              </div>

              {/* 4. Nút điều hướng */}
              <div className="detail-footer">
                <a className="button button-primary detail-button" href="#places">
                  {t.placesTitle}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container">
            <div className="about-intro">
              <div className="section-kicker">{t.aboutEyebrow}</div>
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
                <p>{t.languageList}</p>
              </div>
              <div className="language-options">
                {LANGUAGE_OPTIONS.map(([code, label]) => (
                  <button
                    type="button"
                    key={code}
                    className={`language-option ${language === code ? 'active' : ''}`}
                    aria-pressed={language === code}
                    onClick={() => changeLanguage(code)}
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
          <a className="footer-brand" href="#home">
            {t.brandTitle} <span>{t.brandSubtitle}</span>
          </a>
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
          <div
            className="access-modal qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label={t.close}
              onClick={() => setShowAccess(false)}
            >
              ×
            </button>
            <div className="section-kicker">{t.qrSharedTitle}</div>
            <h2 id="qr-modal-title">{t.qrModalTitle}</h2>
            <div className="qr-code-wrap qr-modal-code">
              <QRCodeSVG value={qrUrl} size={240} level="M" includeMargin />
              <strong>{t.qrSharedTitle}</strong>
              <p>{t.qrInstructions}</p>
              <small className="qr-url-text">{qrUrl}</small>
            </div>
            <button
              className="button button-primary modal-submit"
              type="button"
              onClick={() => setShowAccess(false)}
            >
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
