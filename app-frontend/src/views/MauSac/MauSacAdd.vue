<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Màu Sắc</h4>

    <MauSacForm
      :mauSac="mauSacData"
      :isEdit="false"
      @submit:mauSac="createMauSac"
      @cancel="returnMSView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import MauSacForm from "@/components/MauSac/MauSacForm.vue";
import MauSacService from "@/services/mau-sac.service";

export default {
  name: "MauSacAdd",
  components: {
    MauSacForm,
  },
  data() {
    return {
      mauSacData: {
        ten_mau_sac: "",
      },
      message: "",
    };
  },
  methods: {
    async createMauSac(data) {
      try {
        await MauSacService.create(data);
        this.message = "Thêm Màu Sắc mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "mau-sac.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Màu Sắc.";
        this.message = errorMessage;
      }
    },
    returnMSView() {
      this.$router.push({ name: "mau-sac.home" });
    },
  },
};
</script>
