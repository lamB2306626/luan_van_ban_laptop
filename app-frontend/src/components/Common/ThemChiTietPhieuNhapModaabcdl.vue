<template>
  <div
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content shadow-lg">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-boxes me-2"></i>Thêm Sản Phẩm Vào Phiếu Nhập
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="$emit('close')"
          ></button>
        </div>

        <div class="modal-body">
          <!-- 0. CHẾ ĐỘ 1: TÌM TRỰC TIẾP THEO MÃ BIẾN THỂ -->
          <div class="card bg-light border-0 p-3 mb-3">
            <label class="fw-bold mb-1 text-primary">
              <i class="fas fa-barcode me-1"></i> Tìm nhanh theo Mã Biến Thể / SKU:
            </label>
            <BaseSearchSelect
              v-model="quickVariantId"
              :options="dsBienTheGoc"
              label-key="ma_search_label"
              value-key="id"
              placeholder="Nhập mã biến thể (VD: BT01, BT02...) để chọn nhanh..."
              @change="onQuickVariantSelect"
            />
          </div>

          <div class="text-center text-muted small my-2 fw-bold">--- HOẶC LỌC THEO CẤU HÌNH ---</div>

          <!-- 1. CẤP 1: CHỌN SẢN PHẨM MẸ -->
          <div class="form-group mb-3">
            <label class="fw-bold mb-1">
              1. Chọn Sản Phẩm <span class="text-danger">*</span>:
            </label>
            <BaseSearchSelect
              v-model="selectedProductId"
              :options="dsSanPham"
              label-key="ten_san_pham"
              value-key="id"
              placeholder="Gõ tên hoặc mã sản phẩm gốc..."
              @change="onProductChange"
            />
          </div>

          <!-- 2. CẤP 2: LỌC THEO 5 THUỘC TÍNH (Màu, CPU, GPU, RAM, ROM) -->
          <div
            class="card p-3 mb-3 border"
            :class="{ 'opacity-50 pointer-events-none': !selectedProductId }"
          >
            <label class="fw-bold mb-2 text-dark">
              2. Lọc thông số cấu hình biến thể:
            </label>
            <div class="row g-2">
              <!-- Màu sắc -->
              <div class="col-md-4 col-6">
                <label class="small text-muted fw-bold">Màu sắc:</label>
                <select
                  class="form-select form-select-sm"
                  v-model="filterConfig.mau_sac"
                  :disabled="!selectedProductId"
                >
                  <option value="">-- Tất cả màu --</option>
                  <option v-for="opt in availableColors" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- CPU -->
              <div class="col-md-4 col-6">
                <label class="small text-muted fw-bold">CPU:</label>
                <select
                  class="form-select form-select-sm"
                  v-model="filterConfig.cpu"
                  :disabled="!selectedProductId"
                >
                  <option value="">-- Tất cả CPU --</option>
                  <option v-for="opt in availableCPUs" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- GPU -->
              <div class="col-md-4 col-6">
                <label class="small text-muted fw-bold">GPU:</label>
                <select
                  class="form-select form-select-sm"
                  v-model="filterConfig.gpu"
                  :disabled="!selectedProductId"
                >
                  <option value="">-- Tất cả GPU --</option>
                  <option v-for="opt in availableGPUs" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- RAM -->
              <div class="col-md-6 col-6">
                <label class="small text-muted fw-bold">RAM:</label>
                <select
                  class="form-select form-select-sm"
                  v-model="filterConfig.ram"
                  :disabled="!selectedProductId"
                >
                  <option value="">-- Tất cả RAM --</option>
                  <option v-for="opt in availableRAMs" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- ROM -->
              <div class="col-md-6 col-6">
                <label class="small text-muted fw-bold">ROM / SSD:</label>
                <select
                  class="form-select form-select-sm"
                  v-model="filterConfig.rom"
                  :disabled="!selectedProductId"
                >
                  <option value="">-- Tất cả ROM --</option>
                  <option v-for="opt in availableROMs" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. KẾT QUẢ BIẾN THỂ KHỚP VỚI BỘ LỌC -->
          <div class="form-group mb-3">
            <label class="fw-bold mb-1">
              Biến thể phù hợp thu được <span class="text-danger">*</span>:
            </label>
            <select
              class="form-select"
              v-model="selectedVariantId"
              :disabled="filteredVariants.length === 0"
            >
              <option value="">-- Chọn biến thể cụ thể --</option>
              <option
                v-for="item in filteredVariants"
                :key="item.id"
                :value="item.id"
              >
                [{{ item.id }}] {{ formatVariantLabel(item) }}
              </option>
            </select>
            <div
              v-if="selectedProductId && filteredVariants.length === 0"
              class="text-danger small mt-1"
            >
              Không tìm thấy biến thể nào phù hợp với bộ lọc cấu hình trên!
            </div>
          </div>

          <!-- 4. NHẬP SỐ LƯỢNG VÀ ĐƠN GIÁ NHẬP -->
          <div class="row g-2 border-top pt-3 mt-3">
            <div class="col-md-6">
              <label class="fw-bold mb-1">Số lượng nhập <span class="text-danger">*</span>:</label>
              <input
                type="number"
                class="form-control"
                v-model.number="formData.so_luong"
                min="1"
                placeholder="Nhập số lượng..."
              />
            </div>
            <div class="col-md-6">
              <label class="fw-bold mb-1">Đơn giá nhập (VNĐ) <span class="text-danger">*</span>:</label>
              <input
                type="number"
                class="form-control"
                v-model.number="formData.don_gia"
                min="0"
                placeholder="Nhập đơn giá..."
              />
            </div>
          </div>
        </div>

        <!-- FOOTER MODAL -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            <i class="fas fa-times me-1"></i> Hủy
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedVariantId || formData.so_luong <= 0"
            @click="handleConfirm"
          >
            <i class="fas fa-plus me-1"></i> Thêm vào phiếu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";

