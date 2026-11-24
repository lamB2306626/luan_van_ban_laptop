<template>
  <button
    class="btn-favorite-pill d-flex align-items-center gap-1 px-2 py-1 shadow-sm"
    :class="{ 'is-liked': isLiked }"
    :disabled="isSubmittingLike"
    @click.stop="handleToggleYeuThich"
    :title="isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'"
  >
    <i
      class="fa-heart"
      :class="isLiked ? 'fas text-danger' : 'far text-secondary'"
      style="font-size: 14px"
    ></i>
    <span
      class="fw-bold"
      :class="isLiked ? 'text-danger' : 'text-secondary'"
      style="font-size: 11px"
    >
      {{ soLuotYeuThich }}
    </span>
  </button>
</template>

<script>
import yeuThichService from "@/services/yeu-thich.service";

export default {
  name: "LikeButton",
  props: {
    sanPhamId: {
      type: [String, Number],
      required: true,
    },

    soLuotYeuThich: { type: [Number], required: true },
  },
  data() {
    return {
      isLiked: false,
      isSubmittingLike: false,
      localCount: this.soLuotYeuThich,
    };
  },
  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
        return null;
      }
    },
    currentKhachHangId() {
      return this.currentUser?.id || this.currentUser?._id || null;
    },
    displayCount() {
      return this.localCount;
    },
  },
  watch: {
    sanPhamId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.checkTrangThaiYeuThich();
        }
      },
    },

    soLuotYeuThich(newVal) {
      this.localCount = newVal;
    },
  },
  methods: {
    async checkTrangThaiYeuThich() {
      if (!this.currentKhachHangId || !this.sanPhamId) return;

      try {
        const res = await yeuThichService.getAll({
          id_khach_hang: this.currentKhachHangId,
          id_san_pham: this.sanPhamId,
        });

        const listYeuThich = Array.isArray(res) ? res : res?.data || [];
        this.isLiked = listYeuThich.length > 0;
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái yêu thích:", error);
        this.isLiked = false;
      }
    },

    async handleToggleYeuThich() {
      if (!this.currentKhachHangId) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này!");
        this.$router.push({ name: "login.home" });
        return;
      }

      if (this.isSubmittingLike) return;
      this.isSubmittingLike = true;

      try {
        if (!this.isLiked) {
          await yeuThichService.create({
            id_khach_hang: this.currentKhachHangId,
            id_san_pham: this.sanPhamId,
          });

          this.isLiked = true;
          this.localCount += 1;
        } else {
          await yeuThichService.deleteByCustomerAndProduct(
            this.currentKhachHangId,
            this.sanPhamId,
          );

          this.isLiked = false;
          this.localCount -= 1;
        }
        this.$emit("update:soLuotYeuThich", this.localCount);
      } catch (error) {
        console.error("Lỗi thao tác yêu thích:", error);
        alert(
          error?.response?.data?.message ||
            "Có lỗi xảy ra, vui lòng thử lại sau!",
        );
      } finally {
        this.isSubmittingLike = false;
      }
    },
  },
};
</script>

<style scoped>
.btn-favorite-pill {
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  backdrop-filter: blur(4px);
}

.btn-favorite-pill:hover {
  background-color: #ffffff;
  transform: scale(1.05);
  border-color: #bdbdbd;
}

.btn-favorite-pill.is-liked {
  border-color: #dc3545;
  background-color: #fff0f1;
}
</style>
