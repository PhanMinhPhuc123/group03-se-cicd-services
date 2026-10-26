-- ============================================================
-- SEED DATA - POI SERVICE
-- Lam moi du lieu mau bang tieng Viet.
-- Chi su dung file database/seed.sql.
-- ============================================================

BEGIN;

-- 1. Xoa ma demo cu truoc de tranh ma truy cap bi trung.
DELETE FROM public."AccessCodes"
WHERE "Code" = 'DEMO-SAIGON-2026';

-- 2. Xoa du lieu cu.
-- Khoa ngoai CASCADE tu dong xoa cac lien ket TourPOIs
-- va AccessCodes lien quan den Tour.
DELETE FROM public."TourPOIs";
DELETE FROM public."Tours";
DELETE FROM public."POIs";

-- 3. Tao lai 15 dia diem.
INSERT INTO public."POIs"
    ("Id", "Name", "Description", "Location", "IsActive")
VALUES
(1, 'Dinh Độc Lập',
 'Công trình lịch sử gắn liền với sự kiện kết thúc Chiến tranh Việt Nam năm 1975.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(2, 'Bảo tàng Chứng tích Chiến tranh',
 'Bảo tàng giới thiệu lịch sử chiến tranh qua hình ảnh, hiện vật và tư liệu.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(3, 'Bưu điện Trung tâm Sài Gòn',
 'Công trình lịch sử nổi bật với kiến trúc mang ảnh hưởng châu Âu.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(4, 'Nhà thờ Đức Bà Sài Gòn',
 'Công trình tôn giáo tiêu biểu với kiến trúc và mặt ngoài bằng gạch đỏ.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(5, 'Chợ Bến Thành',
 'Khu chợ truyền thống nổi tiếng với ẩm thực, đồ lưu niệm và hàng tiêu dùng.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(6, 'Phố đi bộ Nguyễn Huệ',
 'Tuyến phố đi bộ trung tâm, phù hợp để dạo bước và tham gia sự kiện.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(7, 'Bến Bạch Đằng',
 'Khu vực ven sông Sài Gòn với cảnh quan sông nước và đường chân trời thành phố.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(8, 'Nhà hát Thành phố Hồ Chí Minh',
 'Công trình biểu diễn nghệ thuật lịch sử với kiến trúc Pháp cổ điển.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(9, 'Bảo tàng Thành phố Hồ Chí Minh',
 'Bảo tàng giới thiệu quá trình phát triển và đời sống văn hóa thành phố.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(10, 'Chùa Bà Thiên Hậu',
 'Ngôi chùa truyền thống của người Hoa tại Chợ Lớn.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(11, 'Chợ Bình Tây',
 'Khu chợ truyền thống tại Chợ Lớn với kiến trúc đặc trưng và nhiều mặt hàng.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(12, 'Công viên Tao Đàn',
 'Không gian xanh công cộng với nhiều cây cổ thụ và lối đi bộ.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(13, 'Thảo Cầm Viên Sài Gòn',
 'Vườn bách thú và vườn thực vật lâu đời của thành phố.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(14, 'Landmark 81',
 'Tòa nhà chọc trời hiện đại với khu mua sắm, ẩm thực và ngắm cảnh.',
 'Thành phố Hồ Chí Minh, Việt Nam', TRUE),
(15, 'Địa đạo Củ Chi',
 'Hệ thống đường hầm lịch sử gắn liền với Chiến tranh Việt Nam.',
 'Củ Chi, Thành phố Hồ Chí Minh, Việt Nam', TRUE);

-- 3.1. Cap nhat toa do dia ly cho 15 POI.
-- Latitude: vi do; Longitude: kinh do.
UPDATE public."POIs" AS p
SET
    "Latitude" = coords.latitude,
    "Longitude" = coords.longitude
FROM (
    VALUES
        (1, 10.77702::double precision, 106.69540::double precision),
        (2, 10.77938, 106.69219),
        (3, 10.77998, 106.70002),
        (4, 10.77980, 106.69900),
        (5, 10.77257, 106.69802),
        (6, 10.77460, 106.70190),
        (7, 10.77228, 106.70649),
        (8, 10.77671, 106.70322),
        (9, 10.77592, 106.70000),
        (10, 10.75380, 106.66860),
        (11, 10.74980, 106.65190),
        (12, 10.77479, 106.69309),
        (13, 10.78781, 106.70646),
        (14, 10.79500, 106.72180),
        (15, 11.06304, 106.52912)
) AS coords(id, latitude, longitude)
WHERE p."Id" = coords.id;

