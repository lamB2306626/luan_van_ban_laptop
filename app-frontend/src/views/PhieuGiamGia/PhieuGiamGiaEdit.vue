<template>
  <div class="container mt-3 col-md-7">
    <h4 class="mb-3">Cập Nhật Phiếu Giảm Giá</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu phieuGiamGiaData đã được lấy về từ API -->
    <PhieuGiamGiaForm
      v-if="phieuGiamGiaData"
      :phieuGiamGia="phieuGiamGiaData"
      :isEdit="true"
      @submit:phieuGiamGia="updatePhieuGiamGia"
      @cancel="returnView"
    />

    <p class="mt-2 text-info fw-bold">{{ message }}</p>
  </div>
</template>

<script>
import PhieuGiamGiaForm from "@/components/PhieuGiamGia/PhieuGiamGiaForm.vue";
import PhieuGiamGiaService from "@/services/phieu-giam-gia.service";

export default {
  name: "PhieuGiamGiaEdit",
  components: {
    PhieuGiamGiaForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận mã phiếu truyền trực tiếp từ Router params
  },
  data() {
    return {
      phieuGiamGiaData: null,
      message: "",
    };
  },
  methods: {
    // ==================== Lấy thông tin Chi tiết Phiếu Giảm Giá ====================
    async getPhieuGiamGia(id) {
      try {
        this.phieuGiamGiaData = await PhieuGiamGiaService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Phiếu Giảm Giá này.";
      }
    },

    // ==================== Cập nhật Phiếu Giảm Giá ====================
    async updatePhieuGiamGia(data) {
      try {
        await PhieuGiamGiaService.update(this.id, data);
        this.message = "Cập nhật Phiếu Giảm Giá thành công!";

        setTimeout(() => {
          this.$router.push({ name: "phieu-giam-gia.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Phiếu Giảm Giá.";
        this.message = errorMessage;
      }
    },

    // Quay lại trang danh sách
    returnView() {
      this.$router.push({ name: "phieu-giam-gia.home" });
    },
  },
  created() {
    this.getPhieuGiamGia(this.id);
  },
};
</script>