<template>
  <Form
    ref="innerForm"
    @submit="submitSanPham"
    :validation-schema="sanPhamFormSchema"
  >
    <!-- Mã Sản Phẩm: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Sản Phẩm:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="sanPhamLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Trạng Thái -->
    <div v-if="isEdit" class="form-group mb-3">
      Trạng thái:
      <span
        v-if="sanPham.trang_thai === 'DANG_KINH_DOANH'"
        class="badge bg-success"
      >
        Đang kinh doanh
      </span>
      <span
        v-else-if="sanPham.trang_thai === 'NGUNG_KINH_DOANH'"
        class="badge bg-secondary"
      >
        Ngừng kinh doanh
      </span>
      <span
        v-else-if="sanPham.trang_thai === 'DANG_HOAN_THIEN'"
        class="badge bg-warning text-dark"
      >
        Đang hoàn thiện
      </span>
      <span v-else class="badge bg-light text-dark">Khác</span>
    </div>

    <!-- Tên Sản Phẩm -->
    <div class="form-group mb-3">
      <label for="ten_san_pham"
        >Tên Sản Phẩm <span class="text-danger">*</span>:</label
      >
      <Field
        name="ten_san_pham"
        type="text"
        class="form-control"
        v-model="sanPhamLocal.ten_san_pham"
        placeholder="Nhập tên sản phẩm (VD: Laptop Asus ROG Strix)..."
        @input="emitChange"
        :disabled="!canManageSanPham"
      />
      <ErrorMessage name="ten_san_pham" class="text-danger small" />
    </div>

    <!-- Trạng Thái -->
    <!-- <div class="form-group mb-3 form-check">
      <input
        type="checkbox"
        class="form-check-input"
        id="trang_thai"
        v-model="sanPhamLocal.trang_thai"
      />
      <label class="form-check-label" for="trang_thai">Đang kinh doanh</label>
    </div> -->

    <!-- Mã Thương Hiệu -->
    <div class="form-group mb-3">
      <label for="id_thuong_hieu"
        >Thương Hiệu <span class="text-danger">*</span>:</label
      >
      <div class="input-group">
        <Field name="id_thuong_hieu" v-model="sanPhamLocal.id_thuong_hieu">
          <BaseSearchSelect
            v-model="sanPhamLocal.id_thuong_hieu"
            :options="dsThuongHieu"
            label-key="ten_thuong_hieu"
            value-key="id"
            placeholder="Nhập tên hoặc mã Thương Hiệu để tìm..."
            class="flex-grow-1"
            @update:modelValue="emitChange"
            :disabled="!canManageSanPham"
          >
            <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
            <!-- <template #option="{ item }">
              <span class="fw-bold text-secondary">[{{ item.id }}]</span>
              {{ item.ten_thuong_hieu }}
            </template> -->
          </BaseSearchSelect>
        </Field>
        <button
          type="button"
          class="btn btn-outline-success"
          title="Thêm thương hiệu mới"
          @click="openQuickCreate('thuong-hieu')"
          :disabled="!canManageSanPham"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="id_thuong_hieu" class="text-danger small" />
    </div>

    <!-- Mã Danh Mục -->
    <div class="form-group mb-3">
      <label for="id_danh_muc"
        >Danh Mục <span class="text-danger">*</span>:</label
      >
      <div class="input-group">
        <Field name="id_danh_muc" v-model="sanPhamLocal.id_danh_muc">
          <BaseSearchSelect
            v-model="sanPhamLocal.id_danh_muc"
            :options="dsDanhMuc"
            label-key="ten_danh_muc"
            value-key="id"
            placeholder="Nhập tên hoặc mã Danh Mục để tìm..."
            class="flex-grow-1"
            @update:modelValue="emitChange"
            :disabled="!canManageSanPham"
          >
            <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
            <!-- <template #option="{ item }">
              <span class="fw-bold text-secondary">[{{ item.id }}]</span>
              {{ item.ten_danh_mục }}
            </template> -->
          </BaseSearchSelect>
        </Field>
        <button
          type="button"
          class="btn btn-outline-success"
          title="Thêm danh mục mới"
          @click="openQuickCreate('danh-muc')"
          :disabled="!canManageSanPham"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="id_danh_muc" class="text-danger small" />
    </div>

    <!-- Danh sách Nhà Cung Cấp -->
    <div class="form-group mb-3">
      <label>Nhà Cung Cấp <span class="text-danger">*</span>:</label>
      <div class="input-group">
        <Field
          name="danh_sach_nha_cung_cap"
          v-model="sanPhamLocal.danh_sach_nha_cung_cap"
          v-slot="{ errors }"
        >
          <!-- Component chọn nhiều nhà cung cấp -->
          <BaseMultiSearchSelect
            v-model="sanPhamLocal.danh_sach_nha_cung_cap"
            :options="dsNhaCungCap"
            label-key="ten_ncc"
            value-key="id"
            placeholder="Chọn các nhà cung cấp sản phẩm..."
            :invalid="errors.length > 0"
            @update:modelValue="emitChange"
            :disabled="!canManageSanPham"
          />
        </Field>

        <button
          type="button"
          class="btn btn-outline-success"
          title="Thêm danh mục mới"
          @click="openQuickCreate('nha-cung-cap')"
          :disabled="!canManageSanPham"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="danh_sach_nha_cung_cap" class="text-danger small" />
    </div>

    <!-- Mô tả -->
    <div class="form-group mb-3">
      <label for="mo_ta">Mô tả:</label>
      <Field
        name="mo_ta"
        as="textarea"
        rows="3"
        class="form-control"
        v-model="sanPhamLocal.mo_ta"
        placeholder="Nhập mô tả cho sản phẩm (nếu có)..."
        @input="emitChange"
        :disabled="!canManageSanPham"
      />
      <ErrorMessage name="mo_ta" class="text-danger small" />
    </div>

    <!-------- KHOẢNG UPLOAD NHIỀU ẢNH SẢN PHẨM ---- -->
    <Field
      name="previewImages"
      v-model="sanPhamLocal.previewImages"
      v-slot="{ errors }"
    >
      <ProductImageUploader
        v-model="sanPhamLocal.previewImages"
        :initial-images="sanPhamLocal.anh_san_pham"
        :canManageSanPham="canManageSanPham"
        @update:modelValue="emitChange"
      />
      <ErrorMessage name="previewImages" class="text-danger small" />
    </Field>

    <!-- Các nút hành động -->
    <div v-if="showSubmitButton" class="form-group mt-4">
      <button
        class="btn btn-primary"
        :class="{ 'btn-permission-muted': !canManageSanPham }"
      >
        <i class="fas fa-save"></i> Lưu thông tin
      </button>
    </div>
  </Form>

  <!-- Đặt QuickCreateModal ở cuối Template -->
  <QuickCreateModal ref="quickCreateModal" @created="handleQuickCreated" />
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import DanhMucService from "@/services/danh-muc.service";
import ThuongHieuService from "@/services/thuong-hieu.service";
import NhaCungCapService from "@/services/nha-cung-cap.service";

