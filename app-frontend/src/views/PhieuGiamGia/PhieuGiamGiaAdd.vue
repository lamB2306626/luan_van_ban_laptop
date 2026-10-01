<template>
  <div class="container mt-3 col-md-7">
    <h4 class="mb-3">Thêm Mới Phiếu Giảm Giá</h4>

    <!-- Component Form Thêm Mới với isEdit = false -->
    <PhieuGiamGiaForm
      :isEdit="false"
      @submit:phieuGiamGia="createPhieuGiamGia"
      @cancel="returnView"
    />

    <p class="mt-2 text-info fw-bold">{{ message }}</p>
  </div>
</template>

<script>
import PhieuGiamGiaForm from "@/components/PhieuGiamGia/PhieuGiamGiaForm.vue";
import PhieuGiamGiaService from "@/services/phieu-giam-gia.service";

export default {
  name: "PhieuGiamGiaAdd",
  components: {
    PhieuGiamGiaForm,
  },
  data() {
    return {
      message: "",
    };
  },
  methods: {
    // ==================== Thêm mới Phiếu Giảm Giá ====================
    async createPhieuGiamGia(data) {
      try {
        await PhieuGiamGiaService.create(data);
        this.message = "Thêm mới Phiếu Giảm Giá thành công!";

        setTimeout(() => {
          this.$router.push({ name: "phieu-giam-gia.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Phiếu Giảm Giá.";
        this.message = errorMessage;
      }
    },

    // Quay lại trang danh sách
    returnView() {
      this.$router.push({ name: "phieu-giam-gia.home" });
    },
  },
};
</script>