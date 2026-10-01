<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật RAM</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu ramData đã được lấy về từ API -->
    <RamForm
      v-if="ramData"
      :ram="ramData"
      :isEdit="true"
      @submit:ram="updateRam"
      @cancel="returnRAMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import RamForm from "@/components/Ram/RamForm.vue";
import RamService from "@/services/ram.service";

export default {
  name: "RamEdit",
  components: {
    RamForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      ramData: null,
      message: "",
    };
  },
  methods: {
    async getRam(id) {
      try {
        this.ramData = await RamService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu RAM này.";
      }
    },

    async updateRam(data) {
      try {
        await RamService.update(this.id, data);
        this.message = "Cập nhật RAM thành công!";

        setTimeout(() => {
          this.$router.push({ name: "ram.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật RAM.";
        this.message = errorMessage;
      }
    },
    returnRAMView() {
      this.$router.push({ name: "ram.home" });
    },
  },
  created() {
    this.getRam(this.id);
  },
};
</script>
