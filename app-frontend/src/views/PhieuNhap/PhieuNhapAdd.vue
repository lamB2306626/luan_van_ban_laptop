<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Phiếu Nhập</h4>

    <PhieuNhapForm @submit:phieuNhap="createPhieuNhap" />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import PhieuNhapForm from "@/components/PhieuNhap/PhieuNhapForm.vue";
import PhieuNhapService from "@/services/phieu-nhap.service";

export default {
  name: "PhieuNhapAdd",
  components: {
    PhieuNhapForm,
  },
  data() {
    return {
      message: "",
    };
  },
  methods: {
    async createPhieuNhap(data) {
      try {
        await PhieuNhapService.create(data);
        this.message = "Thêm Phiếu Nhập thành công!";

        setTimeout(() => {
          this.$router.push({ name: "phieu-nhap.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm Phiếu Nhập.";
        this.message = errorMessage;
      }
    },
  },
};
</script>