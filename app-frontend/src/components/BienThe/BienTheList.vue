<template>
  <div>
    <!-- Thanh công cụ: Tiêu đề & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-cubes me-2"></i>Danh Sách Biến Thể Sản Phẩm
      </h5>
      <button class="btn btn-success btn-sm" @click="openAddModal">
        <i class="fas fa-plus me-1"></i> Thêm Biến Thể Mới
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
      @edit:bienThe="openEditModal"
      @delete:bienThe="handleDelete"
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
            <BienTheForm
              v-if="showForm"
              :bienThe="selectedBienThe"
              :isEdit="isEdit"
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

import { Modal } from "bootstrap";

export default {
  name: "BienTheList",
  components: {
    BienTheTable,
    BienTheForm,
  },
  props: {
    idSanPham: { type: String, required: true }, // Mã sản phẩm cha
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
  methods: {
    // Lấy danh sách biến thể theo ID Sản Phẩm
    async fetchBienTheList() {
      try {
        if (BienTheService) {
          this.dsBienThe = await BienTheService.getAll({
            id_san_pham: this.idSanPham,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách biến thể:", error);
      }
    },

    // Mở Modal Thêm mới
    openAddModal() {
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
        trang_thai: true,
      };
      this.showForm = true;
      this.getModalInstance().show();
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
    async handleSave(formData) {
      try {
        // 1. Thêm id_san_pham vào FormData (Bắt buộc dùng .append)
        formData.append("id_san_pham", this.idSanPham);

        if (this.isEdit) {
          // 2. Lấy id ra từ FormData bằng phương thức .get()
          const id = formData.get("id");
          await BienTheService.update(id, formData);
          this.message = "Cập nhật biến thể thành công!";
        } else {
          await BienTheService.create(formData);
          this.message = "Thêm biến thể mới thành công!";
        }

        this.closeModal();
        await this.fetchBienTheList(); // Tải lại bảng sau khi lưu
      } catch (error) {
        console.error("Lỗi khi lưu biến thể:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // Xóa biến thể
    async handleDelete(bienThe) {
      if (confirm(`Bạn có chắc chắn muốn xóa biến thể cấu hình này không?`)) {
        try {
          await BienTheService.delete(bienThe.id);
          this.message = "Đã xóa biến thể thành công!";
          await this.fetchBienTheList();
        } catch (error) {
          console.error("Lỗi khi xóa biến thể:", error);
          this.message = "Xóa biến thể thất bại.";
        }
      }
    },
  },
  mounted() {
    this.fetchBienTheList();
  },
};
</script>
