<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật GPU</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu gpuData đã được lấy về từ API -->
    <GpuForm
      v-if="gpuData"
      :gpu="gpuData"
      :isEdit="true"
      @submit:gpu="updateGpu"
      @cancel="returnGPUView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import GpuForm from "@/components/Gpu/GpuForm.vue";
import GpuService from "@/services/gpu.service";

export default {
  name: "GpuEdit",
  components: {
    GpuForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      gpuData: null,
      message: "",
    };
  },
  methods: {
    async getGpu(id) {
      try {
        this.gpuData = await GpuService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu GPU này.";
      }
    },

    async updateGpu(data) {
      try {
        await GpuService.update(this.id, data);
        this.message = "Cập nhật GPU thành công!";

        setTimeout(() => {
          this.$router.push({ name: "gpu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật GPU.";
        this.message = errorMessage;
      }
    },
    returnGPUView() {
      this.$router.push({ name: "gpu.home" });
    },
  },
  created() {
    this.getGpu(this.id);
  },
};
</script>
