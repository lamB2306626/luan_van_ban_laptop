<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật CPU</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu cpuData đã được lấy về từ API -->
    <CpuForm
      v-if="cpuData"
      :cpu="cpuData"
      :isEdit="true"
      @submit:cpu="updateCpu"
      @cancel="returnCPUView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import CpuForm from "@/components/Cpu/CpuForm.vue";
import CpuService from "@/services/cpu.service";

export default {
  name: "CpuEdit",
  components: {
    CpuForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      cpuData: null,
      message: "",
    };
  },
  methods: {
    async getCpu(id) {
      try {
        this.cpuData = await CpuService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu CPU này.";
      }
    },

    async updateCpu(data) {
      try {
        await CpuService.update(this.id, data);
        this.message = "Cập nhật CPU thành công!";

        setTimeout(() => {
          this.$router.push({ name: "cpu.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật CPU.";
        this.message = errorMessage;
      }
    },
    returnCPUView() {
      this.$router.push({ name: "cpu.home" });
    },
  },
  created() {
    this.getCpu(this.id);
  },
};
</script>
