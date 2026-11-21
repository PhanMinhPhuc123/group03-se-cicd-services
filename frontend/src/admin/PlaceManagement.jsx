
import { useEffect, useMemo, useRef, useState } from "react";
import "./PlaceManagement.css";

const API_URL = "/api/POIs";

const emptyForm = {
  name: "",
  address: "",
  description: "",
  latitude: "",
  longitude: "",
  isVisible: true,
};

function adminHeaders(json = false) {
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Bạn chưa đăng nhập Admin. Vui lòng đăng nhập lại.");
  }

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

async function readResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data, fallback) {
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.title || fallback;
}

export default function PlaceManagement() {
  const [places, setPlaces] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Ảnh được chọn và xem trước ở frontend.
  // Chưa upload lên server cho đến khi hoàn thành API upload backend.
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  async function loadPlaces() {
    try {
      setError("");

      const response = await fetch(`${API_URL}?includeHidden=true`, {
        headers: adminHeaders(),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Không thể tải POI (HTTP ${response.status}).`
          )
        );
      }

      setPlaces(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách POI.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
  
    async function fetchPlaces() {
      try {
        const response = await fetch(`${API_URL}?includeHidden=true`, {
          headers: adminHeaders(),
        });
  
        const data = await readResponse(response);
  
        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              `Không thể tải POI (HTTP ${response.status}).`
            )
          );
        }
  
        if (!cancelled) {
          setPlaces(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải danh sách POI.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
  
    void fetchPlaces();
  
    return () => {
      cancelled = true;
    };
  }, []);
  
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const filteredPlaces = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase("vi");

    if (!keyword) return places;

    return places.filter((place) =>
      [
        place.poiId,
        place.name,
        place.address,
        place.description,
      ].some((value) =>
        String(value ?? "").toLocaleLowerCase("vi").includes(keyword)
      )
    );
  }, [places, searchText]);

  function resetImage() {
    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    resetImage();
  }

  function openAddForm() {
    setEditingId(null);
    setFormData({ ...emptyForm });
    resetImage();
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function openEditForm(place) {
    setError("");
    setSuccess("");
    resetImage();

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(place.poiId)}`,
        { headers: adminHeaders() }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Không thể tải thông tin POI.")
        );
      }

      setEditingId(data.poiId);

      setFormData({
        name: data.name ?? "",
        address: data.address ?? "",
        description: data.description ?? "",
        latitude: data.latitude ?? "",
        longitude: data.longitude ?? "",
        isVisible: data.isVisible ?? true,
      });
      
      // Nếu POI đã có ảnh, tải ảnh từ API để xem trước.
      // Dùng Authorization để Admin xem được cả ảnh của POI đang ẩn.
      if (data.imageUrl) {
        try {
          const imageResponse = await fetch(
            `${API_URL}/${encodeURIComponent(data.poiId)}/image`,
            {
              headers: adminHeaders(),
            }
          );
      
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            setImagePreview(URL.createObjectURL(imageBlob));
          }
        } catch (imageError) {
          console.error("Không thể tải ảnh POI:", imageError);
        }
      }
      
      setShowForm(true);
    } catch (err) {
      setError(err.message || "Không thể mở thông tin địa điểm.");
    }
  }

  function changeField(event) {
    const { name, value } = event.target;

    setFormData((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedImage(file);

    setImagePreview((oldPreview) => {
      if (oldPreview.startsWith("blob:")) {
        URL.revokeObjectURL(oldPreview);
      }

      return URL.createObjectURL(file);
    });
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Vui lòng nhập tên địa điểm.";
    }

    if (!formData.address.trim()) {
      return "Vui lòng nhập địa chỉ địa điểm.";
    }

    if ((formData.latitude === "") !== (formData.longitude === "")) {
      return "Nhập cả vĩ độ và kinh độ, hoặc để trống cả hai.";
    }

    if (formData.latitude !== "" && formData.longitude !== "") {
      const lat = Number(formData.latitude);
      const lng = Number(formData.longitude);

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return "Vĩ độ phải nằm trong khoảng -90 đến 90.";
      }

      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return "Kinh độ phải nằm trong khoảng -180 đến 180.";
      }
    }

    return "";
  }
  async function uploadPlaceImage(poiId, file) {
    const formData = new FormData();
  
    formData.append("file", file);
  
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(poiId)}/image`,
      {
        method: "POST",
        headers: adminHeaders(),
        body: formData,
      }
    );
  
    const data = await readResponse(response);
  
    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          `Không thể tải ảnh lên MinIO (HTTP ${response.status}).`
        )
      );
    }
  
    return data;
  }
  async function savePlace(event) {
    event.preventDefault();
  
    setError("");
    setSuccess("");
  
    const validation = validateForm();
  
    if (validation) {
      setError(validation);
      return;
    }
  
    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      description: formData.description.trim() || null,
      latitude:
        formData.latitude === "" ? null : Number(formData.latitude),
      longitude:
        formData.longitude === "" ? null : Number(formData.longitude),
      isVisible: Boolean(formData.isVisible),
    };
  
    setSaving(true);
  
    try {
      const editing = Boolean(editingId);
  
      const response = await fetch(
        editing
          ? `${API_URL}/${encodeURIComponent(editingId)}`
          : API_URL,
        {
          method: editing ? "PUT" : "POST",
          headers: adminHeaders(true),
          body: JSON.stringify(payload),
        }
      );
  
      const data = await readResponse(response);
  
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Không thể ${editing ? "cập nhật" : "tạo"} POI (HTTP ${response.status}).`
          )
        );
      }
  
      // Khi tạo mới, lấy ID từ kết quả POST.
      // Khi chỉnh sửa, sử dụng editingId hiện có.
      const savedPoiId = editing ? editingId : data?.poiId;
  
      if (!savedPoiId) {
        throw new Error(
          "Đã lưu địa điểm nhưng không nhận được mã POI từ máy chủ."
        );
      }
  
      // Giữ lại ID để có thể thử upload lại nếu upload thất bại.
      setEditingId(savedPoiId);
  
      // Upload ảnh nếu người dùng đã chọn ảnh mới.
      if (selectedImage) {
        await uploadPlaceImage(savedPoiId, selectedImage);
      }
  
      setSuccess(
        editing
          ? selectedImage
            ? "Đã cập nhật địa điểm và tải ảnh lên MinIO thành công."
            : "Đã cập nhật địa điểm thành công."
          : selectedImage
            ? "Đã thêm địa điểm và tải ảnh lên MinIO thành công."
            : "Đã thêm địa điểm thành công."
      );
  
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });
  
      resetImage();
  
      await loadPlaces();
    } catch (err) {
      setError(err.message || "Không thể lưu địa điểm.");
    } finally {
      setSaving(false);
    }
  }
  async function togglePlaceVisibility(place) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(place.poiId)}`,
        {
          method: "PUT",
          headers: adminHeaders(true),
          body: JSON.stringify({
            name: place.name ?? "",
            address: place.address ?? "",
            description: place.description ?? null,
            latitude: place.latitude ?? null,
            longitude: place.longitude ?? null,
            isVisible: !place.isVisible,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Không thể cập nhật trạng thái POI (HTTP ${response.status}).`
          )
        );
      }

      setSuccess(
        place.isVisible
          ? `Đã ẩn địa điểm “${place.name}”.`
          : `Đã hiển thị lại địa điểm “${place.name}”.`
      );

      await loadPlaces();
    } catch (err) {
      setError(
        err.message || "Không thể cập nhật trạng thái hiển thị POI."
      );
    }
  }

  return (
    <div className="place-management">
      <div className="place-page-header">
        <div>
          <span className="place-eyebrow">QUẢN TRỊ HỆ THỐNG</span>
          <h1>Quản lý điểm tham quan</h1>
          <p>Quản lý thông tin các địa điểm trong hệ thống du lịch.</p>
        </div>

        <button
          type="button"
          className="place-primary-button"
          onClick={openAddForm}
        >
          <span>＋</span> Thêm địa điểm
        </button>
      </div>

      <div className="place-summary">
        <div className="place-summary-card">
          <div className="place-summary-icon">⌖</div>
          <div>
            <span>Tổng địa điểm</span>
            <strong>{places.length}</strong>
          </div>
        </div>

        <div className="place-summary-card">
          <div className="place-summary-icon place-icon-green">✓</div>
          <div>
            <span>Đang hiển thị</span>
            <strong>{places.filter((p) => p.isVisible).length}</strong>
          </div>
        </div>

        <div className="place-summary-card">
          <div className="place-summary-icon place-icon-orange">◎</div>
          <div>
            <span>Có tọa độ GPS</span>
            <strong>
              {
                places.filter(
                  (p) => p.latitude != null && p.longitude != null
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="place-alert place-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="place-alert place-alert-success" role="status">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      <section className="place-table-card">
        <div className="place-table-toolbar">
          <div>
            <h2>Danh sách địa điểm</h2>
            <p>{filteredPlaces.length} địa điểm được tìm thấy</p>
          </div>

          <div className="place-search-wrap">
            <span>⌕</span>
            <input
              className="place-search"
              type="search"
              placeholder="Tìm tên, địa chỉ hoặc mã địa điểm..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="place-state">Đang tải dữ liệu địa điểm...</div>
        ) : filteredPlaces.length === 0 ? (
          <div className="place-state">
            {searchText
              ? "Không tìm thấy địa điểm phù hợp."
              : "Chưa có dữ liệu địa điểm."}
          </div>
        ) : (
          <div className="place-table-wrapper">
            <table className="place-table">
              <thead>
                <tr>
                  <th>ĐỊA ĐIỂM</th>
                  <th>ĐỊA CHỈ</th>
                  <th>TỌA ĐỘ GPS</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlaces.map((place) => (
                  <tr key={place.poiId}>
                    <td>
                      <div className="place-name-cell">
                        <strong>{place.name}</strong>
                        <span>
                          {String(place.poiId).slice(0, 8)}…
                        </span>
                      </div>
                    </td>

                    <td className="place-address-cell">
                      {place.address || "Chưa có địa chỉ"}
                    </td>

                    <td>
                      {place.latitude != null &&
                      place.longitude != null
                        ? `${place.latitude}, ${place.longitude}`
                        : "Chưa có GPS"}
                    </td>

                    <td>
                      <span
                        className={
                          place.isVisible
                            ? "place-status place-status-active"
                            : "place-status place-status-inactive"
                        }
                      >
                        <i />
                        {place.isVisible
                          ? "Đang hiển thị"
                          : "Đang ẩn"}
                      </span>
                    </td>

                    <td>
                      <div className="place-actions">
                        <button
                          type="button"
                          className="place-edit-button"
                          onClick={() => openEditForm(place)}
                        >
                          Chỉnh sửa
                        </button>

                        <button
                          type="button"
                          className={
                            place.isVisible
                              ? "place-hide-button"
                              : "place-show-button"
                          }
                          onClick={() => togglePlaceVisibility(place)}
                        >
                          {place.isVisible ? "Ẩn" : "Hiện lại"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="place-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <section
            className="place-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-form-title"
          >
            <div className="place-modal-header">
              <div>
                <span className="place-eyebrow">
                  QUẢN LÝ ĐỊA ĐIỂM
                </span>
                <h2 id="place-form-title">
                  {editingId
                    ? "Chỉnh sửa địa điểm"
                    : "Thêm địa điểm mới"}
                </h2>
                <p>
                  Điền thông tin để quản lý địa điểm tham quan.
                </p>
              </div>

              <button
                type="button"
                className="place-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={savePlace}>
              <div className="place-modal-body">
                <section className="place-form-section">
                  <div className="place-section-heading">
                    <span className="place-section-number">01</span>
                    <div>
                      <h3>Thông tin cơ bản</h3>
                      <p>Tên gọi và thông tin giới thiệu địa điểm.</p>
                    </div>
                  </div>

                  <div className="place-form-grid">
                    <label className="place-form-field place-field-full">
                      Tên địa điểm <span>*</span>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={changeField}
                        maxLength={255}
                        placeholder="Ví dụ: Dinh Độc Lập"
                        required
                      />
                    </label>

                    <label className="place-form-field place-field-full">
                      Địa chỉ <span>*</span>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={changeField}
                        maxLength={500}
                        placeholder="Nhập địa chỉ cụ thể của địa điểm"
                        required
                      />
                    </label>

                    <label className="place-form-field place-field-full">
                      Mô tả
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={changeField}
                        rows={4}
                        placeholder="Giới thiệu lịch sử, đặc điểm hoặc thông tin nổi bật..."
                      />
                    </label>
                  </div>
                </section>

                <section className="place-form-section">
                  <div className="place-section-heading">
                    <span className="place-section-number">02</span>
                    <div>
                      <h3>Hình ảnh địa điểm</h3>
                      <p>Chọn ảnh đại diện cho địa điểm tham quan.</p>
                    </div>
                  </div>

                  <div className="place-upload-area">
                    {imagePreview ? (
                      <div className="place-image-preview-container">
                        <img
                          src={imagePreview}
                          alt="Ảnh xem trước địa điểm"
                          className="place-image-preview"
                        />

                        <div className="place-image-preview-actions">
                          <div>
                          <strong>
                           {selectedImage?.name || "Ảnh địa điểm hiện tại"}
                          </strong>
                            <span>
                              {selectedImage
                                ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                                : ""}
                            </span>
                          </div>

                          <div className="place-image-buttons">
                            <button
                              type="button"
                              className="place-image-change"
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                            >
                              Đổi ảnh
                            </button>

                            <button
                              type="button"
                              className="place-image-remove"
                              onClick={resetImage}
                            >
                              Bỏ ảnh
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="place-upload-trigger"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        <span className="place-upload-icon">↑</span>
                        <strong>Chọn ảnh từ máy tính</strong>
                        <span>
                          Nhấn để chọn ảnh JPG, PNG hoặc WEBP
                        </span>
                        <small>Dung lượng tối đa 5 MB</small>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="place-file-input"
                      onChange={handleImageChange}
                    />

                    <p className="place-image-note">
                    Ảnh sẽ được tải lên MinIO và lưu thông tin tham chiếu
                     trong PostgreSQL khi bạn nhấn lưu địa điểm.
                    </p>
                  </div>
                </section>

                <section className="place-form-section">
                  <div className="place-section-heading">
                    <span className="place-section-number">03</span>
                    <div>
                      <h3>Vị trí GPS</h3>
                      <p>
                        Tọa độ dùng để xác định vị trí trên bản đồ.
                      </p>
                    </div>
                  </div>

                  <div className="place-form-grid place-coordinate-grid">
                    <label className="place-form-field">
                      Vĩ độ (Latitude)
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={changeField}
                        min="-90"
                        max="90"
                        step="any"
                        placeholder="10.7769"
                      />
                    </label>

                    <label className="place-form-field">
                      Kinh độ (Longitude)
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={changeField}
                        min="-180"
                        max="180"
                        step="any"
                        placeholder="106.7009"
                      />
                    </label>
                  </div>

                  <p className="place-gps-note">
                    Có thể để trống cả hai tọa độ nếu chưa xác định
                    được vị trí.
                  </p>
                </section>

                <section className="place-form-section place-visibility-section">
                  <div>
                    <h3>Trạng thái hiển thị</h3>
                    <p>
                      Cho phép địa điểm xuất hiện trên website khách tham quan.
                    </p>
                  </div>

                  <label className="place-switch">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(event) =>
                        setFormData((old) => ({
                          ...old,
                          isVisible: event.target.checked,
                        }))
                      }
                    />
                    <span className="place-switch-slider" />
                  </label>
                </section>

                <p className="place-required-note">
                  <span>*</span> Thông tin bắt buộc
                </p>
              </div>

              <div className="place-modal-footer">
                <button
                  type="button"
                  className="place-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="place-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId
                      ? "Lưu thay đổi"
                      : "Thêm địa điểm"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
