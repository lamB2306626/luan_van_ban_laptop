<template>
  <div class="edit-bien-the-container">
    <!-- TIÊU ĐỀ BẢNG CẬP NHẬT -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold text-primary mb-0">
        <i class="fas fa-edit me-2"></i> Cập Nhật Biến Thể:
        <span class="text-secondary ms-1">{{ bienTheData?.id || "BTxx" }}</span>
      </h5>
      <button
        v-if="isModal"
        type="button"
        class="btn-close"
        @click="handleClose"
      ></button>
    </div>

    <!-- THANH TABS CHUYỂN ĐỔI (THEO NGUYÊN MẪU TRÊN ẢNH) -->
    <ul class="nav nav-tabs custom-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'info' }"
          type="button"
          @click="activeTab = 'info'"
        >
          <i class="fas fa-info-circle me-1"></i> Thông Tin Chung
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'image' }"
          type="button"
          @click="activeTab = 'image'"
        >
          <i class="fas fa-image me-1"></i> Ảnh Biến Thể
        </button>
      </li>
    </ul>

    <!-- NỘI DUNG TỪNG TAB -->
    <div class="tab-content border rounded p-3 bg-white shadow-sm">
      <!-- TAB 1: THÔNG TIN CẤU HÌNH & GIÁ BÁN -->
      <div v-show="activeTab === 'info'">
        <BienTheForm
          :bien-the="bienTheData"
          :is-edit="true"
          @submit:bienThe="handleSaveInfo"
          @cancel="handleClose"
        />
      </div>

      <!-- TAB 2: QUẢN LÝ UPLOAD ẢNH -->
      <div v-show="activeTab === 'image'">
        <VariantImageUploader
          :bien-the-id="bienTheData?.id"
          :current-image="bienTheData?.duong_dan_anh"
          @uploaded="handleImageUploaded"
          @error="handleImageError"
        />
      </div>
    </div>
  </div>
</template>

<script>
import BienTheForm from "@/components/BienThe/BienTheForm.vue";
import VariantImageUploader from "@/components/BienThe/VariantImageUploader.vue";

export default {
  name: "BienTheFormEdit",
  components: {
    BienTheForm,
    VariantImageUploader,
  },
  props: {
    // Thông tin biến thể cần cập nhật
    bienTheData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    // Nếu sử dụng bên trong Bootstrap Modal
    isModal: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["saved", "image-updated", "close"],
  data() {
    return {
      activeTab: "info", // Default tab hiện tại là 'info'
    };
  },
  methods: {
    // Xử lý khi bấm Lưu Thông Tin ở Tab 1
    handleSaveInfo(formDataObj) {
      // Bắn sự kiện lưu thông tin cấu hình ra cho component cha xử lý API update
      this.$emit("saved", formDataObj);
    },

    // Xử lý sau khi Upload ảnh thành công ở Tab 2
    handleImageUploaded(response) {
      // Cập nhật lại tên đường dẫn ảnh mới cho bienTheData
      if (response?.data?.duong_dan_anh) {
        this.bienTheData.duong_dan_anh = response.data.duong_dan_anh;
      }
      this.$emit("image-updated", response);
    },

    handleImageError(error) {
      console.error("Lỗi cập nhật ảnh biến thể:", error);
    },

    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
/* TÙY CHỈNH STYLE TABS GIỐNG HỆT NHƯ TRONG ẢNH MẪU */
.custom-tabs {
  border-bottom: 2px solid #dee2e6;
}

.custom-tabs .nav-link {
  color: #495057;
  font-weight: 600;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.6rem 1.2rem;
  background: transparent;
  transition: all 0.2s ease-in-out;
}

.custom-tabs .nav-link:hover {
  color: #0d6efd;
  border-color: transparent;
}

/* TAB ĐANG ACTIVE -> GẠCH CHÂN XANH DƯƠNG */
.custom-tabs .nav-link.active {
  color: #0d6efd;
  background-color: transparent;
  border-bottom: 3px solid #0d6efd;
}
</style>
