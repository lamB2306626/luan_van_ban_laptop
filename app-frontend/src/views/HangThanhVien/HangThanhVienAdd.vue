<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Hạng Thành Viên</h4>

    <!-- Form Thêm mới với isEdit = false (mặc định) -->
    <HangThanhVienForm
      :isEdit="false"
      @submit:hangThanhVien="createHangThanhVien"
      @cancel="returnHTVView"
    />

    <p v-if="message" class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import HangThanhVienForm from "@/components/HangThanhVien/HangThanhVienForm.vue";
import HangThanhVienService from "@/services/hang-thanh-vien.service";

export default {
  name: "HangThanhVienAdd",
  components: {
    HangThanhVienForm,
  },
  data() {
    return {
      message: "",
    };
  },
  methods: {
    // Gọi Service tạo mới Hạng Thành Viên
    async createHangThanhVien(data) {
      try {
        await HangThanhVienService.create(data);
        this.message = "Thêm mới Hạng Thành Viên thành công!";

        setTimeout(() => {
          this.$router.push({ name: "hang-thanh-vien.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Hạng Thành Viên.";
        this.message = errorMessage;
      }
    },

    // Quay về trang danh sách
    returnHTVView() {
      this.$router.push({ name: "hang-thanh-vien.home" });
    },
  },
};
</script>