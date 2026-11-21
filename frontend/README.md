# Thuyết minh Đa ngôn ngữ - Frontend

Frontend của hệ thống được xây dựng bằng **React 19** và **Vite 8**, sử dụng JavaScript ES Modules.

## 1. Công nghệ sử dụng

- React 19 và React DOM.
- Vite 8 làm công cụ phát triển và build ứng dụng.
- React Leaflet và Leaflet hỗ trợ hiển thị bản đồ.
- qrcode.react hỗ trợ tạo mã QR.
- Nginx phục vụ ứng dụng trong môi trường Docker production.

## 2. Yêu cầu môi trường

- Node.js tương thích với Vite 8.
- npm.
- Backend API Gateway chạy tại cổng `8080` khi sử dụng cấu hình development.
- Docker và Docker Compose nếu triển khai bằng container.

## 3. Chạy trên máy tính

Mở terminal tại thư mục `frontend` và thực hiện:

```powershell
npm ci
npm run dev
```

Mặc định Vite sử dụng cổng `5173`. Cấu hình server cho phép truy cập từ các thiết bị trong mạng LAN thông qua `0.0.0.0`.

### Cấu hình kết nối API

Khi chạy development, Vite proxy các request bắt đầu bằng `/api` tới:

```text
http://localhost:8080
```

Đây là địa chỉ API Gateway. Frontend không gọi trực tiếp từng microservice.

Cần khởi động Backend/API Gateway trước khi kiểm thử các chức năng cần dữ liệu từ máy chủ.

## 4. Các lệnh phát triển và kiểm thử

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

Ý nghĩa:

- `npm run dev`: khởi chạy môi trường phát triển.
- `npm run lint`: kiểm tra mã nguồn bằng ESLint.
- `npm run build`: tạo bản build production trong thư mục `dist`.
- `npm run preview`: xem thử bản build production.

## 5. Các chức năng giao diện

- Hiển thị danh sách POI lấy từ `GET /api/POIs`.
- Tìm kiếm và xem thông tin POI.
- Mở Google Maps cho địa điểm đang chọn hoặc vị trí GPS.
- Tạo phiên truy cập ngay khi mở website; không yêu cầu GPS ở thời điểm này.
- Chỉ xin quyền GPS khi khách chủ động bấm nút tìm vị trí.
- Lưu trạng thái GPS gồm `NOT_REQUESTED`, `GRANTED`, `DENIED`, `UNAVAILABLE` hoặc `ERROR`.
- Quét QR bằng camera trên các trình duyệt hỗ trợ `BarcodeDetector`.

## 6. Triển khai bằng Docker

Frontend sử dụng Docker multi-stage build:

1. Giai đoạn build sử dụng `node:22-alpine` để cài đặt dependencies và chạy `npm run build`.
2. Giai đoạn production sử dụng `nginx:alpine` để phục vụ nội dung trong thư mục `dist`.

Nginx lắng nghe tại cổng `80`.

Trong môi trường Docker, các request `/api/` được Nginx chuyển tiếp đến:

```text
http://apigateway:8080
```

Do đó, container frontend cần được kết nối vào cùng Docker network với dịch vụ `apigateway` để phân giải được hostname này.

**Lưu ý:** File `backend/docker-compose.yml` hiện tại khai báo các dịch vụ backend, chưa khai báo dịch vụ frontend. Frontend cần được build và triển khai riêng hoặc được bổ sung thành một service trong Docker Compose nếu muốn khởi chạy toàn bộ hệ thống cùng lúc.

## 7. Kiểm thử trên điện thoại

Camera và GPS thường yêu cầu HTTPS hoặc `localhost`.

Nếu mở frontend từ điện thoại bằng địa chỉ IP LAN qua HTTP, trình duyệt có thể chặn camera hoặc GPS.

Nên sử dụng HTTPS trong môi trường triển khai hoặc môi trường phát triển có cấu hình HTTPS khi kiểm thử các chức năng này.

## 8. Lưu ý về Google Maps

Bản đồ nhúng và liên kết tìm đường hiện sử dụng URL Google Maps, không nhúng Google Maps JavaScript SDK nên không cần API key cho phần giao diện hiện tại.

Nếu sau này cần bản đồ tương tác tùy biến, marker nâng cao hoặc Directions API trong ứng dụng, cần thiết lập Google Maps Platform API key và giới hạn key theo domain.

## 9. Lưu ý về QR

Scanner sử dụng API `BarcodeDetector` của trình duyệt. Mức hỗ trợ tùy trình duyệt và thiết bị.

Website sử dụng một QR chung trỏ đến trang chủ với tham số `?source=qr`; QR không gắn ID POI. Backend dùng tham số nguồn này để phân biệt lượt mở từ QR với truy cập trực tiếp.

Scanner hiện tại vẫn sử dụng `BarcodeDetector`; cần kiểm thử trên thiết bị thật và cân nhắc thư viện chuyên dụng nếu trình duyệt không hỗ trợ đầy đủ.