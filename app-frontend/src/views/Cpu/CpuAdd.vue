<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới CPU</h4>

    <CpuForm
      :cpu="cpuData"
      :isEdit="false"
      @submit:cpu="createCpu"
      @cancel="returnCPUView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import CpuForm from "@/components/Cpu/CpuForm.vue";
import CpuService from "@/services/cpu.service";

export default {
  name: "CpuAdd",
  components: {
    CpuForm,
  },
  data() {
    return {
      cpuData: {
        ten_cpu: "",
      },
      message: "",
    };
  },
  methods: {
    async createCpu(data) {
      try {
        await CpuService.create(data);
        this.message = "Thêm CPU mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "cpu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới CPU.";
        this.message = errorMessage;
      }
    },
    returnCPUView() {
      this.$router.push({ name: "cpu.home" });
    },
  },
};
</script>
