BEGIN;

UPDATE public."POIs"
SET
    "Location" = '720A Điện Biên Phủ, phường Thạnh Mỹ Tây, Thành phố Hồ Chí Minh, Việt Nam',
    "Description" = 'Landmark 81 là tòa nhà cao tầng nổi bật trong khu đô thị Vinhomes Central Park bên sông Sài Gòn. Công trình có kiến trúc hiện đại, tích hợp các khu vực thương mại, dịch vụ, ăn uống và giải trí. Tòa nhà góp phần tạo nên đường chân trời đặc trưng của Thành phố Hồ Chí Minh. Khu vực xung quanh có công viên ven sông, phù hợp để đi dạo và ngắm cảnh đô thị.'
WHERE "Id" = 14 AND "Name" = 'Landmark 81';

COMMIT;