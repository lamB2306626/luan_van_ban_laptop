<template>
  <Form @submit="submitChiTiet" :validation-schema="chiTietFormSchema">
    <!-- Mã Phiếu Nhập & Mã Chi Tiết (Hiển thị disabled khi Edit) -->
    <div v-if="hasRealIds" class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id" class="form-label fw-semibold">Mã Chi Tiết:</label>
        <Field
          name="id"
          type="text"
          class="form-control bg-light"
          v-model="chiTietLocal.id"
          disabled
        />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_phieu_nhap" class="form-label fw-semibold"
          >Mã Phiếu Nhập:</label
        >
        <Field
          name="id_phieu_nhap"
          type="text"
          class="form-control bg-light"
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
          <SelectBienTheTwoSteps
            v-model="chiTietLocal.id_bien_the"
            :ds-bien-the="dsBienThe"
            :ds-danh-muc="dsDanhMuc"
            :ds-thuong-hieu="dsThuongHieu"
            :dsIdBienTheDaCo="dsIdBienTheDaCo"
            :selected-supplier-id="idNcc"
            :disabled="!idNcc"
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
import DanhMucService from "@/services/danh-muc.service";
import ThuongHieuService from "@/services/thuong-hieu.service";

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
    idNcc: { type: String, default: "" },
    isEdit: { type: Boolean, default: false },

    // Mảng ID sản phẩm đã tồn tại từ cha xuống để disable không cho chọn lại
    // sản phẩm đã có trong phiếu nhập này trong form thêm mới
    dsIdBienTheDaCo: {
      type: Array,
      default: () => [],
    },
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
        .min(0, "Số lượng phải lớn hơn 0."),
      gia_nhap: yup
        .number()
        .typeError("Đơn giá phải là chữ số.")
        .required("Đơn giá nhập không được để trống.")
        .min(0, "Đơn giá không được nhỏ hơn 0."),
    });

    return {
      chiTietLocal: { ...this.chiTiet },
      dsBienThe: [],
      dsDanhMuc: [],
      dsThuongHieu: [],
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

    // Kiểm tra xem record có mã định danh thật từ DB hay không
    hasRealIds() {
      const id = this.chiTietLocal?.id;

      // Nếu không có ID hoặc ID là mã tạm (bắt đầu bằng CT_TAM_) -> Ẩn
      if (!id || (typeof id === "string" && id.startsWith("CT_TAM_"))) {
        return false;
      }

      // Có ID thật từ DB -> Hiện
      return true;
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

    // Lấy danh sách Thương Hiệu cho ô BaseSelect
    async fetchThuongHieu() {
      try {
        if (ThuongHieuService) {
          this.dsThuongHieu = await ThuongHieuService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thương hiệu:", error);
      }
    },

    // Lấy danh sách Danh Mục cho ô BaseSelect
    async fetchDanhMuc() {
      try {
        if (DanhMucService) {
          this.dsDanhMuc = await DanhMucService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
      }
    },

    submitChiTiet() {
      // 1. Tìm đối tượng biến thể đầy đủ thông tin trong danh sách dsBienThe
      const selectedBienThe = this.dsBienThe.find(
        (item) => item.id === this.chiTietLocal.id_bien_the,
      );

      // 2. Gửi dữ liệu ra ngoài cho component cha
      this.$emit("submit:chiTiet", {
        ...this.chiTietLocal, // Giữ nguyên các thông tin id_bien_the, so_luong_nhap, gia_nhap...
        thanh_tien: this.thanhTien, // Thành tiền tự động tính
        bien_the: selectedBienThe || null, // Đính kèm object biến thể (chứa CPU, GPU, RAM, Tên SP...)
      });
    },

    cancel() {
      this.$emit("cancel");
    },
  },
  async mounted() {
    await this.fetchDropdownData();
    await this.fetchDanhMuc();
    await this.fetchThuongHieu();
  },
};
</script>
