<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Phiếu Nhập</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu phieuNhapData đã được lấy về từ API -->
    <PhieuNhapForm
      v-if="phieuNhapData"
      :phieuNhap="phieuNhapData"
      :isEdit="true"
      @submit:phieuNhap="updatePhieuNhap"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import PhieuNhapForm from "@/components/PhieuNhap/PhieuNhapForm.vue";
import PhieuNhapService from "@/services/phieu-nhap.service";

export default {
  name: "PhieuNhapEdit",
  components: {
    PhieuNhapForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      phieuNhapData: null,
      message: "",
    };
  },
  methods: {
    async getPhieuNhap(id) {
      try {
        this.phieuNhapData = await PhieuNhapService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Phiếu Nhập này.";
      }
    },

    async updatePhieuNhap(data) {
      try {
        await PhieuNhapService.update(this.id, data);
        this.message = "Cập nhật Phiếu Nhập thành công!";

        setTimeout(() => {
          this.$router.push({ name: "phieu-nhap.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Phiếu Nhập.";
        this.message = errorMessage;
      }
    },
  },
  created() {
    this.getPhieuNhap(this.id);
  },
};
</script>