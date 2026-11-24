<template>
  <div class="container mt-3 col-md-6">
    <h4>Thêm Mới Thông Báo</h4>

    <ThongBaoForm
      :thongBao="thongBaoData"
      :isEdit="false"
      @submit:thongBao="createThongBao"
      @cancel="returnTBView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import ThongBaoForm from "@/components/ThongBao/ThongBaoForm.vue";
import ThongBaoService from "@/services/thong-bao.service";

export default {
  name: "ThongBaoAdd",
  components: {
    ThongBaoForm,
  },
  data() {
    return {
      thongBaoData: {
        tieu_de: "",
        noi_dung: "",
        lien_ket: "",
      },
      message: "",
    };
  },
  methods: {
    async createThongBao(formData) {
      // Chuẩn bị dữ liệu gửi lên API
      const thongBaoData = {
        tieu_de: formData.tieu_de,
        noi_dung: formData.noi_dung,
        lien_ket: formData.lien_ket,
        danh_sach_id_khach_hang: formData.danh_sach_id_khach_hang,
        loai_thong_bao: "ADMIN_TAO",
      };
      try {
        await ThongBaoService.create(thongBaoData);
        this.message = "Thêm mới Thông Báo thành công!";

        setTimeout(() => {
          this.$router.push({ name: "thong-bao.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi thêm mới Thông Báo.";
        this.message = errorMessage;
      }
    },
    returnTBView() {
      this.$router.push({ name: "thong-bao.home" });
    },
  },
};
</script>
