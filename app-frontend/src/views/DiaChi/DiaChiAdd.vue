<template>
  <div class="diachi-add-container">
    <div class="card shadow-sm border-0 p-4">
      <h4 class="mb-4 text-primary fw-bold">Thêm Địa Chỉ Mới</h4>

      <!-- Thông báo lỗi (nếu có) -->
      <div v-if="errorMessage" class="alert alert-danger p-2 mb-3">
        {{ errorMessage }}
      </div>

      <!-- Gọi Component AddressSelector với 2 sự kiện submit và cancel mới -->
      <AddressSelector
        :is-loading="isSubmitting"
        @submit:address="handleSubmit"
        @cancel="cancel"
      />
    </div>
  </div>
</template>

<script>
import AddressSelector from "@/components/DiaChi/AddressSelector.vue";
import DiaChiService from "@/services/dia-chi.service";

export default {
  name: "DiaChiAdd",
  components: {
    AddressSelector,
  },
  data() {
    return {
      isSubmitting: false,
      errorMessage: "",
    };
  },

  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
  },
  methods: {
    // Submit tạo mới địa chỉ - Nhận addressData trực tiếp từ event
    async handleSubmit(addressData) {
      // if (!this.validateForm(addressData)) return;

      this.isSubmitting = true;

      const payload = {
        id_khach_hang: this.currentUser.id,
        ten_nguoi_nhan: addressData.ten_nguoi_nhan,
        sdt_nguoi_nhan: addressData.sdt_nguoi_nhan,
        dia_chi_cu_the: addressData.dia_chi_cu_the,
        province_id: String(addressData.province_id),
        ten_tinh: addressData.ten_tinh,
        district_id: String(addressData.district_id),
        ten_huyen: addressData.ten_huyen,
        ward_code: String(addressData.ward_code),
        ten_xa: addressData.ten_xa,
        la_mac_dinh: Boolean(addressData.la_mac_dinh),
      };

      try {
        await DiaChiService.create(payload);
        alert("Thêm địa chỉ thành công!");
        // this.$router.back();
      } catch (error) {
        console.error("Lỗi thêm địa chỉ:", error);
        if (error.response?.data?.message === "KHACH_HANG_KHONG_TON_TAI") {
          this.errorMessage =
            "Tài khoản khách hàng không hợp lệ trên hệ thống!";
        } else {
          this.errorMessage =
            error.response?.data?.message || "Đã xảy ra lỗi khi thêm địa chỉ!";
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    cancel() {
      this.$router.back();
    },
  },
};
</script>

<style scoped>
.diachi-add-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
