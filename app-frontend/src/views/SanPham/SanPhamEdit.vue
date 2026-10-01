<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Sản Phẩm</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu sanPhamData đã được lấy về từ API -->
    <SanPhamForm
      v-if="sanPhamData"
      :sanPham="sanPhamData"
      :isEdit="true"
      @submit:sanPham="updateSanPham"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import SanPhamForm from "@/components/SanPham/SanPhamForm.vue";
import SanPhamService from "@/services/san-pham.service";

export default {
  name: "SanPhamEdit",
  components: {
    SanPhamForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      sanPhamData: null,
      message: "",
    };
  },
  methods: {
    async getSanPham(id) {
      try {
        this.sanPhamData = await SanPhamService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Sản Phẩm này.";
      }
    },

    async updateSanPham(data) {
      try {
        await SanPhamService.update(this.id, data);
        this.message = "Cập nhật Sản Phẩm thành công!";

        setTimeout(() => {
          this.$router.push({ name: "san-pham.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Sản Phẩm.";
        this.message = errorMessage;
      }
    },
  },
  created() {
    this.getSanPham(this.id);
  },
};
</script>