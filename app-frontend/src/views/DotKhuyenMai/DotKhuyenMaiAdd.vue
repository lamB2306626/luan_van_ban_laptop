<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Đợt Khuyến Mãi</h4>

    <DotKhuyenMaiForm
      :dotKhuyenMai="dotKhuyenMaiData"
      :isEdit="false"
      @submit:dotKhuyenMai="addDotKhuyenMai"
      @cancel="returnView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import DotKhuyenMaiForm from "@/components/DotKhuyenMai/DotKhuyenMaiForm.vue";
import DotKhuyenMaiService from "@/services/dot-khuyen-mai.service";

export default {
  name: "DotKhuyenMaiAdd",
  components: {
    DotKhuyenMaiForm,
  },
  data() {
    return {
      dotKhuyenMaiData: {
        ten_dot: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: "",
      },
      message: "",
    };
  },
  methods: {
    async addDotKhuyenMai(data) {
      try {
        await DotKhuyenMaiService.create(data);
        this.message = "Thêm mới Đợt Khuyến Mãi thành công!";

        setTimeout(() => {
          this.$router.push({ name: "dot-khuyen-mai.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Đợt Khuyến Mãi.";
        this.message = errorMessage;
      }
    },
    returnView() {
      this.$router.push({ name: "dot-khuyen-mai.home" });
    },
  },
};
</script>