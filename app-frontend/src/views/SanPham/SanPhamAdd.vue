<template>
  <div class="container mt-3">
    <h4>Thêm Mới Sản Phẩm</h4>

    <SanPhamAllForm
      :sanPham="sanPhamData"
      :isEdit="false"
      @submit:sanPham="createSanPham"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import SanPhamAllForm from "@/components/SanPham/SanPhamAllForm.vue";
import SanPhamService from "@/services/san-pham.service";

export default {
  name: "SanPhamAdd",
  components: {
    SanPhamAllForm,
  },
  data() {
    return {
      sanPhamData: {
        ten_san_pham: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        mo_ta: "",
        trang_thai: true,
      },
      message: "",
    };
  },
  methods: {
    async createSanPham(formData) {
      try {
        await SanPhamService.create(formData);
        this.message = "Thêm Sản Phẩm mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "san-pham.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Sản Phẩm.";
        this.message = errorMessage;
      }
    },
  },
};
</script>
