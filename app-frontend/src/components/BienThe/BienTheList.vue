<template>
  <div>
    <!-- Thanh công cụ: Tiêu đề & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-cubes me-2"></i>Danh Sách Biến Thể Sản Phẩm
      </h5>
      <button
        class="btn btn-success btn-sm"
        @click="openAddModal"
        :disabled="!isTrashInSanPham"
        :class="{ 'btn-permission-muted': !canManageSanPham }"
      >
        <i class="fas fa-plus me-1"></i> Thêm Biến Thể Mới
      </button>

      <button
        class="btn btn-secondary"
        :class="{ 'btn-permission-muted': !canManageSanPham }"
        @click="openTrash"
      >
        <i class="fas fa-trash-alt"></i> Thùng rác biến thể
      </button>
    </div>

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
      :isTrash="false"
      :canManageSanPham="canManageSanPham"
      @edit:bienThe="openEditModal"
      @toggle-status="toggleStatusbienThe"
      @delete:bienThe="deletebienThe"
    />

    <!-- MODAL POPUP: FORM THÊM / SỬA BIẾN THỂ -->
    <div
      class="modal fade"
      id="bienTheModal"
      tabindex="-1"
      ref="bienTheModal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEdit ? "Chỉnh Sửa Biến Thể" : "Thêm Biến Thể Mới" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <!-- CHỈNH SỬA BIẾN THỂ: Render giao diện 2 Tabs -->
            <BienTheFormEdit
              v-if="showForm && isEdit"
              :bienTheData="selectedBienThe"
              @saved="handleSave"
              @image-updated="handleImageUpdated"
              @close="closeModal"
            />

            <!-- THÊM MỚI BIẾN THỂ: Render BienTheForm thuần túy -->
            <BienTheForm
              v-if="showForm && !isEdit"
              :bienThe="selectedBienThe"
              :isEdit="false"
              @submit:bienThe="handleSave"
              @cancel="closeModal"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BienTheTable from "./BienTheTable.vue";
import BienTheForm from "./BienTheForm.vue";
import BienTheService from "@/services/bien-the.service";

import BienTheFormEdit from "./BienTheFormEdit.vue";

import { Modal } from "bootstrap";

export default {
  name: "BienTheList",
  components: {
    BienTheTable,
    BienTheForm,
    BienTheFormEdit,
  },
  props: {
    idSanPham: { type: String, required: true }, // Mã sản phẩm được truyền từ Router
    isTrashInSanPham: { type: Boolean, default: false }, // isTrashInSanPham được truyền từ Router
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
  emits: ["open-trash"],
  methods: {
    // ==================== Phát tín hiệu không có quyền thực hiện thao tác ====================
    notifyAccessDenied(message = "Bạn không có quyền thực hiện thao tác này!") {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },

    // Lấy danh sách biến thể theo ID Sản Phẩm
    async fetchBienTheList() {
      try {
        if (BienTheService) {
          this.dsBienThe = await BienTheService.getAll({
            id_san_pham: this.idSanPham,
            da_xoa: false,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách biến thể:", error);
      }
    },

    // Mở Modal Thêm mới
    openAddModal() {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }

      this.isEdit = false;
      this.selectedBienThe = {
        id_san_pham: this.idSanPham,
        id_mau_sac: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        gia: 0,
        duong_dan_anh: "",
        is_delete: false,
      };
      this.showForm = true;
      this.getModalInstance().show();
    },

    openTrash() {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }

      this.$emit("open-trash");
    },

    // Mở Modal Chỉnh sửa
    openEditModal(bienThe) {
      this.isEdit = true;
      this.selectedBienThe = { ...bienThe };
      this.showForm = true;
      this.getModalInstance().show();
    },

    // Đóng Modal
    closeModal() {
      this.showForm = false;
      this.getModalInstance().hide();
    },

    // Khởi tạo instance của Bootstrap Modal
    getModalInstance() {
      if (!this.modalInstance && this.$refs.bienTheModal) {
        this.modalInstance = new Modal(this.$refs.bienTheModal);
      }
      return this.modalInstance;
    },

    // Lưu biến thể (Create / Update)
    async handleSave(payloadObj) {
      try {
        const dataSave = {
          ...payloadObj,
          id_san_pham: this.idSanPham,
        };

        if (this.isEdit) {
          await BienTheService.update(dataSave.id, dataSave);
          this.message = "Cập nhật thông tin biến thể thành công!";
        } else {
          await BienTheService.create(dataSave);
          this.message = "Thêm biến thể mới thành công!";
        }

        this.closeModal();
        await this.fetchBienTheList(); // Tải lại bảng sau khi lưu
        // BẮN SỰ KIỆN THÔNG BÁO CHO TRANG CHA, để trang cha sẽ cập nhât trạng thái sản phẩm ngay
        this.$emit("saved");
      } catch (error) {
        console.error("Lỗi khi lưu biến thể:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // 2.upload/thay đổi ảnh thành công
    async handleImageUpdated() {
      this.message = "Cập nhật ảnh biến thể thành công!";
      await this.fetchBienTheList();
      this.closeModal();
    },
    // ==================== 2. Khóa (Delete) Biến Thể ====================
    async deletebienThe(bienThe) {
      if (
        confirm(`Bạn có chắc chắn muốn xóa biến thể "${bienThe.id}" không?`)
      ) {
        try {
          // Gọi hàm delete để Khóa biến thể
          await BienTheService.delete(bienThe.id);

          alert(`Xóa biến thể thành công!`);
          this.fetchBienTheList();
          // BẮN SỰ KIỆN THÔNG BÁO CHO TRANG CHA, để trang cha sẽ cập nhât trạng thái sản phẩm ngay
          this.$emit("saved");
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa biến thể ${bienThe.id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 2. Đổi trạng thái qua lại giữa DANG_KINH_DOANH và NGUNG_KINH_DOANH ====================
    async toggleStatusbienThe(bienThe) {
      // Xác định trạng thái tiếp theo cần chuyển tới
      const nextStatus = bienThe.trang_thai ? false : true;
      const actionText = bienThe.trang_thai
        ? "NGỪNG KINH DOANH"
        : "ĐANG KINH DOANH";

      if (
        confirm(
          `Bạn có chắc chắn muốn chuyển biến thể "${bienThe.id}" sang trạng thái ${actionText} không?`,
        )
      ) {
        try {
          // Gọi hàm update truyền vào trang_thai mới thông qua SanPhamService
          await BienTheService.update(bienThe.id, {
            trang_thai: nextStatus,
          });

          alert(`Cập nhật trạng thái thành công!`);
          this.fetchBienTheList(); // Tải lại danh sách
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi cập nhật trạng thái sản phẩm ${bienThe.id}`;

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

<style scoped>
.btn-permission-muted {
  opacity: 0.45;
  cursor: pointer;
}

.btn-permission-muted:hover {
  opacity: 0.65;
}
</style>
