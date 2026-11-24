<template>
  <div class="card shadow-sm border-0 mb-4">
    <!-- HEADER -->
    <div
      class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center"
    >
      <h5 class="fw-bold mb-0 text-dark">
        <i class="fas fa-shipping-fast text-primary me-2"></i>Thông tin nhận
        hàng
      </h5>
      <button
        type="button"
        class="btn btn-sm btn-outline-primary fw-semibold"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i>Thêm địa chỉ mới
      </button>
    </div>

    <div class="card-body p-4">
      <!-- DẠNG 1: DÙNG SỔ ĐỊA CHỈ ĐÃ TẠO -->
      <div v-if="loading" class="text-center py-3">
        <span class="spinner-border spinner-border-sm text-primary me-2"></span>
        <span class="text-secondary small">Đang tải danh sách địa chỉ...</span>
      </div>

      <div v-else-if="addressList.length > 0" class="mb-4">
        <label class="form-label fw-semibold text-secondary small mb-2">
          Chọn địa chỉ nhận hàng khả dụng:
        </label>
        <div class="row g-3">
          <div class="col-12" v-for="addr in addressList" :key="addr.id">
            <!-- TÁI SỬ DỤNG COMPONENT DIA CHI CARD -->
            <DiaChiCard
              :address="addr"
              :is-selected="selectedAddressId === addr.id"
              @select="selectAddress"
            />
          </div>
        </div>
      </div>

      <!-- DẠNG 2: NHẬP TRỰC TIẾP FORM NẾU CHƯA CÓ ĐỊA CHỈ NÀO -->
      <form v-else @submit.prevent>
        <div class="alert alert-info py-2 px-3 small mb-3">
          <i class="fas fa-info-circle me-1"></i>
          Bạn chưa có sổ địa chỉ. Hãy điền thông tin bên dưới hoặc nhấn "Thêm
          địa chỉ mới".
        </div>
      </form>

      <!-- Ô GHI CHÚ ĐƠN HÀNG (LUÔN CÓ) -->
      <div class="col-12 mt-3 pt-2 border-top">
        <label class="form-label fw-semibold">Ghi chú đơn hàng</label>
        <textarea
          class="form-control"
          rows="2"
          :value="modelValue.ghi_chu"
          @input="updateField('ghi_chu', $event.target.value)"
          placeholder="Lưu ý cho người giao hàng (ví dụ: giao giờ hành chính...)"
        ></textarea>
      </div>
    </div>
  </div>

  <!-- MODAL THÊM ĐỊA CHỈ MỚI -->
  <div
    class="modal fade"
    id="diaChiModal"
    tabindex="-1"
    ref="diaChiModal"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ "Thêm Địa Chỉ" }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <AddressSelector
            v-if="showForm"
            @cancel="closeModal"
            @submit:address="onAddressAdded"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AddressSelector from "@/components/DiaChi/AddressSelector.vue";
import DiaChiCard from "@/components/TrangDatHang/DiaChiCard.vue";
import DiaChiService from "@/services/dia-chi.service";
import { Modal } from "bootstrap";

export default {
  name: "ThongTinNhanHang",
  components: {
    AddressSelector,
    DiaChiCard,
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        ghi_chu: "",
      }),
    },
    userId: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      showForm: false,
      modalInstance: null,

      loading: false,
      addressList: [],
      selectedAddressId: "",
    };
  },
  watch: {
    userId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.fetchAddresses();
        }
      },
    },
  },
  methods: {
    // Mở Modal Thêm mới
    openAddModal() {
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
      if (!this.modalInstance && this.$refs.diaChiModal) {
        this.modalInstance = new Modal(this.$refs.diaChiModal);
      }
      return this.modalInstance;
    },

    async fetchAddresses() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const response = await DiaChiService.getAll({
          id_khach_hang: this.userId,
        });
        this.addressList = Array.isArray(response) ? response : [];

        if (this.addressList.length > 0) {
          const defaultAddr =
            this.addressList.find((a) => a.la_mac_dinh) || this.addressList[0];
          this.selectAddress(defaultAddr);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách địa chỉ:", error);
      } finally {
        this.loading = false;
      }
    },

    selectAddress(addr) {
      if (!addr) return;
      this.selectedAddressId = addr.id;

      this.$emit("update:modelValue", {
        ...this.modelValue,
        ho_ten: addr.ten_nguoi_nhan,
        so_dien_thoai: addr.sdt_nguoi_nhan,
        province_id: addr.province_id,
        ten_tinh: addr.ten_tinh,
        district_id: addr.district_id,
        ten_huyen: addr.ten_huyen,
        ward_code: addr.ward_code,
        ten_xa: addr.ten_xa,
        dia_chi_cu_the: addr.dia_chi_cu_the,
      });
    },

    async onAddressAdded(newAddr) {
      try {
        const payload = {
          id_khach_hang: this.userId,
          ten_nguoi_nhan: newAddr.ten_nguoi_nhan,
          sdt_nguoi_nhan: newAddr.sdt_nguoi_nhan,
          dia_chi_cu_the: newAddr.dia_chi_cu_the,
          province_id: String(newAddr.province_id),
          ten_tinh: newAddr.ten_tinh,
          district_id: String(newAddr.district_id),
          ten_huyen: newAddr.ten_huyen,
          ward_code: String(newAddr.ward_code),
          ten_xa: newAddr.ten_xa,
          la_mac_dinh: Boolean(newAddr.la_mac_dinh),
        };

        // 2. Gọi API tạo mới và nhận về kết quả từ server (chứa id được sinh ra)
        const createdAddress = await DiaChiService.create(payload);
        this.message = "Thếm địa chỉ mới thành công!";
        this.closeModal();
        // 4. Chọn ngay địa chỉ vừa tạo dựa trên dữ liệu server trả về
        if (createdAddress) {
          this.selectAddress(createdAddress);
        }
        this.fetchAddresses();
      } catch (error) {
        console.error("Lỗi khi thêm địa chỉ:", error);
        // Bạn có thể thông báo lỗi cho người dùng ở đây nếu cần
      }
    },

    updateField(field, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [field]: value,
      });
    },
  },
};
</script>
