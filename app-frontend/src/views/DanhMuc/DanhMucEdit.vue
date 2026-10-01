<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Danh Mục</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu danhMucData đã được lấy về từ API -->
    <DanhMucForm
      v-if="danhMucData"
      :danhMuc="danhMucData"
      :isEdit="true"
      @submit:danhMuc="updateDanhMuc"
      @cancel="returnDMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import DanhMucForm from "@/components/DanhMuc/DanhMucForm.vue";
import DanhMucService from "@/services/danh-muc.service";

export default {
  name: "DanhMucEdit",
  components: {
    DanhMucForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      danhMucData: null,
      message: "",
    };
  },
  methods: {
    async getDanhMuc(id) {
      try {
        this.danhMucData = await DanhMucService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Danh Mục này.";
      }
    },

    async updateDanhMuc(data) {
      try {
        await DanhMucService.update(this.id, data);
        this.message = "Cập nhật Danh Mục thành công!";

        setTimeout(() => {
          this.$router.push({ name: "danh-muc.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Danh Mục.";
        this.message = errorMessage;
      }
    },
    returnDMView() {
      this.$router.push({ name: "danh-muc.home" });
    },
  },
  created() {
    this.getDanhMuc(this.id);
  },
};
</script>
