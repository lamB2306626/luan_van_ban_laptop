<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Nhà Cung Cấp</h4>

    <NhaCungCapForm
      :nhaCungCap="nhaCungCapData"
      :isEdit="false"
      @submit:nhaCungCap="createNhaCungCap"
      @cancel="returnNCCView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import NhaCungCapForm from "@/components/NhaCungCap/NhaCungCapForm.vue";
import NhaCungCapService from "@/services/nha-cung-cap.service";

export default {
  name: "NhaCungCapAdd",
  components: {
    NhaCungCapForm,
  },
  data() {
    return {
      nhaCungCapData: {
        ten_ncc: "",
        so_dien_thoai: "",
        email: "",
        dia_chi: "",
      },
      message: "",
    };
  },
  methods: {
    async createNhaCungCap(data) {
      try {
        await NhaCungCapService.create(data);
        this.message = "Thêm Nhà Cung Cấp mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "nha-cung-cap.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Nhà Cung Cấp.";
        this.message = errorMessage;
      }
    },
    returnNCCView() {
      this.$router.push({ name: "nha-cung-cap.home" });
    },
  },
};
</script>
