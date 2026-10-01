<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Đợt Khuyến Mãi</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu dotKhuyenMaiData đã được lấy về từ API -->
    <DotKhuyenMaiForm
      v-if="dotKhuyenMaiData"
      :dotKhuyenMai="dotKhuyenMaiData"
      :isEdit="true"
      @submit:dotKhuyenMai="updateDotKhuyenMai"
      @cancel="returnView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import DotKhuyenMaiForm from "@/components/DotKhuyenMai/DotKhuyenMaiForm.vue";
import DotKhuyenMaiService from "@/services/dot-khuyen-mai.service";

export default {
  name: "DotKhuyenMaiEdit",
  components: {
    DotKhuyenMaiForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp từ Router
  },
  data() {
    return {
      dotKhuyenMaiData: null,
      message: "",
    };
  },
  methods: {
    async getDotKhuyenMai(id) {
      try {
        this.dotKhuyenMaiData = await DotKhuyenMaiService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Đợt Khuyến Mãi này.";
      }
    },

    async updateDotKhuyenMai(data) {
      try {
        await DotKhuyenMaiService.update(this.id, data);
        this.message = "Cập nhật Đợt Khuyến Mãi thành công!";

        setTimeout(() => {
          this.$router.push({ name: "dot-khuyen-mai.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Đợt Khuyến Mãi.";
        this.message = errorMessage;
      }
    },

    returnView() {
      this.$router.push({ name: "dot-khuyen-mai.home" });
    },
  },
  created() {
    this.getDotKhuyenMai(this.id);
  },
};
</script>