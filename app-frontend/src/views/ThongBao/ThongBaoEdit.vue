<template>
  <div class="container mt-3 col-md-6">
    <h4>Cập Nhật Thông Báo</h4>

    <!-- Chỉ hiển thị Form khi dữ liệu thongBaoData đã được lấy về từ API -->
    <ThongBaoForm
      v-if="thongBaoData"
      :thongBao="thongBaoData"
      :isEdit="true"
      @submit:thongBao="updateThongBao"
      @cancel="returnTBView"
    />

    <p class="mt-2 text-info">{{ message }}</p>
  </div>
</template>

<script>
import ThongBaoForm from "@/components/ThongBao/ThongBaoForm.vue";
import ThongBaoService from "@/services/thong-bao.service";

export default {
  name: "ThongBaoEdit",
  components: {
    ThongBaoForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp từ Router
  },
  data() {
    return {
      thongBaoData: null,
      message: "",
    };
  },
  methods: {
    async getThongBao(id) {
      try {
        this.thongBaoData = await ThongBaoService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu Thông Báo này.";
      }
    },

    async updateThongBao(formData) {
      try {
        // Gom chung data và gửi 1 lần duy nhất
        // const payload = {
        //   ...formData.thongBao,
        // };

        await ThongBaoService.update(this.id, formData);
        this.message = "Cập nhật Thông Báo thành công!";

        setTimeout(() => {
          this.$router.push({ name: "thong-bao.home" });
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật Thông Báo.";
        this.message = errorMessage;
      }
    },
    returnTBView() {
      this.$router.push({ name: "thong-bao.home" });
    },
  },
  created() {
    this.getThongBao(this.id);
  },
};
</script>
