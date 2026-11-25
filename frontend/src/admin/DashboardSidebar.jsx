
const menuItems = [
  {
    id: "overview",
    label: "Tổng quan",
    description: "Thống kê hoạt động tham quan",
  },
  {
    id: "history",
    label: "Phiên tham quan",
    description: "Lịch sử và trạng thái phiên",
  },
  {
    id: "places",
    label: "Điểm tham quan",
    description: "Thêm, sửa và xóa địa điểm",
  },
  {
    id: "gps",
    label: "Bản đồ GPS",
    description: "Xem vị trí các điểm tham quan",
  },
  {
    id: "reports",
    label: "Báo cáo thống kê",
    description: "Tổng hợp và xếp hạng địa điểm",
  },
];

function DashboardSidebar({ activeSection, onNavigate }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-brand-mark">T</div>

        <div>
          <h2>TOURISM</h2>
          <p>ADMINISTRATION</p>
        </div>
      </div>

      <div className="admin-sidebar-label">
        QUẢN LÝ HỆ THỐNG
      </div>

      <nav className="admin-sidebar-nav" aria-label="Menu quản trị">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-sidebar-item ${
              activeSection === item.id ? "is-active" : ""
            }`}
            aria-current={
              activeSection === item.id ? "page" : undefined
            }
            title={item.description}
            onClick={() => onNavigate(item.id)}
          >
            <span className="admin-sidebar-item-text">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-status">
          <span className="admin-status-dot" />

          <div>
            <strong>Tourism Analytics</strong>
            <p>Hệ thống quản trị</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar-home"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Mở website tham quan
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
