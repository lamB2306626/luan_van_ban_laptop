<template>
  <Form @submit="submitPhieuNhap" :validation-schema="phieuNhapFormSchema">
    <!-- Mã Phiếu Nhập: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Phiếu Nhập:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="phieuNhapLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Chọn Nhân Viên Lập Phiếu -->
    <div class="form-group mb-3">
      <label for="id_nhan_vien">
        Nhân Viên Lập Phiếu <span class="text-danger">*</span>:
      </label>
      <Field
        name="id_nhan_vien"
        as="select"
        class="form-control form-select"
        v-model="phieuNhapLocal.id_nhan_vien"
      >
        <option value="">-- Chọn Nhân Viên --</option>
        <option v-for="nv in dsNhanVien" :key="nv.id" :value="nv.id">
          {{ nv.ho_ten }} ({{ nv.id }})
        </option>
      </Field>
      <ErrorMessage name="id_nhan_vien" class="text-danger small" />
    </div>

    <!-- Ngày Nhập -->
    <div class="form-group mb-3">
      <label for="ngay_nhap">
        Ngày Nhập <span class="text-danger">*</span>:
      </label>
      <Field
        name="ngay_nhap"
        type="datetime-local"
        class="form-control"
        v-model="phieuNhapLocal.ngay_nhap"
      />
      <ErrorMessage name="ngay_nhap" class="text-danger small" />
    </div>

    <!-- Tổng Tiền (Nếu hiển thị dạng readonly khi sửa) -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="tong_tien">Tổng Tiền (VNĐ):</label>
      <input
        type="text"
        class="form-control fw-bold text-success"
        :value="formatCurrency(phieuNhapLocal.tong_tien)"
        disabled
      />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4">
      <button class="btn btn-primary">
        <i class="fas fa-save me-1"></i> Lưu lại
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import NhanVienService from "@/services/nhan-vien.service";

export default {
  name: "PhieuNhapForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    phieuNhap: {
      type: Object,
      default: () => ({
        id_nhan_vien: "",
        ngay_nhap: new Date().toISOString().slice(0, 16), // Định dạng YYYY-MM-DDTHH:mm cho datetime-local
        tong_tien: 0,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:phieuNhap"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu bằng Yup
    const phieuNhapFormSchema = yup.object().shape({
      id_nhan_vien: yup.string().required("Vui lòng chọn nhân viên lập phiếu."),
      ngay_nhap: yup.string().required("Vui lòng chọn ngày nhập hàng."),
    });

    return {
      phieuNhapLocal: { ...this.phieuNhap },
      dsNhanVien: [],
      phieuNhapFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props phieuNhap thay đổi (khi lấy dữ liệu từ API về)
    phieuNhap: {
      handler(newVal) {
        let formattedDate = newVal.ngay_nhap;
        if (newVal.ngay_nhap) {
          // Format ISO string về dạng YYYY-MM-DDTHH:mm để khớp với ô input datetime-local
          formattedDate = new Date(newVal.ngay_nhap)
            .toISOString()
            .slice(0, 16);
        }
        this.phieuNhapLocal = { ...newVal, ngay_nhap: formattedDate };
      },
      deep: true,
    },
  },
  methods: {
    // Định dạng tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Lấy danh sách Nhân Viên cho ô Select Dropdown
    async fetchNhanVien() {
      try {
        if (NhanVienService) {
          this.dsNhanVien = await NhanVienService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhân viên:", error);
      }
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitPhieuNhap() {
      this.$emit("submit:phieuNhap", this.phieuNhapLocal);
    },

    // Chuyển hướng quay lại trang danh sách phiếu nhập
    cancel() {
      this.$router.push({ name: "phieu-nhap.home" });
    },
  },
  async mounted() {
    await this.fetchNhanVien();
  },
};
</script>