<template>
  <div class="card border-0 shadow-sm p-3 position-relative sticky-top mt-1">
    <!-- Nút Yêu thích nổi ở góc trên bên phải khung ảnh -->
    <div
      v-if="sanPhamId"
      class="position-absolute top-0 end-0 m-3"
      style="z-index: 5"
    >
      <LikeButton
        :san-pham-id="sanPhamId"
        :so-luot-yeu-thich="soLuotYeuThich"
        @update:so-luot-yeu-thich="updateSoLuongYeuThich"
      />
    </div>

    <!-- Ảnh đại diện lớn -->
    <div class="main-image-wrapper text-center mb-3 p-3 bg-light rounded">
      <img
        :src="currentImage"
        :alt="tenSanPham"
        class="img-fluid object-fit-contain main-img"
      />
    </div>

    <!-- Danh sách ảnh nhỏ (Thumbnails) -->
    <div
      v-if="danhSachAnh && danhSachAnh.length > 0"
      class="thumbnail-list d-flex gap-2 overflow-x-auto pb-2"
    >
      <div
        v-for="(img, index) in danhSachAnh"
        :key="img.id || index"
        class="thumbnail-item rounded border p-1"
        :class="{
          'border-primary active':
            currentImage === getFullImgUrl(img.duong_dan_anh),
        }"
        @click="selectImage(img.duong_dan_anh)"
      >
        <img
          :src="getFullImgUrl(img.duong_dan_anh)"
          class="img-fluid rounded"
          alt="Thumbnail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import LikeButton from "@/components/ChiTietSanPham/LikeButton.vue";
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "HinhAnhSanPham",
  components: {
    LikeButton,
  },
  props: {
    sanPhamId: {
      type: [String, Number],
      default: null,
    },
    tenSanPham: {
      type: String,
      default: "",
    },
    anhMacDinh: {
      type: String,
      default: "",
    },
    danhSachAnh: {
      type: Array,
      default: () => [],
    },
    soLuotYeuThich: { type: [Number], required: true },
  },
  data() {
    return {
      API_URL,
      selectedImage: null,
    };
  },

  watch: {
    // LẮNG NGHE KHI PROPS anhMacDinh THAY ĐỔI (Khi người dùng chọn biến thể mới)
    anhMacDinh(newVal) {
      if (newVal) {
        // Reset lại ảnh người dùng đã click thủ công trước đó
        this.selectedImage = null;
      }
    },
  },

  computed: {
    // Ưu tiên hiển thị ảnh người dùng vừa click chọn, nếu chưa chọn thì dùng ảnh mặc định
    currentImage() {
      if (this.selectedImage) return this.selectedImage;
      if (this.anhMacDinh) return this.anhMacDinh;

      if (this.danhSachAnh && this.danhSachAnh.length > 0) {
        return this.getFullMainImgUrl(this.danhSachAnh);
      }
    },
  },
  methods: {
    // Lấy đường dẫn ảnh cho một ảnh sản phẩm
    getFullImgUrl(fileName) {
      if (!fileName) return `${API_URL}/images/placeholder-laptop.png`;
      let url = fileName.startsWith("http")
        ? fileName
        : `${API_URL}/uploads/AnhSanPham/${fileName}`;
      return url;
    },

    // Lấy đường dẫn ảnh chính của một sản phẩm (nhận vào danh sách ảnh của 1 sản phẩm)
    getFullMainImgUrl(danh_sach_anh) {
      const anhChinhSanPham =
        danh_sach_anh?.find((img) => img.la_anh_chinh)?.duong_dan_anh ||
        danh_sach_anh?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // Nếu không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    selectImage(path) {
      this.selectedImage = this.getFullImgUrl(path);
    },

    // phát sự kiện chi trang cha (Trang chi tiết sản phẩm) cập nhật lại só lượng yêu thích
    updateSoLuongYeuThich(soLuong) {
      this.$emit("update:soLuotYeuThich", soLuong);
    },
  },
};
</script>

<style scoped>
.main-img {
  max-height: 380px;
  max-width: 100%;
  transition: transform 0.3s ease;
}

.main-img:hover {
  transform: scale(1.03);
}

.thumbnail-item {
  width: 70px;
  height: 70px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.thumbnail-item:hover,
.thumbnail-item.active {
  opacity: 1;
  border-width: 2px !important;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.promo-badge-container {
  z-index: 10;
}

/* Tùy chỉnh thanh cuộn cho thumbnail nếu có quá nhiều ảnh */
.thumbnail-list::-webkit-scrollbar {
  height: 4px;
}
.thumbnail-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}
</style>
