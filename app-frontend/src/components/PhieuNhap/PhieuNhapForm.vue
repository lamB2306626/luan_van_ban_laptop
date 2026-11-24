<template>
  <Form @submit="submitPhieuNhap" :validation-schema="phieuNhapFormSchema">
    <!-- Mã Phiếu Nhập: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Phiếu Nhập:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="phieuNhapLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Chọn Nhân Viên Lập Phiếu -->
    <div class="form-group mb-3">
      <label for="id_nhan_vien">Mã Nhân Viên lập phiếu:</label>
      <Field
        name="id_nhan_vien"
        type="text"
        class="form-control"
        v-model="phieuNhapLocal.id_nhan_vien"
        disabled
      />
      <ErrorMessage name="id_nhan_vien" class="text-danger small" />
    </div>

    <!-- Mã Nhà cung cấp -->
    <div class="form-group mb-3">
      <label for="id_ncc"
        >Nhà cung cấp <span class="text-danger">*</span>:</label
      >
      <div class="input-group">
        <Field name="id_ncc" v-model="phieuNhapLocal.id_ncc">
          <BaseSearchSelect
            v-model="phieuNhapLocal.id_ncc"
            :options="dsNhaCungCap"
            label-key="ten_ncc"
            value-key="id"
            placeholder="Nhập tên hoặc mã Nhà Cung Cấp để tìm..."
            class="flex-grow-1"
          >
          </BaseSearchSelect>
        </Field>
        <button
          type="button"
          class="btn btn-outline-success"
          title="Thêm Nhà cung cấp mới"
          @click="openQuickCreate('nha-cung-cap')"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <ErrorMessage name="id_ncc" class="text-danger small" />
    </div>

    <!-- Ngày Nhập -->
    <div class="form-group mb-3">
      <label for="ngay_nhap">
        Ngày Nhập <span class="text-danger">*</span>:
      </label>
      <Field
        name="ngay_nhap"
        type="datetime-local"
        class="form-control"
        v-model="phieuNhapLocal.ngay_nhap"
      />
      <ErrorMessage name="ngay_nhap" class="text-danger small" />
    </div>

    <!-- Tổng Tiền (Nếu hiển thị dạng readonly khi sửa) -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="tong_tien">Tổng Tiền (VNĐ):</label>
      <input
        type="text"
        class="form-control fw-bold text-success"
        :value="formatCurrency(phieuNhapLocal.tong_tien)"
        disabled
      />
    </div>

    <!-- BẢNG DANH SÁCH CHI TIẾT SẢN PHẨM (CHỈ HIỂN THỊ KHI THÊM MỚI PHIẾU NHẬP) -->
    <div v-if="!isEdit" class="border rounded p-3 mb-4 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold mb-0 text-primary">
          <i class="fas fa-list me-1"></i> Danh Sách Sản Phẩm Nhập
        </h6>
        <button
          type="button"
          class="btn btn-sm btn-success"
          :disabled="!phieuNhapLocal.id_ncc"
          @click="openAddChiTietModal"
        >
          <i class="fas fa-plus me-1"></i> Thêm Sản Phẩm
        </button>
      </div>

      <small v-if="!phieuNhapLocal.id_ncc" class="text-warning d-block mb-2">
        ⚠️ Vui lòng chọn Nhà cung cấp trước khi thêm sản phẩm.
      </small>

      <!-- Bảng danh sách chi tiết tạm -->
      <ChiTietPhieuNhapTable
        :dsChiTiet="dsChiTietTam"
        @edit:chi-tiet="openEditModal"
        @delete:chiTiet="handleRemoveChiTietTam"
      />
    </div>

    <!-- MODAL POPUP CHỨA FORM CHI TIẾT PHIẾU NHẬP -->
    <div
      v-if="!isEdit"
      class="modal fade"
      id="modalChiTietTam"
      tabindex="-1"
      ref="modalChiTietTam"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{
                isEditBienThe
                  ? "Chỉnh Sửa Chi Tiết Phiếu Nhập"
                  : "Thêm Sản Phẩm Vào Phiếu Nhập"
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeChiTietModal"
            ></button>
          </div>
          <div class="modal-body">
            <ChiTietPhieuNhapForm
              v-if="showChiTietModal"
              :idNcc="phieuNhapLocal.id_ncc"
              :chiTiet="selectedChiTiet"
              :dsIdBienTheDaCo="existingVariantIds"
              :isEdit="isEditChiTiet"
              @submit:chiTiet="handleSaveChiTietTam"
              @cancel="closeChiTietModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4">
      <button class="btn btn-primary">
        <i class="fas fa-save me-1"></i> Lưu lại
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
    </div>
  </Form>

  <!-- Đặt QuickCreateModal ở cuối Template -->
  <QuickCreateModal ref="quickCreateModal" @created="handleQuickCreated" />
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import NhanVienService from "@/services/nhan-vien.service";
import NhaCungCapService from "@/services/nha-cung-cap.service";

import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";
import QuickCreateModal from "@/components/Common/QuickCreateModal.vue";
import ChiTietPhieuNhapForm from "@/components/ChiTietPhieuNhap/ChiTietPhieuNhapForm.vue";
import ChiTietPhieuNhapTable from "@/components/ChiTietPhieuNhap/ChiTietPhieuNhapTable.vue";
import { Modal } from "bootstrap";

export default {
  name: "PhieuNhapForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseSearchSelect,
    QuickCreateModal,
    ChiTietPhieuNhapTable,
    ChiTietPhieuNhapForm,
  },
  props: {
    phieuNhap: {
      type: Object,
      default: () => ({
        id_nhan_vien: "",
        id_ncc: "",
        ngay_nhap: "",
        tong_tien: 0,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:phieuNhap"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu bằng Yup
    const phieuNhapFormSchema = yup.object().shape({
      id_nhan_vien: yup.string().required("Mã nhân viên không được để trống."),
      id_ncc: yup.string().required("Vui lòng chọn nhà cung cấp."),
      ngay_nhap: yup.string().required("Vui lòng chọn ngày nhập."),
    });

    // Lấy thông tin user hiện tại từ localStorage
    let currentUserId = "";
    try {
      const userStr = localStorage.getItem("adminUser");
      const user = userStr ? JSON.parse(userStr) : null;
      currentUserId = user?.id;
    } catch (e) {
      console.error("Lỗi lấy thông tin currentUser:", e);
    }

    return {
      // Nếu là Thêm mới (!isEdit) -> Gán id_nhan_vien = currentUserId
      // Nếu là Sửa (isEdit) -> Giữ nguyên phieuNhap.id_nhan_vien truyền vào
      phieuNhapLocal: {
        ...this.phieuNhap,
        id_nhan_vien: this.isEdit ? this.phieuNhap.id_nhan_vien : currentUserId,
        ngay_nhap: this.formatDateTimeLocal(this.phieuNhap?.ngay_nhap),
      },
      phieuNhapFormSchema,
      dsNhanVien: [],
      dsNhaCungCap: [],

      // các biến hỗ trợ cho lưu chi tiết phiếu nhập tạm thời
      dsChiTietTam: [],
      showChiTietModal: false,
      modalChiTietInstance: null,

      isEditChiTiet: false, // Dùng biến riêng để quản lý trạng thái Edit của Modal Chi tiết phiếu nhập
      selectedChiTiet: null,
    };
  },

  watch: {
    // Khi prop phieuNhap thay đổi từ bên ngoài
    phieuNhap: {
      handler(newVal) {
        if (!newVal) return;
        this.phieuNhapLocal = { ...newVal };

        this.phieuNhapLocal.ngay_nhap = this.formatDateTimeLocal(
          this.phieuNhapLocal.ngay_nhap,
        );
      },
      deep: true,
    },
  },
  computed: {
    // Lấy mảng danh sách ID biến thể (trong danh sách tạm) đã áp có trong phiếu nhập này
    existingVariantIds() {
      if (!Array.isArray(this.dsChiTietTam)) return [];
      return this.dsChiTietTam.map((item) => item.id_bien_the);
    },
  },
  methods: {
    //======================== Thêm chi tiết phiếu nhập (tạm thời) vào phiếu nhập ============================//
    // Mở Modal Thêm Chi Tiết
    openAddChiTietModal() {
      this.isEditChiTiet = false;
      this.selectedChiTiet = {
        // Reset Object về rỗng
        id_phieu_nhap: "",
        id_bien_the: "",
        gia_nhap: 0,
        so_luong_nhap: 0,
      };
      this.showChiTietModal = true;
      this.$nextTick(() => {
        if (!this.modalChiTietInstance && this.$refs.modalChiTietTam) {
          this.modalChiTietInstance = new Modal(this.$refs.modalChiTietTam);
        }
        this.modalChiTietInstance?.show();
      });
    },

    // Đóng Modal Chi Tiết
    closeChiTietModal() {
      this.showChiTietModal = false;
      this.modalChiTietInstance?.hide();
    },

    // Thêm biến thể mới vào mảng tạm
    handleSaveChiTietTam(dataChiTiet) {
      if (this.isEditChiTiet) {
        // TRƯỜNG HỢP CẬP NHẬT: Tìm vị trí trong mảng tạm theo ID và ghi đè
        const index = this.dsChiTietTam.findIndex(
          (item) => item.id === this.selectedChiTiet.id,
        );
        if (index !== -1) {
          this.dsChiTietTam[index] = {
            ...this.dsChiTietTam[index],
            ...dataChiTiet,
          };
        }
      } else {
        // TRƯỜNG HỢP THÊM MỚI: Push phần tử mới vào mảng
        this.dsChiTietTam.push({
          ...dataChiTiet,
          id: `CT_TAM_${Date.now()}`, // Tạo ID tạm duy nhất
        });
      }

      this.closeChiTietModal();
    },

    // Mở Modal Chỉnh sửa
    openEditModal(itemSua) {
      this.isEditChiTiet = true;
      this.selectedChiTiet = { ...itemSua };
      this.showChiTietModal = true;
      this.modalChiTietInstance?.show();
    },

    // Xóa 1 dòng sản phẩm khỏi danh sách tạm
    handleRemoveChiTietTam(itemXoa) {
      this.dsChiTietTam = this.dsChiTietTam.filter(
        (item) =>
          item.id !== itemXoa.id && item.id_bien_the !== itemXoa.id_bien_the,
      );
    },
    //===============================================================================//

    // Format ngày chuẩn YYYY-MM-DDTHH:mm theo giờ local
    formatDateTimeLocal(dateStr) {
      // Nếu có dateStr thì parse ngày đó, nếu không thì lấy thời gian hiện tại của máy (Local Time)
      const d = dateStr ? new Date(dateStr) : new Date();

      if (isNaN(d.getTime())) return "";

      // Lấy các thành phần theo MÚI GIỜ ĐỊA PHƯƠNG (Local Time)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    // Định dạng tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Lấy danh sách Nhân Viên cho ô Select Dropdown
    async fetchNhanVien() {
      try {
        if (NhanVienService) {
          this.dsNhanVien = await NhanVienService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhân viên:", error);
      }
    },

    // Lấy danh sách Nhà Cung Cấp cho ô BaseSelect
    async fetchNhaCungCap() {
      try {
        if (NhaCungCapService) {
          this.dsNhaCungCap = await NhaCungCapService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhà cung cấp:", error);
      }
    },

    submitPhieuNhap() {
      // Kiểm tra nếu thêm mới mà chưa chọn sản phẩm nào
      if (!this.isEdit && this.dsChiTietTam.length === 0) {
        alert("Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập!");
        return;
      }

      const payload = this.phieuNhapLocal;

      if (payload.ngay_nhap) {
        payload.ngay_nhap = new Date(payload.ngay_nhap).toISOString();
      }

      // ĐÍNH KÈM MẢNG CHI TIẾT VÀO PAYLOAD (Chỉ khi thêm mới)
      if (!this.isEdit) {
        payload.ds_chi_tiet = this.dsChiTietTam.map((item) => ({
          id_bien_the: item.id_bien_the,
          so_luong_nhap: item.so_luong_nhap,
          gia_nhap: item.gia_nhap,
          thanh_tien: item.thanh_tien,
        }));
      }

      this.$emit("submit:phieuNhap", payload);
    },

    // Mở Modal Thêm Nhanh (truyền loại: 'thuong-hieu' | 'danh-muc' | 'nha-cung-cap')
    openQuickCreate(type) {
      if (this.$refs.quickCreateModal) {
        this.$refs.quickCreateModal.open(type);
      }
    },

    // Nhận kết quả từ QuickCreateModal -> Tải lại danh sách -> Chọn tự động mục vừa tạo
    async handleQuickCreated({ type, data }) {
      await this.fetchNhaCungCap(); // Cập nhật lại toàn bộ danh sách select

      const createdId = data?.data.id;
      if (!createdId) return;

      // Gán ID vừa tạo vào ô Select tương ứng
      if (type === "nha-cung-cap") {
        this.phieuNhapLocal.id_nha_cc = createdId;
      }
    },

    // Chuyển hướng quay lại trang danh sách phiếu nhập
    cancel() {
      this.$router.push({ name: "phieu-nhap.home" });
    },
  },
  async mounted() {
    await this.fetchNhanVien();
    await this.fetchNhaCungCap();

    // 2. Sau khi đã có dsNhanVien, dsNhaCungCap,.. mới gán dữ liệu cho form Edit và định dạng ngay_nhap theo đúng dạng datetime
    if (this.isEdit) {
      this.phieuNhapLocal = {
        ...this.phieuNhap,
        ngay_nhap: this.formatDateTimeLocal(this.phieuNhap?.ngay_nhap),
      };
    }
  },
};
</script>
