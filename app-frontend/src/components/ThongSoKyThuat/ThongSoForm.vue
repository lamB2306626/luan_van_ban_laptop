<template>
  <Form @submit="submitThongSo" :validation-schema="thongSoFormSchema">
    <!-- Mã Thông Số & Mã Sản Phẩm: Chỉ hiển thị disabled khi Edit/Coid -->
    <div v-if="isEdit" class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id">Mã Thông Số:</label>
        <Field
          name="id"
          type="text"
          class="form-control"
          v-model="thongSoLocal.id"
          disabled
        />
        <ErrorMessage name="id" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_san_pham">Mã Sản Phẩm:</label>
        <Field
          name="id_san_pham"
          type="text"
          class="form-control"
          v-model="thongSoLocal.id_san_pham"
          disabled
        />
        <ErrorMessage name="id_san_pham" class="text-danger small" />
      </div>
    </div>

    <!-- Màn hình & Độ phân giải -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="kich_thuoc_man_hinh">Kích thước màn hình <span class="text-danger">*</span>:</label>
        <Field
          name="kich_thuoc_man_hinh"
          type="text"
          class="form-control"
          v-model="thongSoLocal.kich_thuoc_man_hinh"
          placeholder="VD: 15.6 inch, OLED, 120Hz..."
        />
        <ErrorMessage name="kich_thuoc_man_hinh" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="do_phan_giai">Độ phân giải <span class="text-danger">*</span>:</label>
        <Field
          name="do_phan_giai"
          type="text"
          class="form-control"
          v-model="thongSoLocal.do_phan_giai"
          placeholder="VD: FHD (1920 x 1080)..."
        />
        <ErrorMessage name="do_phan_giai" class="text-danger small" />
      </div>
    </div>

    <!-- Pin & Công suất sạc -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="dung_luong_pin">Dung lượng pin <span class="text-danger">*</span>:</label>
        <Field
          name="dung_luong_pin"
          type="text"
          class="form-control"
          v-model="thongSoLocal.dung_luong_pin"
          placeholder="VD: 4-cell, 70Wh..."
        />
        <ErrorMessage name="dung_luong_pin" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="cong_xuat_sac">Công suất sạc <span class="text-danger">*</span>:</label>
        <Field
          name="cong_xuat_sac"
          type="text"
          class="form-control"
          v-model="thongSoLocal.cong_xuat_sac"
          placeholder="VD: Type-C 100W, 200W Adapter..."
        />
        <ErrorMessage name="cong_xuat_sac" class="text-danger small" />
      </div>
    </div>

    <!-- Cổng kết nối & Wifi/Bluetooth -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="cong_ket_noi">Cổng kết nối <span class="text-danger">*</span>:</label>
        <Field
          name="cong_ket_noi"
          type="text"
          class="form-control"
          v-model="thongSoLocal.cong_ket_noi"
          placeholder="VD: 1x USB-C, 2x USB-A, 1x HDMI..."
        />
        <ErrorMessage name="cong_ket_noi" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="chuan_wifi_bluetooth">Chuẩn Wi-Fi / Bluetooth <span class="text-danger">*</span>:</label>
        <Field
          name="chuan_wifi_bluetooth"
          type="text"
          class="form-control"
          v-model="thongSoLocal.chuan_wifi_bluetooth"
          placeholder="VD: Wi-Fi 6E (802.11ax) + Bluetooth 5.3..."
        />
        <ErrorMessage name="chuan_wifi_bluetooth" class="text-danger small" />
      </div>
    </div>

    <!-- Trọng lượng & Chất liệu vỏ -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="trong_luong">Trọng lượng <span class="text-danger">*</span>:</label>
        <Field
          name="trong_luong"
          type="text"
          class="form-control"
          v-model="thongSoLocal.trong_luong"
          placeholder="VD: 1.8 kg..."
        />
        <ErrorMessage name="trong_luong" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="chat_lieu_vo">Chất liệu vỏ <span class="text-danger">*</span>:</label>
        <Field
          name="chat_lieu_vo"
          type="text"
          class="form-control"
          v-model="thongSoLocal.chat_lieu_vo"
          placeholder="VD: Vỏ nhôm nguyên khối, Vỏ nhựa..."
        />
        <ErrorMessage name="chat_lieu_vo" class="text-danger small" />
      </div>
    </div>

    <!-- Hệ điều hành -->
    <div class="form-group mb-3">
      <label for="he_dieu_hanh">Hệ điều hành <span class="text-danger">*</span>:</label>
      <Field
        name="he_dieu_hanh"
        type="text"
        class="form-control"
        v-model="thongSoLocal.he_dieu_hanh"
        placeholder="VD: Windows 11 Home..."
      />
      <ErrorMessage name="he_dieu_hanh" class="text-danger small" />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4">
      <button class="btn btn-primary">
        <i class="fas fa-save"></i> Lưu thông số
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

export default {
  name: "ThongSoForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    thongSo: {
      type: Object,
      default: () => ({
        kich_thuoc_man_hinh: "",
        do_phan_giai: "",
        dung_luong_pin: "",
        cong_xuat_sac: "",
        cong_ket_noi: "",
        chuan_wifi_bluetooth: "",
        trong_luong: "",
        chat_lieu_vo: "",
        he_dieu_hanh: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:thongSo", "cancel"],
  data() {
    // Validation schema ứng với độ dài giới hạn trong database Prisma
    const thongSoFormSchema = yup.object().shape({
      kich_thuoc_man_hinh: yup
        .string()
        .required("Kích thước màn hình không được để trống.")
        .max(30, "Tối đa 30 ký tự."),
      do_phan_giai: yup
        .string()
        .required("Độ phân giải không được để trống.")
        .max(50, "Tối đa 50 ký tự."),
      dung_luong_pin: yup
        .string()
        .required("Dung lượng pin không được để trống.")
        .max(50, "Tối đa 50 ký tự."),
      cong_xuat_sac: yup
        .string()
        .required("Công xuất sạc không được để trống.")
        .max(30, "Tối đa 30 ký tự."),
      cong_ket_noi: yup
        .string()
        .required("Cổng kết nối không được để trống.")
        .max(128, "Tối đa 128 ký tự."),
      chuan_wifi_bluetooth: yup
        .string()
        .required("Chuẩn wifi, bluetooth không được để trống.")
        .max(64, "Tối đa 64 ký tự."),
      trong_luong: yup
        .string()
        .required("Trọng Lượng không được để trống.")
        .max(20, "Tối đa 20 ký tự."),
      chat_lieu_vo: yup
        .string()
        .required("Chất liệu vỏ không được để trống.")
        .max(50, "Tối đa 50 ký tự."),
      he_dieu_hanh: yup
        .string()
        .required("Hệ điều hành không được để trống.")
        .max(50, "Tối đa 50 ký tự."),
    });

    return {
      thongSoLocal: { ...this.thongSo },
      thongSoFormSchema,
    };
  },
  watch: {
    thongSo: {
      handler(newVal) {
        this.thongSoLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    submitThongSo() {
      this.$emit("submit:thongSo", this.thongSoLocal);
    },
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>
