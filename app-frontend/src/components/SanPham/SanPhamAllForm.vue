<template>
  <Form @submit="submitSanPham">
    <!-- KHU VỰC NHẬP THÔNG TIN SẢN PHẨM -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-white py-3">
        <h6 class="fw-bold mb-0 text-primary">
          <i class="fas fa-info me-2"></i>Thông Tin Sản Phẩm
        </h6>
      </div>
      <div class="card-body">
        <!-- Nhúng ThongSoForm -->
        <SanPhamForm
          ref="sanPhamFormRef"
          v-model:sanPham="sanPhamLocal"
          :canManageSanPham="true"
          :showSubmitButton="false"
        />
      </div>
    </div>

    <!-- KHU VỰC NHẬP THÔNG SỐ KỸ THUẬT SẢN PHẨM -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-white py-3">
        <h6 class="fw-bold mb-0 text-primary">
          <i class="fas fa-microchip me-2"></i>Thông Số Kỹ Thuật Chi Tiết
        </h6>
      </div>
      <div class="card-body">
        <!-- Nhúng ThongSoForm -->
        <ThongSoForm
          v-model:thongSo="thongSoLocal"
          :canManageSanPham="true"
          :showSubmitButton="false"
        />
      </div>
    </div>

    <!-- BẢNG DANH SÁCH BIẾN THỂ TẠM (CHỈ HIỂN THỊ KHI THÊM MỚI SẢN PHẨM) -->
    <div class="border rounded p-3 mb-4 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold mb-0 text-primary">
          <i class="fas fa-boxes me-1"></i> Danh Sách Biến Thể Sản Phẩm
        </h6>
        <button
          type="button"
          class="btn btn-sm btn-success"
          @click="openAddBienTheModal"
        >
          <i class="fas fa-plus me-1"></i> Thêm Biến Thể
        </button>
      </div>

      <!-- Bảng hiển thị danh sách biến thể tạm -->
      <BienTheTableAtForm
        :dsBienThe="dsBienTheTam"
        @edit:bienThe="openEditModal"
        @delete:bienThe="handleRemoveBienTheTam"
      />
    </div>

    <!-- MODAL CHỨA FORM THÊM BIẾN THỂ -->
    <div
      class="modal fade"
      id="modalBienTheTam"
      tabindex="-1"
      ref="modalBienTheTam"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{
                isEditBienThe
                  ? "Chỉnh Sửa Biến Thể Tạm"
                  : "Thêm Biến Thể Cho Sản Phẩm"
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeBienTheModal"
            ></button>
          </div>
          <div class="modal-body">
            <BienTheForm
              v-if="showBienTheModal"
              :bienThe="selectedBienThe"
              :isEdit="isEditBienThe"
              @submit:bienThe="handleSaveBienTheTam"
              @cancel="closeBienTheModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group">
      <button type="button" class="btn btn-primary" @click="handlePreSubmit">
        <i class="fas fa-save me-1"></i> Lưu sản phẩm
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times"></i> Hủy
      </button>
    </div>
  </Form>
</template>

<script>
import { Form, Field, ErrorMessage } from "vee-validate";

// Import Modal Vừa tìm, vừa chọn Dùng Chung
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";
import SanPhamForm from "@/components/SanPham/SanPhamForm.vue";
import ThongSoForm from "@/components/ThongSoKyThuat/ThongSoForm.vue";

// Import Modal thêm biến thể
import BienTheForm from "@/components/BienThe/BienTheForm.vue";
import BienTheTableAtForm from "@/components/BienThe/BienTheTableAtForm.vue";
import { Modal } from "bootstrap";

export default {
  name: "SanPhamAllForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseSearchSelect,
    BaseMultiSearchSelect,
    SanPhamForm,
    ThongSoForm,
    BienTheForm,
    BienTheTableAtForm,
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
      }),
    },
  },
  emits: ["submit:sanPham"],
  data() {
    return {
      sanPhamLocal: {
        ten_san_pham: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        danh_sach_nha_cung_cap: [],
        mo_ta: "",
        trang_thai: true,
        anh_san_pham: [],
        previewImages: [],
      },

      thongSoLocal: null,

      dsBienTheTam: [], // Mảng chứa các biến thể tạo tạm
      showBienTheModal: false, // Trạng thái hiển thị modal
      modalBienTheInstance: null,

      isEditBienThe: false, // Dùng biến riêng để quản lý trạng thái Edit của Modal Biến Thể
      selectedBienThe: null, //
    };
  },

  methods: {
    //========================== Xử lý thêm mới biến thể ===============================//
    // Mở Modal Thêm Biến Thể
    openAddBienTheModal() {
      this.isEditBienThe = false;
      this.selectedBienThe = {
        // Reset Object về rỗng
        id_mau_sac: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        gia: 0,
      };
      this.showBienTheModal = true;
      this.$nextTick(() => {
        if (!this.modalBienTheInstance && this.$refs.modalBienTheTam) {
          this.modalBienTheInstance = new Modal(this.$refs.modalBienTheTam);
        }
        this.modalBienTheInstance?.show();
      });
    },

    // Đóng Modal Biến Thể
    closeBienTheModal() {
      this.showBienTheModal = false;
      this.modalBienTheInstance?.hide();
    },

    // Thêm biến thể mới vào mảng tạm
    handleSaveBienTheTam(dataBienThe) {
      if (this.isEditBienThe) {
        // TRƯỜNG HỢP CẬP NHẬT: Tìm vị trí trong mảng tạm theo ID và ghi đè
        const index = this.dsBienTheTam.findIndex(
          (item) => item.id === this.selectedBienThe.id,
        );
        if (index !== -1) {
          this.dsBienTheTam[index] = {
            ...this.dsBienTheTam[index],
            ...dataBienThe,
          };
        }
      } else {
        // TRƯỜNG HỢP THÊM MỚI: Push phần tử mới vào mảng
        this.dsBienTheTam.push({
          ...dataBienThe,
          id: `BT_TAM_${Date.now()}`, // Tạo ID tạm duy nhất
        });
      }

      this.closeBienTheModal();
    },

    // Mở Modal Chỉnh sửa
    openEditModal(itemSua) {
      this.selectedBienThe = { ...itemSua };
      this.isEditBienThe = true;
      this.showBienTheModal = true;
      this.modalBienTheInstance?.show();
    },

    // Xóa 1 biến thể khỏi mảng tạm
    handleRemoveBienTheTam(itemXoa) {
      this.dsBienTheTam = this.dsBienTheTam.filter(
        (item) => item.id !== itemXoa.id,
      );
    },
    //================================================================================//

    // Truy cập ref của Component Con và thẻ Form bên trong nó
    async handlePreSubmit() {
      const childComponent = this.$refs.sanPhamFormRef;
      const innerForm = childComponent?.$refs?.innerForm;

      if (innerForm) {
        // 2. Kích hoạt validate thủ công
        const { valid } = await innerForm.validate();

        // 3. Nếu dữ liệu nhập thiếu/sai -> Dừng lại và hiện thông báo lỗi ở Form con
        if (!valid) {
          alert("Vui lòng điền đầy đủ các thông tin sản phẩm bắt buộc!");
          return;
        }
      }

      // 4. Nếu Form con hợp lệ -> Tiến hành đóng gói FormData và gửi API
      this.submitSanPham();
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitSanPham() {
      const formData = new FormData();
      formData.append("ten_san_pham", this.sanPhamLocal.ten_san_pham);
      formData.append("id_thuong_hieu", this.sanPhamLocal.id_thuong_hieu);
      formData.append("id_danh_muc", this.sanPhamLocal.id_danh_muc);
      formData.append("mo_ta", this.sanPhamLocal.mo_ta);

      formData.append(
        "danh_sach_nha_cung_cap",
        JSON.stringify(this.sanPhamLocal.danh_sach_nha_cung_cap),
      );

      formData.append("thong_so_ky_thuat", JSON.stringify(this.thongSoLocal));

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

      const dsBienTheClean = this.dsBienTheTam.map((item) => {
        // Loại bỏ id tạm (BT_TAM_...), duong_dan_anh dạng preview blob, và các object hiển thị
        const {
          id,
          previewUrl,
          cpu,
          mau_sac,
          gpu,
          dung_luong_ram,
          dung_luong_rom,
          ...rest
        } = item;
        return rest;
      });

      formData.append("danh_sach_bien_the", JSON.stringify(dsBienTheClean));

      this.$emit("submit:sanPham", formData);
    },

    // Chuyển hướng quay lại trang danh sách sản phẩm
    cancel() {
      this.$router.push({ name: "san-pham.home" });
    },
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
