<template>
  <Form @submit="submitSanPham" :validation-schema="sanPhamFormSchema">
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
      />
      <ErrorMessage name="ten_san_pham" class="text-danger small" />
    </div>

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
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="id_danh_muc" class="text-danger small" />
    </div>

    <!-- Mã Nhà Cung Cấp -->
    <div class="form-group mb-3">
      <label for="id_nha_cc"
        >Nhà Cung Cấp <span class="text-danger">*</span>:</label
      >
      <div class="input-group">
        <Field name="id_nha_cc" v-model="sanPhamLocal.id_nha_cc">
          <BaseSearchSelect
            v-model="sanPhamLocal.id_nha_cc"
            :options="dsNhaCungCap"
            label-key="ten_ncc"
            value-key="id"
            placeholder="Nhập tên hoặc mã Nhà Cung Cấp để tìm..."
            class="flex-grow-1"
          >
            <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
            <!-- <template #option="{ item }">
              <span class="fw-bold text-secondary">[{{ item.id }}]</span>
              {{ item.ten_ncc }}
            </template> -->
          </BaseSearchSelect>
        </Field>
        <button
          type="button"
          class="btn btn-outline-success"
          title="Thêm nhà cung cấp mới"
          @click="openQuickCreate('nha-cung-cap')"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="id_nha_cc" class="text-danger small" />
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
      />
      <ErrorMessage name="mo_ta" class="text-danger small" />
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

    <!-- ================= KHOẢNG UPLOAD NHIỀU ẢNH SẢN PHẨM ================= -->
    <div class="form-group mb-4 border rounded p-3 bg-light">
      <label class="fw-bold mb-2">
        <i class="fas fa-images me-1"></i> Hình Ảnh Sản Phẩm:
      </label>

      <!-- Nút chọn file -->
      <div class="mb-3">
        <input
          type="file"
          ref="fileInput"
          id="productImagesInput"
          class="d-none"
          multiple
          accept="image/*"
          @change="handleFileSelect"
        />
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          @click="triggerFileInput"
        >
          <i class="fas fa-cloud-upload-alt me-1"></i> Chọn danh sách ảnh
        </button>
        <small class="text-muted ms-2"
          >(Có thể chọn nhiều ảnh, nhấp radio để đặt ảnh đại diện chính)</small
        >
      </div>

      <!-- Danh sách ảnh Xem Trước (Preview List) -->
      <div v-if="previewImages.length > 0" class="row g-3">
        <div
          v-for="(img, index) in previewImages"
          :key="index"
          class="col-6 col-sm-4 col-md-3"
        >
          <div
            class="card h-100 position-relative image-card"
            :class="{ 'border-primary border-2 shadow-sm': img.la_anh_chinh }"
          >
            <!-- Badge Ảnh chính -->
            <span
              v-if="img.la_anh_chinh"
              class="position-absolute top-0 start-0 badge bg-primary m-1 z-1"
            >
              Ảnh chính
            </span>

            <!-- Nút xóa ảnh -->
            <button
              type="button"
              class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-0"
              style="width: 24px; height: 24px; line-height: 1"
              title="Xóa ảnh này"
              @click="removeImage(index)"
            >
              <i class="fas fa-times"></i>
            </button>

            <!-- Thẻ ảnh preview -->
            <div class="ratio ratio-1x1 overflow-hidden bg-white rounded-top">
              <img
                :src="img.url"
                class="card-img-top object-fit-cover"
                alt="Ảnh sản phẩm"
              />
            </div>

            <!-- Radio Chọn làm ảnh chính -->
            <div class="card-footer p-2 text-center bg-white">
              <div class="form-check d-inline-block m-0">
                <input
                  class="form-check-input cursor-pointer"
                  type="radio"
                  :name="'mainImageRadio'"
                  :id="'radioImg_' + index"
                  :checked="img.la_anh_chinh"
                  @change="setMainImage(index)"
                />
                <label
                  class="form-check-label small cursor-pointer"
                  :for="'radioImg_' + index"
                >
                  Ảnh chính
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center py-4 text-muted border border-dashed rounded bg-white"
      >
        <i class="fas fa-image fa-2x mb-2 d-block text-secondary"></i>
        Chưa có hình ảnh nào được chọn.
      </div>
    </div>
    <!-- =================================================================== -->

    <!-- Các nút hành động -->
    <div class="form-group">
      <button class="btn btn-primary">
        <i class="fas fa-save"></i> Lưu lại
      </button>
      <button
        v-if="!isEdit"
        type="button"
        class="btn btn-secondary ms-2"
        @click="cancel"
      >
        <i class="fas fa-times"></i> Hủy
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

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "SanPhamForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    QuickCreateModal,
    BaseSearchSelect,
  },
  props: {
    sanPham: {
      type: Object,
      default: () => ({
        ten_san_pham: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        mo_ta: "",
        trang_thai: true,
        anh_san_pham: [],
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:sanPham"],
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
      id_nha_cc: yup
        .string()
        .required("Mã nhà cung cấp không được để trống.")
        .max(8, "Mã nhà cung cấp không vượt quá 8 ký tự."),
      mo_ta: yup.string().nullable(),
    });

    return {
      sanPhamLocal: { ...this.sanPham },
      dsDanhMuc: [],
      dsThuongHieu: [],
      dsNhaCungCap: [],
      sanPhamFormSchema,

      // Mảng lưu danh sách ảnh hiển thị preview
      // Mỗi phần tử có cấu trúc: { file: File|null, url: string, la_anh_chinh: boolean, isOld: boolean, id?: string }
      previewImages: [],
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `sanPham` thay đổi (khi load dữ liệu edit về)
    sanPham: {
      handler(newVal) {
        this.sanPhamLocal = { ...newVal };
        this.initOldImages();
      },
      deep: true,
      immediate: true, // Chạy ngay lập tức khi component khởi tạo để kịp gọi initOldImages hiển thị danh sách ảnh cũ ngay
    },
  },
  methods: {
    // Hàm kích hoạt mở cửa sổ chọn file an toàn
    triggerFileInput() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click();
      }
    },

    // Nạp danh sách ảnh đã có từ server khi ở chế độ Chỉnh sửa (isEdit)
    initOldImages() {
      if (
        this.sanPhamLocal.anh_san_pham &&
        Array.isArray(this.sanPhamLocal.anh_san_pham)
      ) {
        this.previewImages = this.sanPhamLocal.anh_san_pham.map((img) => ({
          id: img.id,
          file: null,
          url: `${API_URL}/uploads/AnhSanPham/${img.duong_dan_anh}`,
          duong_dan_anh: img.duong_dan_anh,
          la_anh_chinh: !!img.la_anh_chinh,
          isOld: true,
        }));
      }
    },

    // Xử lý khi chọn file từ máy tính
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      const newImages = files.map((file) => ({
        file: file,
        url: URL.createObjectURL(file),
        la_anh_chinh: false,
        isOld: false,
      }));

      this.previewImages.push(...newImages);

      // Nếu chưa có ảnh nào được chọn làm ảnh chính -> Đặt ảnh đầu tiên làm ảnh chính
      if (
        !this.previewImages.some((img) => img.la_anh_chinh) &&
        this.previewImages.length > 0
      ) {
        this.previewImages[0].la_anh_chinh = true;
      }

      // Reset value của input file để có thể chọn lại cùng 1 file nếu muốn
      event.target.value = "";
    },

    // Đặt ảnh chỉ định làm ảnh chính
    setMainImage(selectedIndex) {
      this.previewImages.forEach((img, idx) => {
        img.la_anh_chinh = idx === selectedIndex;
      });
    },

    // Xóa ảnh khỏi danh sách
    removeImage(index) {
      const removed = this.previewImages.splice(index, 1)[0];

      // Tải lại bộ nhớ URL blob nếu là file mới tải lên
      if (removed && !removed.isOld && removed.url) {
        URL.revokeObjectURL(removed.url);
      }

      // Nếu vừa xóa mất ảnh chính và vẫn còn ảnh khác -> Chọn ảnh đầu tiên còn lại làm ảnh chính
      if (removed?.la_anh_chinh && this.previewImages.length > 0) {
        this.previewImages[0].la_anh_chinh = true;
      }
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
      const formData = new FormData();
      formData.append("ten_san_pham", this.sanPhamLocal.ten_san_pham);
      formData.append("id_thuong_hieu", this.sanPhamLocal.id_thuong_hieu);
      formData.append("id_danh_muc", this.sanPhamLocal.id_danh_muc);
      formData.append("id_nha_cc", this.sanPhamLocal.id_nha_cc);
      formData.append("mo_ta", this.sanPhamLocal.mo_ta);

      formData.append("la_anh_chinh", JSON.stringify(this.previewImages));

      this.previewImages.forEach((img) => {
        if (img.file) {
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
        this.sanPhamLocal.id_nha_cc = createdId;
      }
    },
  },
  async mounted() {
    // 1. Lấy dsThuongHieu, dsDanhMuc thông qua fetchDropdownData
    await this.fetchDropdownData();

    // 2. Sau khi đã có dsThuongHieu, dsDanhMuc,.. mới gán dữ liệu cho form Edit
    // if (this.isEdit) {
    //   this.sanPhamLocal = { ...this.sanPham };
    // }
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
