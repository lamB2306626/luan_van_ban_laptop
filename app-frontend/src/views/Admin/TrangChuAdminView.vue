<template>
  <div class="container-fluid py-4 px-3 px-md-4">
    <!-- Phần chào mừng -->
    <div
      class="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom"
    >
      <div>
        <h3 class="fw-bold text-dark mb-1">Trung tâm quản trị</h3>
        <p class="text-muted mb-0">
          Xin chào, <strong class="text-primary">{{ adminName }}</strong> — chọn
          khu vực chức năng để bắt đầu làm việc.
        </p>
      </div>
      <span
        v-if="adminRole"
        class="badge bg-light text-secondary border px-3 py-2 mt-2 mt-sm-0"
      >
        Vai trò: {{ adminRole }}
      </span>
    </div>

    <!-- Danh sách 5 nhóm chức năng chính -->
    <div class="row g-4">
      <div
        v-for="group in moduleGroups"
        :key="group.key"
        class="col-12 col-md-6 col-xl-4"
      >
        <div
          class="card h-100 border-0 shadow-sm rounded-4 hub-card"
          :class="{ 'hub-card-muted': !canAccessGroup(group) }"
          @click="handleSelectGroup(group)"
        >
          <div class="card-body p-4 d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div
                class="icon-box rounded-3 d-flex align-items-center justify-content-center"
                :class="group.iconBgClass"
              >
                <i :class="[group.icon, group.iconColorClass, 'fs-4']"></i>
              </div>

              <span
                v-if="!canAccessGroup(group)"
                class="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2 py-1"
              >
                <i class="fas fa-lock me-1"></i>Hạn chế quyền
              </span>
              <i v-else class="fas fa-arrow-right text-muted arrow-icon"></i>
            </div>

            <h5 class="fw-bold text-dark mb-2">{{ group.title }}</h5>
            <p class="text-muted small mb-0 flex-grow-1">
              {{ group.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Đổi lại các giá trị chuỗi dưới đây cho khớp chính xác với mã/tên vai trò trong DB/adminUser của bạn
const ROLES = {
  KHO: "Nhân viên kho",
  MARKETING: "Nhân viên Marketing",
  BAN_HANG: "Nhân viên bán hàng",
  QUAN_TRI: "Quản trị viên",
};

export default {
  name: "TrangChuAdminView",
  data() {
    return {
      adminUser: null,
      moduleGroups: [
        {
          key: "product-config",
          title: "Quản lý Sản phẩm & Cấu hình",
          description:
            "Quản lý sản phẩm, biến thể, danh mục, thương hiệu và thông số cấu hình.",
          icon: "fas fa-laptop",
          iconBgClass: "bg-primary-subtle",
          iconColorClass: "text-primary",
          routeName: "san-pham.home",
          allowedRoles: [
            ROLES.KHO,
            ROLES.MARKETING,
            ROLES.BAN_HANG,
            ROLES.QUAN_TRI,
          ],
        },
        {
          key: "warehouse",
          title: "Quản lý Kho",
          description: "Theo dõi tồn kho, lập và quản lý phiếu nhập hàng.",
          icon: "fas fa-warehouse",
          iconBgClass: "bg-warning-subtle",
          iconColorClass: "text-warning",
          routeName: "phieu-nhap.home",
          allowedRoles: [ROLES.KHO, ROLES.QUAN_TRI],
        },
        {
          key: "order-cskh",
          title: "Quản lý Đơn hàng & CSKH",
          description:
            "Xử lý đơn đặt hàng, vận chuyển, đánh giá và hỗ trợ khách hàng.",
          icon: "fas fa-box-open",
          iconBgClass: "bg-success-subtle",
          iconColorClass: "text-success",
          routeName: "don-hang.home",
          allowedRoles: [ROLES.BAN_HANG, ROLES.QUAN_TRI],
        },
        {
          key: "promotion-media",
          title: "Khuyến mãi & Truyền thông",
          description:
            "Quản lý đợt khuyến mãi, voucher giảm giá và thông báo hệ thống.",
          icon: "fas fa-bullhorn",
          iconBgClass: "bg-info-subtle",
          iconColorClass: "text-info",
          routeName: "dot-khuyen-mai.home",
          allowedRoles: [ROLES.MARKETING, ROLES.BAN_HANG, ROLES.QUAN_TRI],
        },
        {
          key: "staff",
          title: "Quản lý nhân viên",
          description:
            "Quản lý tài khoản nhân viên, phân quyền và thông tin nội bộ.",
          icon: "fas fa-users-cog",
          iconBgClass: "bg-secondary-subtle",
          iconColorClass: "text-secondary",
          routeName: "nhan-vien.home",
          allowedRoles: [ROLES.QUAN_TRI],
        },
      ],
    };
  },
  computed: {
    adminName() {
      return this.adminUser?.ho_ten || "Quản trị viên";
    },
    adminRole() {
      return this.adminUser?.vai_tro?.ten_vai_tro || "";
    },
    currentRoleIdentifiers() {
      const vt = this.adminUser?.vai_tro;
      if (!vt) return [];
      if (typeof vt === "string") return [vt];
      return [vt.ten_vai_tro].filter(Boolean);
    },
  },
  created() {
    try {
      const raw = localStorage.getItem("adminUser");
      this.adminUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.adminUser = null;
    }
  },
  methods: {
    canAccessGroup(group) {
      if (
        !Array.isArray(group?.allowedRoles) ||
        group.allowedRoles.length === 0
      ) {
        return true;
      }
      return this.currentRoleIdentifiers.some((roleVal) =>
        group.allowedRoles.includes(roleVal),
      );
    },
    handleSelectGroup(group) {
      if (!this.canAccessGroup(group) || !group?.routeName) {
        this.notifyAccessDenied("Bạn không có quyền truy cập chức năng này!");
        return;
      }

      this.$router.push({ name: group.routeName });
    },

    notifyAccessDenied(message) {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },
  },
};
</script>

<style scoped>
.hub-card {
  cursor: pointer;
  background-color: #ffffff;
  border: 1px solid transparent;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.hub-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.75rem 1.5rem rgba(15, 23, 42, 0.08) !important;
}

/* Giao diện nền xám kiểu nút bị disable nhưng vẫn cho phép click hiện thông báo */
.hub-card-muted {
  background-color: #e9ecef !important;
  border-color: #dee2e6;
  box-shadow: none !important;
}

.arrow-icon {
  transition:
    transform 0.18s ease,
    color 0.18s ease;
}

.icon-box {
  width: 52px;
  height: 52px;
}
</style>
