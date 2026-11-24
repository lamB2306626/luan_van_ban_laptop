<template>
  <div>
    <button class="btn btn-secondary mb-3" @click="$emit('back-to-list')">
      <i class="fas fa-arrow-left"></i> Quay lại
    </button>

    <!-- Thông báo lỗi / thành công (nếu có) -->
    <div
      v-if="message"
      class="alert alert-info alert-dismissible fade show py-2 mb-3"
      role="alert"
    >
      {{ message }}
      <button
        type="button"
        class="btn-close py-2"
        @click="message = ''"
      ></button>
    </div>

    <!-- Bảng danh sách biến thể -->
    <BienTheTable
      :dsBienThe="dsBienThe"
      :isTrash="true"
      :canManageSanPham="canManageSanPham"
      @edit:bienThe="openEditModal"
      @restore:bienThe="restorebienThe"
    />
  </div>
</template>

<script>
import BienTheTable from "./BienTheTable.vue";
import BienTheService from "@/services/bien-the.service";

export default {
  name: "BienTheList",
  components: {
    BienTheTable,
  },
  props: {
    idSanPham: { type: String, required: true }, // Mã sản phẩm cha
    canManageSanPham: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
  },
  data() {
    return {
      dsBienThe: [],
      selectedBienThe: null,
      isEdit: false,
      showForm: false,
      message: "",
      modalInstance: null,
    };
  },
  emits: ["back-to-list"],
  methods: {
    // Lấy danh sách biến thể theo ID Sản Phẩm
    async fetchBienTheList() {
      try {
        if (BienTheService) {
          this.dsBienThe = await BienTheService.getAll({
            id_san_pham: this.idSanPham,
            da_xoa: true,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách biến thể:", error);
      }
    },

    // ==================== 2. Mở khóa (Restore) Biến Thể ====================
    async restorebienThe(bienThe) {
      {
        try {
          // Gọi hàm delete để Khóa biến thể
          await BienTheService.restore(bienThe.id);

          alert(`Khôi phục biến thể thành công!`);
          this.fetchBienTheList();
          // BẮN SỰ KIỆN THÔNG BÁO CHO TRANG CHA, để trang cha sẽ cập nhât trạng thái sản phẩm ngay
          this.$emit("saved");
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi khôi phục biến thể ${bienThe.id}`;

          alert(errorMessage);
        }
      }
    },
  },
  mounted() {
    this.fetchBienTheList();
  },
};
</script>
