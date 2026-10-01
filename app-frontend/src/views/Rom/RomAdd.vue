<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới ROM</h4>

    <RomForm
      :rom="romData"
      :isEdit="false"
      @submit:rom="createRom"
      @cancel="returnROMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import RomForm from "@/components/Rom/RomForm.vue";
import RomService from "@/services/rom.service";

export default {
  name: "RomAdd",
  components: {
    RomForm,
  },
  data() {
    return {
      romData: {
        dung_luong_rom: "",
      },
      message: "",
    };
  },
  methods: {
    async createRom(data) {
      try {
        await RomService.create(data);
        this.message = "Thêm ROM mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "rom.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới ROM.";
        this.message = errorMessage;
      }
    },
    returnROMView() {
      this.$router.push({ name: "rom.home" });
    },
  },
};
</script>
