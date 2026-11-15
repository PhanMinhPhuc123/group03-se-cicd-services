
-- =========================================================
-- POI SEED DATA - TOURISM REFACTOR
-- 15 dia diem tham quan tai TP. Ho Chi Minh
-- Ho tro khoi phuc du lieu va seed nhieu lan an toan.
-- Khong xoa POI, khong thay doi poi_id cua ban ghi cu.
-- =========================================================

BEGIN;

CREATE TEMP TABLE seed_pois (
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    description TEXT,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_pois VALUES
(
    'Dinh Độc Lập',
    '135 Nam Kỳ Khởi Nghĩa, TP. Hồ Chí Minh, Việt Nam',
    'Dinh Độc Lập là di tích lịch sử đặc biệt gắn liền với sự kiện ngày 30 tháng 4 năm 1975. Công trình có kiến trúc độc đáo và lưu giữ nhiều hiện vật, tư liệu lịch sử.',
    10.7770200, 106.6954000
),
(
    'Bảo tàng Chứng tích Chiến tranh',
    '28 Võ Văn Tần, TP. Hồ Chí Minh, Việt Nam',
    'Bảo tàng trưng bày hình ảnh, hiện vật và tư liệu về chiến tranh Việt Nam, góp phần phản ánh hậu quả chiến tranh và truyền tải thông điệp về hòa bình.',
    10.7793800, 106.6921900
),
(
    'Bưu điện Trung tâm Sài Gòn',
    '02 Công xã Paris, TP. Hồ Chí Minh, Việt Nam',
    'Bưu điện Trung tâm Sài Gòn là công trình kiến trúc tiêu biểu được xây dựng vào cuối thế kỷ XIX. Nơi đây nổi bật với kiến trúc cổ điển và không gian nội thất đặc trưng.',
    10.7799800, 106.7000200
),
(
    'Nhà thờ Đức Bà Sài Gòn',
    '01 Công xã Paris, TP. Hồ Chí Minh, Việt Nam',
    'Nhà thờ Đức Bà Sài Gòn là công trình kiến trúc tôn giáo nổi bật tại trung tâm thành phố, được biết đến với hai tháp chuông và phong cách kiến trúc Roman kết hợp Gothic.',
    10.7797200, 106.6991700
),
(
    'Chợ Bến Thành',
    'Đường Lê Lợi, TP. Hồ Chí Minh, Việt Nam',
    'Chợ Bến Thành là một trong những khu chợ lâu đời và nổi tiếng của thành phố. Nơi đây tập trung nhiều gian hàng thực phẩm, hàng thủ công, quà lưu niệm và đặc sản địa phương.',
    10.7725700, 106.6980200
),
(
    'Phố đi bộ Nguyễn Huệ',
    'Đường Nguyễn Huệ, TP. Hồ Chí Minh, Việt Nam',
    'Phố đi bộ Nguyễn Huệ là không gian công cộng nằm giữa trung tâm thành phố, thường diễn ra các hoạt động vui chơi, biểu diễn nghệ thuật và sự kiện cộng đồng.',
    10.7741700, 106.7036100
),
(
    'Bến Bạch Đằng',
    '02 Tôn Đức Thắng, TP. Hồ Chí Minh, Việt Nam',
    'Bến Bạch Đằng là không gian công cộng ven sông Sài Gòn, có tầm nhìn hướng ra sông và khu vực trung tâm thành phố. Đây cũng là địa điểm tham quan và ngắm cảnh ven sông.',
    10.7722800, 106.7064900
),
(
    'Nhà hát Thành phố Hồ Chí Minh',
    '07 Công trường Lam Sơn, TP. Hồ Chí Minh, Việt Nam',
    'Nhà hát Thành phố là công trình kiến trúc mang phong cách châu Âu, được xây dựng từ cuối thế kỷ XIX. Đây là địa điểm tổ chức nhiều chương trình biểu diễn nghệ thuật.',
    10.7767000, 106.7032200
),
(
    'Bảo tàng Thành phố Hồ Chí Minh',
    '65 Lý Tự Trọng, TP. Hồ Chí Minh, Việt Nam',
    'Bảo tàng Thành phố Hồ Chí Minh lưu giữ và trưng bày nhiều tư liệu, hiện vật về lịch sử, văn hóa, địa lý và quá trình phát triển của thành phố.',
    10.7759200, 106.6996300
),
(
    'Chùa Bà Thiên Hậu',
    '710 Nguyễn Trãi, TP. Hồ Chí Minh, Việt Nam',
    'Chùa Bà Thiên Hậu là công trình tín ngưỡng lâu đời của cộng đồng người Hoa tại khu vực Chợ Lớn. Ngôi chùa nổi bật với kiến trúc truyền thống, các hoa văn trang trí và hoạt động thờ phụng Thiên Hậu Thánh Mẫu.',
    10.7530000, 106.6606000
),
(
    'Chợ Bình Tây',
    '57A Tháp Mười, TP. Hồ Chí Minh, Việt Nam',
    'Chợ Bình Tây là khu chợ đầu mối nổi tiếng tại khu vực Chợ Lớn, có kiến trúc mang nét đặc trưng của cộng đồng người Hoa và hoạt động buôn bán hàng hóa đa dạng.',
    10.7496200, 106.6510900
),
(
    'Công viên Tao Đàn',
    '55C Nguyễn Thị Minh Khai, TP. Hồ Chí Minh, Việt Nam',
    'Công viên Tao Đàn là không gian xanh nằm tại trung tâm thành phố, có nhiều cây cổ thụ và lối đi bộ. Đây là địa điểm thư giãn, tập thể dục và sinh hoạt ngoài trời.',
    10.7744900, 106.6926500
),
(
    'Thảo Cầm Viên Sài Gòn',
    '02B Nguyễn Bỉnh Khiêm, TP. Hồ Chí Minh, Việt Nam',
    'Thảo Cầm Viên Sài Gòn là một trong những vườn thú lâu đời trên thế giới, kết hợp hoạt động bảo tồn động vật, thực vật với tham quan và giáo dục môi trường.',
    10.7880600, 106.7047200
),
(
    'Landmark 81',
    '720A Điện Biên Phủ, TP. Hồ Chí Minh, Việt Nam',
    'Landmark 81 là tòa nhà chọc trời nổi bật bên sông Sài Gòn, thuộc khu đô thị Vinhomes Central Park. Công trình có khu mua sắm, ẩm thực, giải trí và không gian ngắm cảnh.',
    10.7951200, 106.7221000
),
(
    'Địa đạo Củ Chi - Bến Dược',
    'Địa đạo Bến Dược, huyện Củ Chi, TP. Hồ Chí Minh, Việt Nam',
    'Địa đạo Bến Dược là một phần của hệ thống địa đạo Củ Chi, gắn liền với lịch sử kháng chiến của quân và dân địa phương. Khu di tích giới thiệu hệ thống đường hầm và đời sống sinh hoạt dưới lòng đất.',
    11.1432500, 106.4632100
);

-- 1. Cap nhat POI da ton tai theo toa do.
-- Giu nguyen poi_id va created_at.
UPDATE public.pois AS p
SET
    name = s.name,
    name_search = lower(btrim(s.name)),
    address = s.address,
    address_search = lower(btrim(s.address)),
    description = s.description
FROM seed_pois AS s
WHERE p.latitude = s.latitude
  AND p.longitude = s.longitude;

-- 2. Them POI chua ton tai.
-- Kiem tra ca ten va toa do de han che trung lap.
INSERT INTO public.pois (
    name,
    name_search,
    address,
    address_search,
    description,
    latitude,
    longitude,
    is_visible
)
SELECT
    s.name,
    lower(btrim(s.name)),
    s.address,
    lower(btrim(s.address)),
    s.description,
    s.latitude,
    s.longitude,
    TRUE
FROM seed_pois AS s
WHERE NOT EXISTS (
    SELECT 1
    FROM public.pois AS p
    WHERE lower(btrim(p.name)) = lower(btrim(s.name))
       OR p.name_search = lower(btrim(s.name))
       OR (
           p.latitude = s.latitude
           AND p.longitude = s.longitude
       )
);

COMMIT;
