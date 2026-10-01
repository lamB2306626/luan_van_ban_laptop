<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Hạng Thành Viên</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu hangThanhVienData đã được lấy về từ API -->
    <HangThanhVienForm
      v-if="hangThanhVienData"
      :hangThanhVien="hangThanhVienData"
      :isEdit="true"
      @submit:hangThanhVien="updateHangThanhVien"
      @cancel="returnHTVView"
    />

    <p v-if="message" class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import HangThanhVienForm from "@/components/HangThanhVien/HangThanhVienForm.vue";
import HangThanhVienService from "@/services/hang-thanh-vien.service";

export default {
  name: "HangThanhVienEdit",
  components: {
    HangThanhVienForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      hangThanhVienData: null,
      message: "",
    };
  },
  methods: {
    // Lấy thông tin Hạng Thành Viên theo ID
    async getHangThanhVien(id) {
      try {
        this.hangThanhVienData = await HangThanhVienService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Hạng Thành Viên này.";
      }
    },

    // Cập nhật Hạng Thành Viên
    async updateHangThanhVien(data) {
      try {
        await HangThanhVienService.update(this.id, data);
        this.message = "Cập nhật Hạng Thành Viên thành công!";

        setTimeout(() => {
          this.$router.push({ name: "hang-thanh-vien.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Hạng Thành Viên.";
        this.message = errorMessage;
      }
    },

    // Quay về trang danh sách
    returnHTVView() {
      this.$router.push({ name: "hang-thanh-vien.home" });
    },
  },
  created() {
    this.getHangThanhVien(this.id);
  },
};
</script>