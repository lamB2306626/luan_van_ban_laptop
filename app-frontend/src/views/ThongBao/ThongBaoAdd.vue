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
      // Gom chung data và gửi 1 lần duy nhất
      // const payload = {
      //   ...formData.thongBao,
      //   // Nếu có tích chọn gửi ngay thì truyền danh sách ID, ngược lại truyền mảng rỗng
      //   danh_sach_id_khach_hang: formData.isSendImmediately
      //     ? formData.customerIds
      //     : [],
      // };

      try {
        await ThongBaoService.create(formData);
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
