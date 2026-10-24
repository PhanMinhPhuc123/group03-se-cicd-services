# Thuyết minh Đa ngôn ngữ - Frontend

Frontend được xây dựng bằng React 19 và Vite.

## Chạy trên máy tính

```powershell
npm install
npm run dev
```

Mặc định Vite dùng cổng 5173. Cấu hình proxy hiện tại chuyển các request `/api` tới `http://localhost:5252` (POI Service). Nếu POI Service của nhóm chạy ở cổng khác, sửa `vite.config.js` cho đúng.

## Các chức năng giao diện

- Danh sách POI lấy từ `GET /api/POIs`.
- Tìm kiếm và xem thông tin POI.
- Mở Google Maps cho địa điểm đang chọn hoặc vị trí GPS.
- Xin quyền GPS qua trình duyệt.
- Quét QR bằng camera trên các trình duyệt hỗ trợ `BarcodeDetector`.

## Kiểm thử trên điện thoại

Camera và GPS thường yêu cầu HTTPS hoặc `localhost`. Nếu mở frontend từ điện thoại bằng địa chỉ IP LAN qua HTTP, trình duyệt có thể chặn camera/GPS. Dùng HTTPS trong môi trường triển khai hoặc môi trường phát triển có HTTPS.

## Lưu ý về Google Maps

Bản đồ nhúng và liên kết tìm đường hiện sử dụng URL Google Maps, không nhúng Google Maps JavaScript SDK nên không cần API key cho phần giao diện hiện tại. Nếu sau này cần bản đồ tương tác tùy biến, marker nâng cao hoặc Directions API trong ứng dụng, cần thiết lập Google Maps Platform API key và giới hạn key theo domain.

## Lưu ý về QR

Scanner sử dụng API `BarcodeDetector` của trình duyệt. Mức hỗ trợ tùy trình duyệt và thiết bị. QR nên chứa ID POI hoặc URL địa điểm. Để dùng ổn định trên nhiều thiết bị hơn, có thể thay bằng thư viện quét QR chuyên dụng sau khi thống nhất chính sách dependency của dự án.
