<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật ROM</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu romData đã được lấy về từ API -->
    <RomForm
      v-if="romData"
      :rom="romData"
      :isEdit="true"
      @submit:rom="updateRom"
      @cancel="returnROMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import RomForm from "@/components/Rom/RomForm.vue";
import RomService from "@/services/rom.service";

export default {
  name: "RomEdit",
  components: {
    RomForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      romData: null,
      message: "",
    };
  },
  methods: {
    async getRom(id) {
      try {
        this.romData = await RomService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu ROM này.";
      }
    },

    async updateRom(data) {
      try {
        await RomService.update(this.id, data);
        this.message = "Cập nhật ROM thành công!";

        setTimeout(() => {
          this.$router.push({ name: "rom.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật ROM.";
        this.message = errorMessage;
      }
    },
    returnROMView() {
      this.$router.push({ name: "rom.home" });
    },
  },
  created() {
    this.getRom(this.id);
  },
};
</script>
