BEGIN;

UPDATE public."POIs" AS p
SET
    "Latitude" = v.latitude,
    "Longitude" = v.longitude
FROM (
    VALUES
        (1,  10.7770::double precision, 106.6954::double precision),
        (2,  10.7798, 106.6926),
        (3,  10.7798, 106.6991),
        (4,  10.7798, 106.6990),
        (5,  10.7725, 106.6980),
        (6,  10.7731, 106.7030),
        (7,  10.7720, 106.7060),
        (8,  10.7769, 106.7031),
        (9,  10.7766, 106.6990),
        (10, 10.9620, 106.6540),
        (11, 10.7505, 106.6515),
        (12, 10.7720, 106.6900),
        (13, 10.7879, 106.7050),
        (14, 10.7950, 106.7218),
        (15, 11.0500, 106.4620)
) AS v(id, latitude, longitude)
WHERE p."Id" = v.id;

-- Chi kiem tra so luong va toa do; khong sua noi dung POI.
SELECT
    COUNT(*) AS total_pois,
    COUNT("Latitude") AS have_latitude,
    COUNT("Longitude") AS have_longitude
FROM public."POIs";

SELECT
    "Id",
    "Name",
    "Latitude",
    "Longitude"
FROM public."POIs"
ORDER BY "Id";

COMMIT;