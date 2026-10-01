<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Màu Sắc</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu mauSacData đã được lấy về từ API -->
    <MauSacForm
      v-if="mauSacData"
      :mauSac="mauSacData"
      :isEdit="true"
      @submit:mauSac="updateMauSac"
      @cancel="returnMSView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import MauSacForm from "@/components/MauSac/MauSacForm.vue";
import MauSacService from "@/services/mau-sac.service";

export default {
  name: "MauSacEdit",
  components: {
    MauSacForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      mauSacData: null,
      message: "",
    };
  },
  methods: {
    async getMauSac(id) {
      try {
        this.mauSacData = await MauSacService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Màu Sắc này.";
      }
    },

    async updateMauSac(data) {
      try {
        await MauSacService.update(this.id, data);
        this.message = "Cập nhật Màu Sắc thành công!";

        setTimeout(() => {
          this.$router.push({ name: "mau-sac.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Màu Sắc.";
        this.message = errorMessage;
      }
    },
    returnMSView() {
      this.$router.push({ name: "mau-sac.home" });
    },
  },
  created() {
    this.getMauSac(this.id);
  },
};
</script>
