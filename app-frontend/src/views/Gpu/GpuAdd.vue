<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới GPU</h4>

    <GpuForm
      :gpu="gpuData"
      :isEdit="false"
      @submit:gpu="createGpu"
      @cancel="returnGPUView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import GpuForm from "@/components/Gpu/GpuForm.vue";
import GpuService from "@/services/gpu.service";

export default {
  name: "GpuAdd",
  components: {
    GpuForm,
  },
  data() {
    return {
      gpuData: {
        ten_gpu: "",
      },
      message: "",
    };
  },
  methods: {
    async createGpu(data) {
      try {
        await GpuService.create(data);
        this.message = "Thêm GPU mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "gpu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới GPU.";
        this.message = errorMessage;
      }
    },
    returnGPUView() {
      this.$router.push({ name: "gpu.home" });
    },
  },
};
</script>
