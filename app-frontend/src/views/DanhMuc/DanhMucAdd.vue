<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Danh Mục</h4>

    <DanhMucForm
      :danhMuc="danhMucData"
      :isEdit="false"
      @submit:danhMuc="createDanhMuc"
      @cancel="returnDMView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import DanhMucForm from "@/components/DanhMuc/DanhMucForm.vue";
import DanhMucService from "@/services/danh-muc.service";

export default {
  name: "DanhMucAdd",
  components: {
    DanhMucForm,
  },
  data() {
    return {
      danhMucData: {
        ten_danh_muc: "",
        mo_ta: "",
      },
      message: "",
    };
  },
  methods: {
    async createDanhMuc(data) {
      try {
        await DanhMucService.create(data);
        this.message = "Thêm Danh Mục mới thành công!";

        // Chờ 1 giây để người dùng đọc thông báo rồi điều hướng về trang danh sách
        setTimeout(() => {
          this.$router.push({ name: "danh-muc.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Danh Mục.";
        this.message = errorMessage;
      }
    },
    returnDMView() {
      this.$router.push({ name: "danh-muc.home" });
    },
  },
};
</script>
