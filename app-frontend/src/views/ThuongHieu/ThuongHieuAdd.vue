<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Thương Hiệu</h4>

    <ThuongHieuForm
      :thuongHieu="thuongHieuData"
      :isEdit="false"
      @submit:thuongHieu="createThuongHieu"
      @cancel="returnTHView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import ThuongHieuForm from "@/components/ThuongHieu/ThuongHieuForm.vue";
import ThuongHieuService from "@/services/thuong-hieu.service";

export default {
  name: "ThuongHieuAdd",
  components: {
    ThuongHieuForm,
  },
  data() {
    return {
      thuongHieuData: {
        ten_thuong_hieu: "",
        lo_go: "",
        mo_ta: "",
      },
      message: "",
    };
  },
  methods: {
    async createThuongHieu(formData) {
      try {
        await ThuongHieuService.create(formData);
        this.message = "Thêm Thương Hiệu mới thành công!";

        // Chờ 1 giây để hiển thị thông báo trước khi quay về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "thuong-hieu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Thương Hiệu.";
        this.message = errorMessage;
      }
    },

    returnTHView() {
      this.$router.push({ name: "thuong-hieu.home" });
    },
  },
};
</script>
