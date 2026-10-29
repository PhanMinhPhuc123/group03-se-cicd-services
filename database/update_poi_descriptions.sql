BEGIN;

UPDATE public."POIs"
SET "Description" = CASE "Id"

WHEN 1 THEN
'Dinh Độc Lập, còn được gọi là Hội trường Thống Nhất, là một di tích lịch sử quan trọng gắn liền với sự kiện ngày 30/4/1975. Công trình hiện nay được xây dựng trong giai đoạn 1962–1966 theo thiết kế của kiến trúc sư Ngô Viết Thụ. Bên trong dinh có nhiều phòng làm việc, phòng khánh tiết, khu tiếp khách và hệ thống hầm chỉ huy. Kiến trúc kết hợp phong cách hiện đại với những yếu tố trang trí mang ý nghĩa văn hóa Việt Nam. Đây là điểm tham quan phù hợp để tìm hiểu lịch sử, kiến trúc và các sự kiện quan trọng của đất nước.'

WHEN 2 THEN
'Bảo tàng Chứng tích Chiến tranh là nơi lưu giữ và giới thiệu nhiều tư liệu về các cuộc chiến tranh tại Việt Nam. Bảo tàng trưng bày hình ảnh, tài liệu, hiện vật quân sự và những câu chuyện liên quan đến hậu quả của chiến tranh đối với con người. Khu vực ngoài trời có nhiều phương tiện quân sự như máy bay, xe tăng và pháo. Các phòng trưng bày giúp khách tham quan hiểu rõ hơn về lịch sử, những mất mát trong chiến tranh và giá trị của hòa bình. Đây là địa điểm có ý nghĩa giáo dục lịch sử và nhân văn đối với cả khách trong nước lẫn quốc tế.'

WHEN 3 THEN
'Bưu điện Trung tâm Sài Gòn là một công trình kiến trúc nổi bật được xây dựng vào cuối thế kỷ XIX. Tòa nhà gây ấn tượng với mặt tiền cổ điển, mái vòm cao và không gian nội thất rộng. Bên trong vẫn có các khu vực phục vụ bưu chính, đồng thời trưng bày một số chi tiết kiến trúc và bản đồ lịch sử. Công trình phản ánh dấu ấn kiến trúc châu Âu trong quá trình hình thành đô thị Sài Gòn. Du khách thường ghé thăm để tìm hiểu lịch sử, chụp ảnh và trải nghiệm không gian di sản giữa trung tâm thành phố.'

WHEN 4 THEN
'Nhà thờ Đức Bà Sài Gòn, tên chính thức là Nhà thờ chính tòa Đức Bà Sài Gòn, là công trình tôn giáo tiêu biểu của thành phố. Công trình được xây dựng vào cuối thế kỷ XIX và nổi bật với kiến trúc mang phong cách châu Âu. Mặt ngoài sử dụng gạch đỏ đặc trưng, kết hợp các ô cửa, chi tiết trang trí và hai tháp chuông cao. Quảng trường phía trước là không gian quen thuộc để người dân gặp gỡ và du khách chụp ảnh. Địa điểm này góp phần tạo nên cụm di sản kiến trúc nổi bật tại khu vực trung tâm Sài Gòn.'

WHEN 5 THEN
'Chợ Bến Thành là một trong những khu chợ truyền thống nổi tiếng nhất của Thành phố Hồ Chí Minh. Công trình có kiến trúc đặc trưng với tháp đồng hồ ở cổng chính và nhiều lối vào dẫn đến các khu vực bên trong. Chợ kinh doanh đa dạng mặt hàng như thực phẩm, quần áo, đồ lưu niệm và đặc sản địa phương. Đây cũng là nơi du khách có thể tìm hiểu nhịp sống buôn bán và văn hóa giao tiếp của người dân thành phố. Khu vực xung quanh chợ có nhiều tuyến đường trung tâm, thuận tiện kết hợp tham quan và khám phá ẩm thực.'