export default {
  name: "ThemChiTietPhieuNhapModal",
  components: { BaseSearchSelect },
  props: {
    // Truyền danh sách Sản phẩm & Biến thể từ trang chính vào
    dsSanPham: { type: Array, default: () => [] },
    dsBienThe: { type: Array, default: () => [] },
  },
  emits: ["close", "add-item"],
  data() {
    return {
      quickVariantId: "",
      selectedProductId: "",
      selectedVariantId: "",
      filterConfig: {
        mau_sac: "",
        cpu: "",
        gpu: "",
        ram: "",
        rom: "",
      },
      formData: {
        so_luong: 1,
        don_gia: 0,
      },
    };
  },
  computed: {
    // Danh sách biến thể phục vụ tìm kiếm nhanh (gộp Mã + Tên + Cấu hình)
    dsBienTheGoc() {
      return this.dsBienThe.map((bt) => ({
        ...bt,
        ma_search_label: `${bt.id} - ${bt.ten_san_pham || ''} (${bt.ram || ''}/${bt.rom || ''}/${bt.mau_sac || ''})`,
      }));
    },

    // 1. Danh sách tất cả biến thể của riêng sản phẩm đã chọn
    variantsOfSelectedProduct() {
      if (!this.selectedProductId) return [];
      return this.dsBienThe.filter(
        (bt) => bt.id_san_pham === this.selectedProductId
      );
    },

    // Các danh sách thuộc tính độc bản (Unique) để render vào 5 ô select ở Cấp 2
    availableColors() {
      return [...new Set(this.variantsOfSelectedProduct.map((v) => v.mau_sac).filter(Boolean))];
    },
    availableCPUs() {
      return [...new Set(this.variantsOfSelectedProduct.map((v) => v.cpu).filter(Boolean))];
    },
    availableGPUs() {
      return [...new Set(this.variantsOfSelectedProduct.map((v) => v.gpu).filter(Boolean))];
    },
    availableRAMs() {
      return [...new Set(this.variantsOfSelectedProduct.map((v) => v.ram).filter(Boolean))];
    },
    availableROMs() {
      return [...new Set(this.variantsOfSelectedProduct.map((v) => v.rom).filter(Boolean))];
    },

    // 2. Danh sách biến thể thu hẹp sau khi đã qua bộ lọc 5 thuộc tính
    filteredVariants() {
      return this.variantsOfSelectedProduct.filter((v) => {
        const matchColor = !this.filterConfig.mau_sac || v.mau_sac === this.filterConfig.mau_sac;
        const matchCPU = !this.filterConfig.cpu || v.cpu === this.filterConfig.cpu;
        const matchGPU = !this.filterConfig.gpu || v.gpu === this.filterConfig.gpu;
        const matchRAM = !this.filterConfig.ram || v.ram === this.filterConfig.ram;
        const matchROM = !this.filterConfig.rom || v.rom === this.filterConfig.rom;

        return matchColor && matchCPU && matchGPU && matchRAM && matchROM;
      });
    },
  },
  watch: {
    // Khi danh sách biến thể lọc thay đổi, nếu chỉ còn đúng 1 kết quả -> Tự chọn luôn
    filteredVariants(newVal) {
      if (newVal.length === 1) {
        this.selectedVariantId = newVal[0].id;
      } else if (!newVal.some((v) => v.id === this.selectedVariantId)) {
        this.selectedVariantId = "";
      }
    },
  },
  methods: {
    // Khi chọn sản phẩm ở Cấp 1 -> Reset lại bộ lọc Cấp 2
    onProductChange() {
      this.quickVariantId = "";
      this.selectedVariantId = "";
      this.resetFilterConfig();
    },

    // Xử lý khi chọn nhanh bằng Mã biến thể / SKU
    onQuickVariantSelect(variant) {
      if (!variant) return;

      // Tự động điền thông tin tương ứng lên giao diện
      this.selectedProductId = variant.id_san_pham;
      this.selectedVariantId = variant.id;
      this.filterConfig = {
        mau_sac: variant.mau_sac || "",
        cpu: variant.cpu || "",
        gpu: variant.gpu || "",
        ram: variant.ram || "",
        rom: variant.rom || "",
      };
    },

    resetFilterConfig() {
      this.filterConfig = {
        mau_sac: "",
        cpu: "",
        gpu: "",
        ram: "",
        rom: "",
      };
    },

    formatVariantLabel(bt) {
      const details = [bt.cpu, bt.gpu, bt.ram, bt.rom, bt.mau_sac]
        .filter(Boolean)
        .join(" - ");
      return details ? details : "Mặc định";
    },

    handleConfirm() {
      const selectedVariant = this.dsBienThe.find(
        (v) => v.id === this.selectedVariantId
      );

      if (!selectedVariant) return;

      this.$emit("add-item", {
        id_bien_the: selectedVariant.id,
        bien_the: selectedVariant,
        so_luong: this.formData.so_luong,
        don_gia: this.formData.don_gia,
        thanh_tien: this.formData.so_luong * this.formData.don_gia,
      });

      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none;
}
</style>