<template>
  <div class="variant-image-uploader card p-3">
    <h6 class="fw-bold text-primary mb-3">
      <i class="fas fa-image me-1"></i> Quản Lý Ảnh Biến Thể
    </h6>

    <!-- Khung hiển thị Xem Trước (Preview) -->
    <div class="text-center mb-3 p-3 border rounded bg-light">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Ảnh biến thể"
        class="img-thumbnail shadow-sm"
        style="max-height: 200px; object-fit: contain"
      />
      <div v-else class="text-muted py-4">
        <i class="fas fa-cloud-upload-alt fa-3x mb-2"></i>
        <p class="mb-0 small">Chưa có ảnh đại diện cho biến thể này</p>
      </div>
    </div>

    <!-- Ô Chọn File -->
    <div class="mb-3">
      <label for="upload-variant-img" class="form-label small fw-bold"
        >Chọn ảnh mới từ máy tính:</label
      >
      <input
        type="file"
        id="upload-variant-img"
        class="form-control"
        accept="image/*"
        @change="handleFileChange"
      />
    </div>

    <!-- Thông báo lỗi (nếu có) -->
    <div v-if="errorMessage" class="alert alert-danger p-2 small mb-3">
      {{ errorMessage }}
    </div>

    <!-- Các nút thao tác -->
    <div class="d-flex justify-content-end gap-2">
      <button
        v-if="selectedFile"
        type="button"
        class="btn btn-outline-secondary btn-sm"
        @click="resetSelection"
        :disabled="isUploading"
      >
        <i class="fas fa-undo me-1"></i> Hủy chọn
      </button>

      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="!selectedFile || isUploading"
        @click="uploadImage"
      >
        <span
          v-if="isUploading"
          class="spinner-border spinner-border-sm me-1"
        ></span>
        <i v-else class="fas fa-upload me-1"></i>
        {{ isUploading ? "Đang tải lên..." : "Lưu ảnh mới" }}
      </button>
    </div>
  </div>
</template>

<script>
import BienTheService from "@/services/bien-the.service";

const API_URL = import.meta.env.VITE_API_BASE_URL || "";

export default {
  name: "VariantImageUploader",
  props: {
    // Nhận vào ID biến thể cần cập nhật ảnh
    bienTheId: {
      type: String,
      required: true,
    },
    // Đường dẫn tên file ảnh hiện tại từ Database
    currentImage: {
      type: String,
      default: "",
    },
  },
  emits: ["uploaded", "error"],
  data() {
    return {
      selectedFile: null,
      previewUrl: this.getInitialPreviewUrl(this.currentImage),
      isUploading: false,
      errorMessage: "",
    };
  },
  watch: {
    currentImage(newImg) {
      if (!this.selectedFile) {
        this.previewUrl = this.getInitialPreviewUrl(newImg);
      }
    },
  },
  methods: {
    getInitialPreviewUrl(imageName) {
      if (!imageName) return null;
      // Nếu là đường dẫn đầy đủ http/https thì giữ nguyên, ngược lại nối với API URL
      if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
        return imageName;
      }
      return `${API_URL}/uploads/BienThe/${imageName}`;
    },

    handleFileChange(event) {
      const file = event.target.files[0];
      this.errorMessage = "";

      if (file) {
        // Kiểm tra dung lượng (giới hạn < 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = "Kích thước ảnh không được vượt quá 5MB!";
          this.resetSelection();
          return;
        }

        this.selectedFile = file;
        this.previewUrl = URL.createObjectURL(file);
      }
    },

    resetSelection() {
      this.selectedFile = null;
      this.errorMessage = "";
      this.previewUrl = this.getInitialPreviewUrl(this.currentImage);

      // Reset giá trị input file HTML
      const inputEl = document.getElementById("upload-variant-img");
      if (inputEl) inputEl.value = "";
    },

    async uploadImage() {
      if (!this.selectedFile || !this.bienTheId) return;

      this.isUploading = true;
      this.errorMessage = "";

      try {
        const formData = new FormData();
        formData.append("image", this.selectedFile);

        // Gọi API cập nhật ảnh cho biến thể
        const response = await BienTheService.update(this.bienTheId, formData);

        this.selectedFile = null;
        this.$emit("uploaded", response);
      } catch (error) {
        console.error("Lỗi khi upload ảnh biến thể:", error);
        this.errorMessage =
          error.response?.data?.message || "Cập nhật ảnh biến thể thất bại!";
        this.$emit("error", error);
      } finally {
        this.isUploading = false;
      }
    },
  },
};
</script>