WHEN 6 THEN
'Phố đi bộ Nguyễn Huệ là không gian công cộng nổi bật nằm giữa khu vực trung tâm thành phố. Tuyến phố có mặt đường rộng, quảng trường thoáng và nhiều công trình thương mại, khách sạn cùng kiến trúc đô thị xung quanh. Nơi đây thường diễn ra các hoạt động cộng đồng, chương trình biểu diễn và sự kiện vào những dịp đặc biệt. Buổi tối, khu vực thu hút đông người đến đi dạo, chụp ảnh và thưởng thức không khí thành phố. Từ phố đi bộ, du khách có thể thuận tiện tiếp tục tham quan các địa danh lân cận hoặc đi về phía bờ sông Sài Gòn.'

WHEN 7 THEN
'Bến Bạch Đằng là khu vực cảnh quan ven sông Sài Gòn nằm gần trung tâm thành phố. Nơi đây có lối đi bộ, không gian công cộng và tầm nhìn hướng ra dòng sông cùng các công trình đô thị hai bên bờ. Du khách có thể dạo mát, ngắm cảnh, chụp ảnh hoặc quan sát hoạt động giao thông đường thủy. Khu vực này cũng gần phố đi bộ Nguyễn Huệ và nhiều điểm tham quan nổi tiếng khác. Đây là địa điểm phù hợp để thư giãn và cảm nhận sự kết hợp giữa cảnh quan sông nước với nhịp sống đô thị hiện đại.'

WHEN 8 THEN
'Nhà hát Thành phố Hồ Chí Minh, thường được gọi là Nhà hát Thành phố hoặc Nhà hát Lớn, là công trình biểu diễn nghệ thuật có lịch sử lâu đời. Tòa nhà nổi bật với phong cách kiến trúc Pháp, mặt tiền trang trí cầu kỳ và các chi tiết mang tính nghệ thuật. Công trình được sử dụng cho nhiều chương trình biểu diễn như hòa nhạc, múa và sân khấu. Vị trí gần đường Đồng Khởi giúp nhà hát trở thành một điểm nhấn trong không gian đô thị trung tâm. Du khách có thể tìm hiểu kiến trúc bên ngoài và tham dự các chương trình phù hợp khi có lịch biểu diễn.'

WHEN 9 THEN
'Bảo tàng Thành phố Hồ Chí Minh lưu giữ và giới thiệu nhiều tư liệu về lịch sử hình thành, phát triển của thành phố. Công trình đặt trong một tòa nhà có kiến trúc cổ điển với các hành lang, cầu thang và không gian trưng bày đặc trưng. Các chủ đề giới thiệu đời sống đô thị, văn hóa, kinh tế và những giai đoạn lịch sử khác nhau. Thông qua hiện vật và tư liệu, khách tham quan có thể hiểu thêm về quá trình biến đổi của Sài Gòn – Thành phố Hồ Chí Minh. Đây là điểm đến phù hợp cho những người yêu thích lịch sử, kiến trúc và văn hóa địa phương.'

WHEN 10 THEN
'Chùa Bà Thiên Hậu là một công trình tín ngưỡng nổi tiếng của cộng đồng người Hoa tại khu vực Chợ Lớn. Ngôi chùa thờ Thiên Hậu Thánh Mẫu, vị thần được nhiều người đi biển và cộng đồng người Hoa tôn kính. Không gian chùa có mái ngói, các chi tiết chạm khắc, tượng thờ và nhiều vật phẩm mang dấu ấn văn hóa truyền thống. Những vòng nhang lớn treo trên cao tạo nên hình ảnh đặc trưng của nơi này. Khi tham quan, du khách có thể tìm hiểu tín ngưỡng dân gian và các giá trị văn hóa được gìn giữ qua nhiều thế hệ.'

