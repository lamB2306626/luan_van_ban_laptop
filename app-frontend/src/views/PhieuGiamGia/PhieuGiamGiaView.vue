<template>
  <div class="container mt-3">
    <h4>Quản lý Phiếu Giảm Giá</h4>

    <!-- Component Tìm kiếm Phiếu Giảm Giá -->
    <PhieuGiamGiaSearch
      v-model="filter"
      @submit="retrievePhieuGiamGias"
      @reset="retrievePhieuGiamGias"
    />

    <button class="btn btn-primary mb-3" @click="goToAddPhieuGiamGia">
      <i class="fas fa-plus"></i> Thêm mới Phiếu Giảm Giá
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllPhieuGiamGias">
      <i class="fas fa-trash"></i> Xóa tất cả Phiếu Giảm Giá
    </button>

    <button class="btn btn-success mb-3" @click="goToTangPhieuGiamGia">
      <i class="fas fa-gift me-1"></i> Tặng Phiếu Giảm Giá
    </button>

    <div class="table-responsive">
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-dark">
          <tr>
            <th>Mã Phiếu</th>
            <th>Tên Phiếu</th>
            <th>Giảm</th>
            <th>Ngày Bắt Đầu</th>
            <th>Ngày Hết Hạn</th>
            <th>Hiệu Lực</th>
            <th>Trạng Thái Khóa</th>
            <th style="width: 220px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="phieu in phieuGiamGias" :key="phieu.id">
            <td class="fw-bold text-primary">{{ phieu.id }}</td>
            <td>{{ phieu.ten_phieu }}</td>
            <td>
              <span class="fw-bold text-success">
                {{ formatGiaTriGiam(phieu.loai_phieu, phieu.gia_tri_giam) }}
              </span>
              <small v-if="phieu.giam_toi_da" class="d-block text-muted">
                Tối đa: {{ formatCurrency(phieu.giam_toi_da) }}
              </small>
              <small v-if="phieu.don_toi_thieu" class="d-block text-muted">
                Áp dụng cho đơn từ: {{ formatCurrency(phieu.don_toi_thieu) }}
              </small>
            </td>
            <td>{{ formatDate(phieu.ngay_bat_dau) }}</td>
            <td>{{ formatDate(phieu.ngay_het_han) }}</td>
            <td>
              <span
                class="badge"
                :class="
                  isKhaDung(phieu.ngay_bat_dau, phieu.ngay_het_han)
                    ? 'bg-success'
                    : 'bg-secondary'
                "
              >
                {{
                  isKhaDung(phieu.ngay_bat_dau, phieu.ngay_het_han)
                    ? "Còn hiệu lực"
                    : "Hết hiệu lực"
                }}
              </span>
            </td>
            <!-- Trạng thái (true: Hoạt động / false: Bị khóa) -->
            <td class="text-center">
              <span
                :class="[
                  'badge',
                  phieu.trang_thai ? 'bg-success' : 'bg-danger',
                ]"
              >
                {{ phieu.trang_thai ? "Hoạt động" : "Đã khóa" }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-sm btn-outline-success me-1"
                title="Tặng phiếu này"
                @click="goToTangPhieuGiamGiaOne(phieu.id)"
              >
                <i class="fas fa-gift"></i>
              </button>

              <button
                class="btn btn-sm btn-danger"
                @click="deletePhieuGiamGia(phieu.id)"
              >
                <i class="fas fa-trash"></i> Xóa
              </button>
            </td>
          </tr>

          <!-- Hiển thị khi danh sách rỗng -->
          <tr v-if="phieuGiamGias.length === 0">
            <td colspan="8" class="text-center text-muted py-3">
              Không tìm thấy phiếu giảm giá nào phù hợp.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import PhieuGiamGiaSearch from "@/components/PhieuGiamGia/PhieuGiamGiaSearch.vue";
import PhieuGiamGiaService from "@/services/phieu-giam-gia.service";

export default {
  name: "PhieuGiamGiaView",
  components: {
    PhieuGiamGiaSearch,
  },
  data() {
    return {
      phieuGiamGias: [],
      filter: {
        ma_phieu: "",
        ten_phieu: "",
        tu_ngay: "",
        den_ngay: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Phiếu Giảm Giá ====================
    async retrievePhieuGiamGias() {
      try {
        this.phieuGiamGias = await PhieuGiamGiaService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu giảm giá:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddPhieuGiamGia() {
      this.$router.push({ name: "phieu-giam-gia.add" });
    },

    // ==================== 3. Điều hướng tới form tăng phiếu ====================
    async goToTangPhieuGiamGia() {
      this.$router.push({ name: "tang-phieu" });
    },

    async goToTangPhieuGiamGiaOne(id) {
      this.$router.push({
        name: "tang-phieu",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Phiếu Giảm Giá ====================
    async deletePhieuGiamGia(id) {
      if (
        confirm(`Bạn có chắc chắn muốn xóa Phiếu Giảm Giá có mã "${id}" không?`)
      ) {
        try {
          await PhieuGiamGiaService.delete(id);
          alert("Xóa Phiếu Giảm Giá thành công!");
          this.retrievePhieuGiamGias();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa phiếu giảm giá ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Phiếu Giảm Giá ====================
    async deleteAllPhieuGiamGias() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Phiếu Giảm Giá không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Phiếu Giảm Giá sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await PhieuGiamGiaService.deleteAll();
            alert("Đã xóa thành công tất cả Phiếu Giảm Giá khỏi hệ thống!");
            this.retrievePhieuGiamGias();
          } catch (error) {
            console.error(error);
            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Phiếu Giảm Giá.";

            alert(errorMessage);
          }
        }
      }
    },

    // ==================== Helper: Format Ngày Tháng (DD/MM/YYYY) ====================
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    },

    // ==================== Helper: Format Tiền Tệ (VND) ====================
    formatCurrency(value) {
      if (value === null || value === undefined) return "0 ₫";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // ==================== Helper: Format Giá Trị Giảm theo Loại ====================
    formatGiaTriGiam(loaiPhieu, giaTri) {
      if (loaiPhieu === "PERCENT" || loaiPhieu === "PHAN_TRAM") {
        return `${giaTri}%`;
      }
      return this.formatCurrency(giaTri);
    },

    // ==================== Helper: Kiểm tra Trạng thái Khả dụng ====================
    isKhaDung(tuNgay, denNgay) {
      const now = new Date();
      const start = new Date(tuNgay);
      const end = new Date(denNgay);
      return now >= start && now <= end;
    },
  },

  mounted() {
    this.retrievePhieuGiamGias();
  },
};
</script>
