<template>
  <Form @submit="submitThongBao" :validation-schema="thongBaoFormSchema">
    <!-- Mã Thông Báo: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Thông Báo:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="thongBaoLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tiêu Đề Thông Báo -->
    <div class="form-group mb-3">
      <label for="tieu_de">
        Tiêu đề thông báo <span class="text-danger">*</span>:
      </label>
      <Field
        name="tieu_de"
        type="text"
        class="form-control"
        v-model="thongBaoLocal.tieu_de"
        placeholder="Nhập tiêu đề thông báo..."
      />
      <ErrorMessage name="tieu_de" class="text-danger small d-block mt-1" />
    </div>

    <!-- Nội Dung Thông Báo -->
    <div class="form-group mb-3">
      <label for="noi_dung">
        Nội dung thông báo <span class="text-danger">*</span>:
      </label>
      <Field
        name="noi_dung"
        as="textarea"
        rows="5"
        class="form-control"
        v-model="thongBaoLocal.noi_dung"
        placeholder="Nhập nội dung thông báo..."
      />
      <ErrorMessage name="noi_dung" class="text-danger small d-block mt-1" />
    </div>

    <!-- Liên Kết Kèm Theo (Không bắt buộc) -->
    <div class="form-group mb-3">
      <label for="lien_ket">Liên kết kèm theo (nếu có):</label>
      <Field
        name="lien_ket"
        type="text"
        class="form-control"
        v-model="thongBaoLocal.lien_ket"
      />
      <ErrorMessage name="lien_ket" class="text-danger small d-block mt-1" />
    </div>

    <!-- PHẦN TÙY CHỌN PHÂN PHÁT NGAY KHI TẠO   -->
    <div v-if="!isEdit" class="border-top pt-3 mt-4 mb-3">
      <div class="form-check mb-3">
        <input
          class="form-check-input cursor-pointer"
          type="checkbox"
          id="isSendImmediately"
          v-model="isSendImmediately"
        />
        <label
          class="form-check-label fw-bold cursor-pointer text-primary"
          for="isSendImmediately"
        >
          <i class="fas fa-paper-plane me-1"></i> Phân phát thông báo này ngay
          sau khi tạo
        </label>
      </div>

      <!-- Khối chọn Khách hàng chỉ hiện khi checkbox được tích -->
      <div v-if="isSendImmediately" class="card card-body bg-light">
        <!-- Bọc bằng Field của Vee-Validate -->
        <Field name="ds_khach_hang_id" v-slot="{ handleChange }">
          <CustomerSelector
            @update:selectedIds="
              (data) => handleCustomerChange(data, handleChange)
            "
          />
        </Field>
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group">
      <button class="btn btn-primary">
        <i class="fas fa-save"></i> Lưu lại
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times"></i> Hủy
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import CustomerSelector from "@/components/Common/CustomerSelector.vue";

export default {
  name: "ThongBaoForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    CustomerSelector,
  },
  props: {
    thongBao: {
      type: Object,
      default: () => ({ tieu_de: "", noi_dung: "", lien_ket: "" }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:thongBao", "cancel"],
  data() {
    return {
      thongBaoLocal: { ...this.thongBao },
      isSendImmediately: false, // có gửi thông báo hay không (có tích vào ô checkbox không)
      isSubmitting: false,
      customerData: {
        type: "GROUP",
        ds_khach_hang_id: [],
      },
    };
  },
  computed: {
    // Validation schema kiểm tra dữ liệu bằng Yup
    thongBaoFormSchema() {
      return yup.object().shape({
        tieu_de: yup
          .string()
          .required("Tiêu đề thông báo không được để trống.")
          .min(5, "Tiêu đề phải có ít nhất 5 ký tự.")
          .max(128, "Tiêu đề không được vượt quá 128 ký tự."),
        noi_dung: yup
          .string()
          .required("Nội dung thông báo không được để trống.")
          .min(10, "Nội dung phải có ít nhất 10 ký tự."),
        lien_ket: yup
          .string()
          .nullable()
          .max(128, "Liên kết không được vượt quá 128 ký tự."),
        ds_khach_hang_id: yup.array().when([], {
          is: () =>
            this.isSendImmediately && this.customerData.type === "CUSTOM",
          then: (schema) =>
            schema.min(1, "Vui lòng chọn ít nhất 1 khách hàng."),
        }),
      });
    },
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `thongBao` thay đổi (khi load dữ liệu edit về)
    thongBao: {
      handler(newVal) {
        this.thongBaoLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    handleCustomerChange({ type, ids }) {
      this.customerData.type = type;
      this.customerData.ds_khach_hang_id = ids;

      if (typeof handleChange === "function") {
        handleChange(ids);
      }
    },
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitThongBao() {
      // Đảm bảo nếu người dùng chọn danh sách khách hàng rồi mà đổi ý bỏ tích gửi thông báo thì sẽ không tính ds_khach_hang_id
      const ds_khach_hang = this.isSendImmediately
        ? this.customerData.ds_khach_hang_id
        : [];

      this.$emit("submit:thongBao", {
        ...this.thongBaoLocal,
        danh_sach_id_khach_hang: ds_khach_hang,
      });
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài
      this.$emit("cancel");
    },
  },
};
</script>