-- 4. Tao lai 10 tour.
INSERT INTO public."Tours" ("Id", "Name", "Description", "IsActive")
VALUES
(1, 'Tour Lịch sử Thành phố Hồ Chí Minh',
 'Khám phá các địa danh lịch sử quan trọng của thành phố và Việt Nam.', TRUE),
(2, 'Tour Kiến trúc Sài Gòn xưa',
 'Khám phá các công trình kiến trúc lịch sử của Sài Gòn.', TRUE),
(3, 'Tour Văn hóa địa phương Sài Gòn',
 'Tìm hiểu chợ truyền thống, di sản tôn giáo và đời sống địa phương.', TRUE),
(4, 'Tour Trung tâm Thành phố Hồ Chí Minh',
 'Tham quan các địa danh nổi tiếng tại trung tâm thành phố.', TRUE),
(5, 'Tour Lịch sử Chiến tranh Việt Nam',
 'Tìm hiểu lịch sử chiến tranh qua các địa điểm và bảo tàng.', TRUE),
(6, 'Tour Di sản Chợ Lớn',
 'Khám phá chợ truyền thống và di sản văn hóa người Hoa.', TRUE),
(7, 'Tour Ẩm thực đường phố Sài Gòn',
 'Khám phá các khu chợ và văn hóa ẩm thực địa phương.', TRUE),
(8, 'Tour Ven sông Sài Gòn',
 'Thưởng ngoạn cảnh ven sông và đường chân trời thành phố.', TRUE),
(9, 'Tour Công viên và vườn xanh Thành phố Hồ Chí Minh',
 'Khám phá công viên và không gian xanh trong thành phố.', TRUE),
(10, 'Tour Khám phá Sài Gòn hiện đại',
 'Khám phá công trình hiện đại và sự phát triển của thành phố.', TRUE);

-- 5. Tao lai 33 lien ket Tour-POI.
INSERT INTO public."TourPOIs" ("TourId", "POIId", "DisplayOrder")
VALUES
(1,1,1),(1,2,2),(1,3,3),(1,4,4),
(2,3,1),(2,4,2),(2,8,3),(2,9,4),
(3,5,1),(3,10,2),(3,11,3),
(4,1,1),(4,3,2),(4,5,3),(4,6,4),(4,8,5),
(5,1,1),(5,2,2),(5,15,3),
(6,10,1),(6,11,2),(6,5,3),
(7,5,1),(7,6,2),(7,11,3),
(8,6,1),(8,7,2),(8,14,3),
(9,12,1),(9,13,2),
(10,6,1),(10,7,2),(10,14,3);

-- 6. Tao lai ma demo cho Tour Lich su (Tour ID 1).
INSERT INTO public."AccessCodes"
    ("Id", "Code", "TourId", "ExpiredAt", "IsActive")
VALUES
    (1, 'DEMO-SAIGON-2026', 1, NOW() + INTERVAL '365 days', TRUE);

-- 7. Kiem tra so luong va tinh hop le truoc khi COMMIT.
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public."POIs") <> 15 THEN
        RAISE EXCEPTION 'So luong POI khong dung 15';
    END IF;

    IF (SELECT COUNT(*) FROM public."Tours") <> 10 THEN
        RAISE EXCEPTION 'So luong Tour khong dung 10';
    END IF;

    IF (SELECT COUNT(*) FROM public."TourPOIs") <> 33 THEN
        RAISE EXCEPTION 'So luong TourPOIs khong dung 33';
    END IF;

    IF (SELECT COUNT(*) FROM public."AccessCodes") <> 1 THEN
        RAISE EXCEPTION 'So luong AccessCodes khong dung 1';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public."AccessCodes"
        WHERE "Code" = 'DEMO-SAIGON-2026'
          AND "TourId" = 1
          AND "IsActive" = TRUE
    ) THEN
        RAISE EXCEPTION 'Ma demo khong tro dung Tour ID 1';
    END IF;
END $$;

COMMIT;

-- 8. Hien thi ket qua sau khi tao du lieu.
SELECT 'POIs' AS "TableName", COUNT(*) AS "Total"
FROM public."POIs"
UNION ALL
SELECT 'Tours', COUNT(*) FROM public."Tours"
UNION ALL
SELECT 'TourPOIs', COUNT(*) FROM public."TourPOIs"
UNION ALL
SELECT 'AccessCodes', COUNT(*) FROM public."AccessCodes";

SELECT "Id", "Name" FROM public."POIs" ORDER BY "Id";
SELECT "Id", "Name" FROM public."Tours" ORDER BY "Id";
SELECT "Id", "Code", "TourId", "IsActive"
FROM public."AccessCodes";