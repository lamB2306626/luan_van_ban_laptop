<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Nhà Cung Cấp</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu nhaCungCapData đã được lấy về từ API -->
    <NhaCungCapForm
      v-if="nhaCungCapData"
      :nhaCungCap="nhaCungCapData"
      :isEdit="true"
      @submit:nhaCungCap="updateNhaCungCap"
      @cancel="returnNCCView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import NhaCungCapForm from "@/components/NhaCungCap/NhaCungCapForm.vue";
import NhaCungCapService from "@/services/nha-cung-cap.service";

export default {
  name: "NhaCungCapEdit",
  components: {
    NhaCungCapForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      nhaCungCapData: null,
      message: "",
    };
  },
  methods: {
    async getNhaCungCap(id) {
      try {
        this.nhaCungCapData = await NhaCungCapService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Nhà Cung Cấp này.";
      }
    },

    async updateNhaCungCap(data) {
      try {
        await NhaCungCapService.update(this.id, data);
        this.message = "Cập nhật Nhà Cung Cấp thành công!";

        setTimeout(() => {
          this.$router.push({ name: "nha-cung-cap.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Nhà Cung Cấp.";
        this.message = errorMessage;
      }
    },
    returnNCCView() {
      this.$router.push({ name: "nha-cung-cap.home" });
    },
  },
  created() {
    this.getNhaCungCap(this.id);
  },
};
</script>
