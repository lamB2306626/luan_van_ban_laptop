<template>
  <div class="container mt-3 col-md-8">
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0"><i class="fas fa-user-plus me-2"></i>Thêm Nhân Viên Mới</h5>
      </div>
      <div class="card-body">
        <NhanVienForm
          @submit:nhanVien="createNhanVien"
          @cancel="goBack"
        />

        <div v-if="message" class="alert alert-info mt-3 mb-0" role="alert">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NhanVienForm from "@/components/NhanVien/NhanVienForm.vue";
import NhanVienService from "@/services/nhan-vien.service";

export default {
  name: "NhanVienAdd",
  components: {
    NhanVienForm,
  },
  data() {
    return {
      message: "",
    };
  },
  methods: {
    async createNhanVien(data) {
      try {
        await NhanVienService.create(data);
        this.message = "Thêm nhân viên mới thành công!";

        setTimeout(() => {
          this.goBack();
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm nhân viên.";
        this.message = errorMessage;
      }
    },

    goBack() {
      this.$router.push({ name: "nhan-vien.home" });
    },
  },
};
</script>