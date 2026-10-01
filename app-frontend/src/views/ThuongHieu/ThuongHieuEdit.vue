<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Thương Hiệu</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu thuongHieuData đã được lấy về từ API -->
    <ThuongHieuForm
      v-if="thuongHieuData"
      :thuongHieu="thuongHieuData"
      :isEdit="true"
      @submit:thuongHieu="updateThuongHieu"
      @cancel="returnTHView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import ThuongHieuForm from "@/components/ThuongHieu/ThuongHieuForm.vue";
import ThuongHieuService from "@/services/thuong-hieu.service";

export default {
  name: "ThuongHieuEdit",
  components: {
    ThuongHieuForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props[cite: 2]
  },
  data() {
    return {
      thuongHieuData: null,
      message: "",
    };
  },
  methods: {
    async getThuongHieu(id) {
      try {
        this.thuongHieuData = await ThuongHieuService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Thương Hiệu này.";
      }
    },

    async updateThuongHieu(formData) {
      try {
        await ThuongHieuService.update(this.id, formData);
        this.message = "Cập nhật Thương Hiệu thành công!";

        setTimeout(() => {
          this.$router.push({ name: "thuong-hieu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Thương Hiệu.";
        this.message = errorMessage;
      }
    },
    returnTHView() {
      this.$router.push({ name: "thuong-hieu.home" });
    },
  },
  created() {
    this.getThuongHieu(this.id);
  },
};
</script>