WHEN 11 THEN
'Chợ Bình Tây là khu chợ truyền thống quan trọng tại khu vực Chợ Lớn, gắn liền với hoạt động giao thương của thành phố. Công trình có kiến trúc đặc trưng với khu sân trong, các lối đi và nhiều quầy hàng được bố trí theo từng nhóm mặt hàng. Chợ cung cấp nhiều loại hàng hóa, thực phẩm và nguyên liệu phục vụ đời sống cũng như hoạt động kinh doanh. Không gian chợ phản ánh nét sinh hoạt thương mại lâu đời của cộng đồng địa phương. Đây là địa điểm thích hợp để khám phá kiến trúc chợ truyền thống và tìm hiểu văn hóa buôn bán tại khu vực Chợ Lớn.'

WHEN 12 THEN
'Công viên Tao Đàn là một không gian xanh nằm giữa khu vực đô thị đông đúc của Thành phố Hồ Chí Minh. Công viên có nhiều cây cổ thụ, thảm cỏ và lối đi bộ tạo điều kiện cho người dân nghỉ ngơi, tập thể dục và thư giãn. Vào buổi sáng, nơi đây thường có các hoạt động đi bộ, rèn luyện sức khỏe và sinh hoạt cộng đồng. Không gian nhiều bóng mát giúp công viên trở thành điểm dừng chân giữa hành trình khám phá trung tâm thành phố. Du khách có thể kết hợp tham quan công viên với các địa danh lân cận như Dinh Độc Lập và những tuyến đường trung tâm.'

WHEN 13 THEN
'Thảo Cầm Viên Sài Gòn là một trong những cơ sở bảo tồn động vật và thực vật lâu đời tại Việt Nam. Khuôn viên có nhiều cây xanh, các khu chăm sóc động vật và bộ sưu tập thực vật đa dạng. Đây là địa điểm tham quan phù hợp cho gia đình, học sinh và những người quan tâm đến thiên nhiên. Trong quá trình tham quan, khách có thể tìm hiểu về các loài động vật, môi trường sống và ý nghĩa của việc bảo tồn đa dạng sinh học. Không gian xanh rộng rãi cũng tạo điều kiện để đi bộ và nghỉ ngơi trong hành trình khám phá thành phố.'

WHEN 14 THEN
'Landmark 81 là một tòa nhà cao tầng nổi bật trong khu đô thị Vinhomes Central Park bên sông Sài Gòn. Công trình có kiến trúc hiện đại, tích hợp các khu vực thương mại, dịch vụ, ăn uống và giải trí. Tòa nhà góp phần tạo nên đường chân trời đặc trưng của Thành phố Hồ Chí Minh hiện đại. Du khách có thể đến khu vực này để mua sắm, thưởng thức ẩm thực và trải nghiệm các dịch vụ tham quan tùy theo khu vực mở cửa. Không gian xung quanh cũng có công viên ven sông, phù hợp để đi dạo và ngắm cảnh đô thị.'

WHEN 15 THEN
'Địa đạo Củ Chi là hệ thống đường hầm lịch sử gắn liền với cuộc kháng chiến tại khu vực Sài Gòn – Gia Định. Hệ thống được phát triển qua nhiều giai đoạn, phục vụ việc trú ẩn, liên lạc, sinh hoạt và hoạt động quân sự. Khu di tích hiện giới thiệu các đường hầm cùng nhiều hạng mục tái hiện đời sống trong thời chiến. Thông qua hiện vật và không gian tham quan, du khách có thể tìm hiểu về điều kiện sinh hoạt cũng như cách tổ chức hệ thống địa đạo. Đây là điểm đến có giá trị lịch sử, giúp người tham quan hiểu rõ hơn về một giai đoạn đặc biệt của Việt Nam.'

ELSE "Description"
END
WHERE "Id" BETWEEN 1 AND 15;

-- Safety check: fail the transaction if any target description is still short.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public."POIs"
      WHERE "Id" BETWEEN 1 AND 15
        AND length(COALESCE("Description", '')) < 200) > 0 THEN
    RAISE EXCEPTION 'Some POI descriptions are still shorter than 200 characters. Rolling back.';
  END IF;
END $$;

COMMIT;

SELECT "Id", "Name", length("Description") AS description_length
FROM public."POIs"
ORDER BY "Id";