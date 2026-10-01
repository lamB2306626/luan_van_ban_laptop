<template>
  <div class="container mt-3 col-md-8">
    <div class="card shadow-sm">
      <div class="card-header bg-warning text-dark">
        <h5 class="mb-0">
          <i class="fas fa-user-edit me-2"></i>Cập Nhật Nhân Viên
        </h5>
      </div>
      <div class="card-body">
        <!-- Chỉ hiển thị Form khi dữ liệu nhanVienData đã được lấy về từ API -->
        <NhanVienOneForm
          v-if="nhanVienData"
          :nhanVien="nhanVienData"
          :isEdit="true"
          @submit:nhanVien="updateNhanVien"
          @cancel="goBack"
        />

        <div v-if="message" class="alert alert-info mt-3 mb-0" role="alert">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NhanVienOneForm from "@/components/NhanVien/NhanVienOneForm.vue";
import NhanVienService from "@/services/nhan-vien.service";

export default {
  name: "NhanVienEdit",
  components: {
    NhanVienOneForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      nhanVienData: null,
      message: "",
    };
  },
  methods: {
    async getNhanVien(id) {
      try {
        this.nhanVienData = await NhanVienService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu nhân viên này.";
      }
    },

    async updateNhanVien(data) {
      try {
        await NhanVienService.update(this.id, data);
        this.message = "Cập nhật nhân viên thành công!";

        // cập nhật lại localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const newUserInfo = { ...currentUser, ...data };
        localStorage.setItem("user", JSON.stringify(newUserInfo));

        setTimeout(() => {
          this.goBack();
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật nhân viên.";
        this.message = errorMessage;
      }
    },
    
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        // Trường hợp người dùng F5 trực tiếp hoặc dán URL vào trình duyệt, quay về trang mặc định
        this.$router.push({ name: "danh-muc.home" });
      }
    },
  },
  created() {
    this.getNhanVien(this.id);
  },
};
</script>
