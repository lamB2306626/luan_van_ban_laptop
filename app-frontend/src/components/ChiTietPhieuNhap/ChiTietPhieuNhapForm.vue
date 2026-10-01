<template>
  <Form @submit="submitChiTiet" :validation-schema="chiTietFormSchema">
    <!-- Mã Phiếu Nhập & Mã Chi Tiết (Hiển thị disabled khi Edit) -->
    <div v-if="isEdit" class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id">Mã Chi Tiết:</label>
        <Field
          name="id"
          type="text"
          class="form-control"
          v-model="chiTietLocal.id"
          disabled
        />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_phieu_nhap">Mã Phiếu Nhập:</label>
        <Field
          name="id_phieu_nhap"
          type="text"
          class="form-control"
          v-model="chiTietLocal.id_phieu_nhap"
          disabled
        />
      </div>
    </div>

    <!-- Chọn Biến Thể Sản Phẩm -->
    <div class="row">
      <div v-if="!isEdit" class="col-md-12 form-group mb-3">
        <label class="fw-bold mb-1">
          Biến Thể <span class="text-danger">*</span>:
        </label>

        <Field
          name="id_bien_the"
          v-slot="{ field }"
          v-model="chiTietLocal.id_bien_the"
        >
          <!-- Component Chọn Biến Thể 2 Cấp Mới -->
          <SelectBienTheTwoSteps
            v-model="chiTietLocal.id_bien_the"
            :ds-bien-the="dsBienThe"
            :disabled="isEdit"
          />
        </Field>

        <!-- VeeValidate Bắt Lỗi Đúng Tên Field "id_bien_the" -->
        <ErrorMessage
          name="id_bien_the"
          class="text-danger small mt-1 d-block"
        />
      </div>
      <div v-else class="col-md-12 form-group mb-3">
        <label for="id_bien-the">Biến thể:</label>
        <Field
          name="id_bien_the"
          type="text"
          class="form-control"
          v-model="chiTietLocal.id_bien_the"
          disabled
        />
      </div>
    </div>

    <!-- Số lượng & Giá nhập -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="so_luong_nhap"
          >Số Lượng Nhập <span class="text-danger">*</span>:</label
        >
        <Field
          name="so_luong_nhap"
          type="number"
          min="1"
          class="form-control"
          v-model.number="chiTietLocal.so_luong_nhap"
          placeholder="VD: 10"
        />
        <ErrorMessage name="so_luong_nhap" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="gia_nhap"
          >Đơn Giá Nhập (VNĐ) <span class="text-danger">*</span>:</label
        >
        <Field
          name="gia_nhap"
          type="number"
          step="1000"
          min="0"
          class="form-control"
          v-model.number="chiTietLocal.gia_nhap"
          placeholder="VD: 12000000"
        />
        <ErrorMessage name="gia_nhap" class="text-danger small" />
      </div>
    </div>

    <!-- Thành tiền (Tự động tính) -->
    <div class="row">
      <div class="col-md-12 form-group mb-3">
        <label>Thành Tiền (Tạm tính):</label>
        <input
          type="text"
          class="form-control fw-bold text-success fs-5"
          :value="formatCurrency(thanhTien)"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4 text-end">
      <button type="button" class="btn btn-secondary me-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
      <button class="btn btn-primary">
        <i class="fas fa-save me-1"></i>
        {{ isEdit ? "Cập nhật chi tiết" : "Thêm vào phiếu" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

// Import Service lấy danh sách Biến thể sản phẩm
import BienTheService from "@/services/bien-the.service";

import SelectBienTheTwoSteps from "@/components/ChiTietPhieuNhap/SelectBienTheTwoSteps.vue";

export default {
  name: "ChiTietPhieuNhapForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    SelectBienTheTwoSteps,
  },
  props: {
    chiTiet: {
      type: Object,
      default: () => ({
        id_phieu_nhap: "",
        id_bien_the: "",
        so_luong_nhap: 1,
        gia_nhap: 0,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:chiTiet", "cancel"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu
    const chiTietFormSchema = yup.object().shape({
      id_bien_the: yup.string().required("Vui lòng chọn sản phẩm / biến thể."),
      so_luong_nhap: yup
        .number()
        .typeError("Số lượng phải là chữ số.")
        .required("Số lượng không được để trống.")
        .min(1, "Số lượng phải lớn hơn 0."),
      gia_nhap: yup
        .number()
        .typeError("Đơn giá phải là chữ số.")
        .required("Đơn giá nhập không được để trống.")
        .min(0, "Đơn giá không được nhỏ hơn 0."),
    });

    return {
      chiTietLocal: { ...this.chiTiet },
      dsBienThe: [],
      chiTietFormSchema,
    };
  },
  computed: {
    // Tự động tính Thành tiền = Số lượng * Đơn giá
    thanhTien() {
      const sl = Number(this.chiTietLocal.so_luong_nhap) || 0;
      const dg = Number(this.chiTietLocal.gia_nhap) || 0;
      return sl * dg;
    },
  },
  watch: {
    chiTiet: {
      handler(newVal) {
        this.chiTietLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Format tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Hiển thị nhãn Biến Thể trực quan trong Dropdown
    formatTenBienThe(bt) {
      const tenSp = bt.san_pham?.ten_san_pham || "Sản phẩm";
      const cpu = bt.cpu?.ten_cpu ? ` - ${bt.cpu.ten_cpu}` : "";
      const gpu = bt.gpu?.ten_gpu ? ` - ${bt.gpu.ten_gpu}` : "";
      const ram = bt.dung_luong_ram?.dung_luong_ram
        ? ` - RAM ${bt.dung_luong_ram.dung_luong_ram}`
        : "";
      const rom = bt.dung_luong_rom?.dung_luong_rom
        ? ` - ROM ${bt.dung_luong_rom.dung_luong_rom}`
        : "";
      const mau = bt.mau_sac?.ten_mau_sac ? ` - ${bt.mau_sac.ten_mau_sac}` : "";
      return `[${bt.id}] ${tenSp}${cpu}${gpu}${ram}${rom}${mau}`;
    },

    // Nạp danh sách biến thể sản phẩm cho ô Dropdown
    async fetchDropdownData() {
      try {
        if (BienTheService) {
          this.dsBienThe = await BienTheService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách Biến Thể:", error);
      }
    },

    submitChiTiet() {
      // Gửi dữ liệu kèm theo giá trị thành tiền đã tự động tính
      this.$emit("submit:chiTiet", {
        ...this.chiTietLocal,
        thanh_tien: this.thanhTien,
      });
    },

    cancel() {
      this.$emit("cancel");
    },
  },
  async mounted() {
    await this.fetchDropdownData();
  },
};
</script>
