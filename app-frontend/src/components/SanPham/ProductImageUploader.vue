<template>
  <div class="form-group mb-4 border rounded p-3 bg-light">
    <label class="fw-bold mb-2">
      <i class="fas fa-images me-1"></i> Hình Ảnh Sản Phẩm
      <span class="text-danger">*</span>:
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
        :disabled="!canManageSanPham"
        @click="triggerFileInput"
      >
        <i class="fas fa-cloud-upload-alt me-1"></i> Chọn danh sách ảnh
      </button>
      <small class="text-muted ms-2">
        (Có thể chọn nhiều ảnh, nhấp radio để đặt ảnh đại diện chính)
      </small>
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
            :disabled="!canManageSanPham"
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
                :disabled="!canManageSanPham"
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

    <!-- Khung trống khi chưa có ảnh -->
    <div
      v-else
      class="text-center py-4 text-muted border border-dashed rounded bg-white"
    >
      <i class="fas fa-image fa-2x mb-2 d-block text-secondary"></i>
      Chưa có hình ảnh nào được chọn.
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ProductImageUploader",
  props: {
    // Giá trị binding hai chiều (v-model)
    modelValue: {
      type: Array,
      default: () => [],
    },
    // Nhận danh sách ảnh cũ khi sửa (nếu có)
    initialImages: {
      type: Array,
      default: () => [],
    },
    canManageSanPham: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      previewImages: [],
    };
  },
  // Trong ProductImageUploader.vue
  watch: {
    initialImages: {
      handler(newVal) {
        if (Array.isArray(newVal) && newVal.length > 0) {
          this.initOldImages(newVal);
        }
      },
      immediate: true,
      deep: true,
    },
    previewImages: {
      handler(newVal) {
        // Luôn báo mảng mới nhất ra ngoài cho parent v-model
        this.$emit("update:modelValue", newVal);
      },
      deep: true,
    },
  },

  unmounted() {
    // Thu hồi bộ nhớ BLOB khi component bị hủy
    this.previewImages.forEach((img) => {
      if (!img.isOld && img.url) {
        URL.revokeObjectURL(img.url);
      }
    });
  },
  methods: {
    triggerFileInput() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click();
      }
    },

    initOldImages(oldImages) {
      this.previewImages = oldImages.map((img) => ({
        id: img.id,
        file: null,
        url: `${API_URL}/uploads/AnhSanPham/${img.duong_dan_anh}`,
        duong_dan_anh: img.duong_dan_anh,
        la_anh_chinh: !!img.la_anh_chinh,
        isOld: true,
      }));
    },

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

      // Nếu chưa có ảnh nào là ảnh chính -> Chọn ảnh đầu tiên
      if (
        !this.previewImages.some((img) => img.la_anh_chinh) &&
        this.previewImages.length > 0
      ) {
        this.previewImages[0].la_anh_chinh = true;
      }

      event.target.value = "";
    },

    setMainImage(selectedIndex) {
      this.previewImages.forEach((img, idx) => {
        img.la_anh_chinh = idx === selectedIndex;
      });
    },

    removeImage(index) {
      const removed = this.previewImages.splice(index, 1)[0];

      if (removed && !removed.isOld && removed.url) {
        URL.revokeObjectURL(removed.url);
      }

      if (removed?.la_anh_chinh && this.previewImages.length > 0) {
        this.previewImages[0].la_anh_chinh = true;
      }
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.border-dashed {
  border-style: dashed !important;
}
</style>
