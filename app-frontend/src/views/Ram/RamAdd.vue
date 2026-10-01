<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới RAM</h4>

    <RamForm
      :ram="ramData"
      :isEdit="false"
      @submit:ram="createRam"
      @cancel="returnRAMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import RamForm from "@/components/Ram/RamForm.vue";
import RamService from "@/services/ram.service";

export default {
  name: "RamAdd",
  components: {
    RamForm,
  },
  data() {
    return {
      ramData: {
        dung_luong_ram: "",
      },
      message: "",
    };
  },
  methods: {
    async createRam(data) {
      try {
        await RamService.create(data);
        this.message = "Thêm RAM mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "ram.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới RAM.";
        this.message = errorMessage;
      }
    },
    returnRAMView() {
      this.$router.push({ name: "ram.home" });
    },
  },
};
</script>