// Import Modal Thêm Nhanh Dùng Chung
import QuickCreateModal from "@/components/Common/QuickCreateModal.vue";

// Import Modal Vừa tìm, vừa chọn Dùng Chung
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";
import ProductImageUploader from "@/components/SanPham/ProductImageUploader.vue";

export default {
  name: "SanPhamForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    QuickCreateModal,
    BaseSearchSelect,
    BaseMultiSearchSelect,
    ProductImageUploader,
  },
  props: {
    sanPham: {
      type: Object,
      default: () => ({
        ten_san_pham: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        danh_sach_nha_cung_cap: [], // <-- Thay id_nha_cc thành mảng này
        mo_ta: "",
        trang_thai: true,
        anh_san_pham: [],
        // Mảng lưu danh sách ảnh hiển thị preview
        // Mỗi phần tử có cấu trúc: { file: File|null, url: string, la_anh_chinh: boolean, isOld: boolean, id?: string }
        previewImages: [],
      }),
    },
    isEdit: { type: Boolean, default: false },
    canManageSanPham: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
    // Điều khiển ẩn/hiện nút submit để khi dùng component này trong trang thêm sản phẩm thì bỏ nút lưu ra cho đẹp
    showSubmitButton: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:sanPham", "submit:sanPham"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const sanPhamFormSchema = yup.object().shape({
      ten_san_pham: yup
        .string()
        .required("Tên sản phẩm không được để trống.")
        .min(2, "Tên sản phẩm phải có ít nhất 2 ký tự.")
        .max(50, "Tên sản phẩm không được vượt quá 50 ký tự."),
      id_thuong_hieu: yup
        .string()
        .required("Mã thương hiệu không được để trống.")
        .max(8, "Mã thương hiệu không vượt quá 8 ký tự."),
      id_danh_muc: yup
        .string()
        .required("Mã danh mục không được để trống.")
        .max(8, "Mã danh mục không vượt quá 8 ký tự."),
      danh_sach_nha_cung_cap: yup
        .array()
        .of(yup.mixed()) // Đảm bảo Yup nhận dạng đúng mảng phần tử
        .min(1, "Vui lòng chọn ít nhất 1 nhà cung cấp.")
        .required("Vui lòng chọn ít nhất 1 nhà cung cấp."),
      mo_ta: yup.string().nullable(),
      previewImages: yup
        .array()
        .of(yup.mixed()) // Đảm bảo Yup nhận dạng đúng mảng phần tử
        .min(1, "Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm.")
        .required("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm."),
    });

    return {
      sanPhamLocal: {
        previewImages: [], // Đảm bảo previewImages luôn là mảng
        ...this.sanPham,
      },

      dsDanhMuc: [],
      dsThuongHieu: [],
      dsNhaCungCap: [],
      sanPhamFormSchema,
    };
  },

  watch: {
    // Cập nhật lại dữ liệu local khi props `sanPham` thay đổi (khi load dữ liệu edit về)
    sanPham: {
      handler(newVal) {
        this.sanPhamLocal = { ...newVal };

        // Trích xuất id của sanPhamLocal.danh_sach_nha_cung_cap để truyền vào trong BaseMultiSearchSelectm (chọn ds nhà cung cấp)
        // component này thực hiện so sánh mảng id này với mảng ds tất cả id nhà cung cấp để xác định được giá trị được tick chọn
        // ban đầu
        if (Array.isArray(newVal.nha_cung_cap_san_pham)) {
          this.sanPhamLocal.danh_sach_nha_cung_cap =
            newVal.nha_cung_cap_san_pham.map((item) => item.id_nha_cc);
        }
      },
      deep: true,
      immediate: true,
    },
  },

  methods: {
    // ==================== Phát tín hiệu không có quyền thực hiện thao tác ====================
    notifyAccessDenied(message = "Bạn không có quyền thực hiện thao tác này!") {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },

    emitChange() {
      this.$nextTick(() => {
        this.$emit("update:sanPham", this.sanPhamLocal);
      });
    },

    // Lấy dữ liệu danh mục, thương hiệu, nhà cung cấp cho các ô Dropdown Select
    async fetchDropdownData() {
      try {
        const [dms, ths, nccs] = await Promise.all([
          DanhMucService.getAll({}),
          ThuongHieuService.getAll({}),
          NhaCungCapService.getAll({}),
        ]);
        this.dsDanhMuc = dms;
        this.dsThuongHieu = ths;
        this.dsNhaCungCap = nccs;
      } catch (error) {
        console.log("Lỗi khi nạp danh mục cho Form:", error);
      }
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitSanPham() {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }

      const formData = new FormData();
      formData.append("ten_san_pham", this.sanPhamLocal.ten_san_pham);
      formData.append("id_thuong_hieu", this.sanPhamLocal.id_thuong_hieu);
      formData.append("id_danh_muc", this.sanPhamLocal.id_danh_muc);
      formData.append("mo_ta", this.sanPhamLocal.mo_ta);

      formData.append(
        "danh_sach_nha_cung_cap",
        JSON.stringify(this.sanPhamLocal.danh_sach_nha_cung_cap),
      );

      // Đảm bảo previewImages là mảng trước khi dùng JSON.stringify
      formData.append(
        "la_anh_chinh",
        JSON.stringify(this.sanPhamLocal.previewImages || []),
      );

      this.sanPhamLocal.previewImages?.forEach((img) => {
        if (img && img.file) {
          formData.append("images", img.file);
        }
      });

      this.$emit("submit:sanPham", formData);
    },

    // Chuyển hướng quay lại trang danh sách sản phẩm
    cancel() {
      this.$router.push({ name: "san-pham.home" });
    },

    // Mở Modal Thêm Nhanh (truyền loại: 'thuong-hieu' | 'danh-muc' | 'nha-cung-cap')
    openQuickCreate(type) {
      if (this.$refs.quickCreateModal) {
        this.$refs.quickCreateModal.open(type);
      }
    },

    // Nhận kết quả từ QuickCreateModal -> Tải lại danh sách -> Chọn tự động mục vừa tạo
    async handleQuickCreated({ type, data }) {
      await this.fetchDropdownData(); // Cập nhật lại toàn bộ danh sách select

      const createdId = data?.data.id;
      if (!createdId) return;

      // Gán ID vừa tạo vào ô Select tương ứng
      if (type === "thuong-hieu") {
        this.sanPhamLocal.id_thuong_hieu = createdId;
      } else if (type === "danh-muc") {
        this.sanPhamLocal.id_danh_muc = createdId;
      } else if (type === "nha-cung-cap") {
        const i = this.sanPhamLocal.danh_sach_nha_cung_cap.length;
        this.sanPhamLocal.danh_sach_nha_cung_cap[i] = createdId;
      }
    },
  },
  async mounted() {
    // 1. Lấy dsThuongHieu, dsDanhMuc thông qua fetchDropdownData
    await this.fetchDropdownData();

    // 2. Sau khi đã có dsThuongHieu, dsDanhMuc,.. mới gán dữ liệu cho form Edit
    if (this.isEdit) {
      this.sanPhamLocal = { ...this.sanPham };
      // Gán nha_cung_cap_san_pham (dữ liệu trả về từ backend) vào cho
      // this.sanPhamLocal.danh_sach_nha_cung_cap (thuộc tính đại diện cho danh sách nhà cung cấp của sản phẩm hiện tại)
      // để hiển thị cho form edit
      this.sanPhamLocal.danh_sach_nha_cung_cap =
        this.sanPham.nha_cung_cap_san_pham.map((item) => item.id_nha_cc);
    }
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.image-card {
  transition: all 0.2s ease-in-out;
}
.border-dashed {
  border-style: dashed !important;
}
</style>

<style scoped>
.btn-permission-muted {
  opacity: 0.45;
  cursor: pointer;
}

.btn-permission-muted:hover {
  opacity: 0.65;
}
</style>
