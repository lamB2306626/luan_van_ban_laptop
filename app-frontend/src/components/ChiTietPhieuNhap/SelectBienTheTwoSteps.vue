<template>
  <div class="border rounded p-3 position-relative">
    <!-- NÚT CHUYỂN ĐỔI CHẾ ĐỘ TÌM KIẾM -->
    <div
      class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2"
    >
      <span class="fw-bold text-primary small">
        <i
          :class="isQuickSearch ? 'fas fa-barcode me-1' : 'fas fa-filter me-1'"
        ></i>
        {{ isQuickSearch ? "Tìm theo Mã" : "Tìm theo bộ lọc" }}
      </span>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        :disabled="disabled"
        @click="toggleMode"
      >
        <i class="fas fa-exchange-alt me-1"></i>
        {{ isQuickSearch ? "Tìm theo bộ lọc" : "Tìm theo Mã" }}
      </button>
    </div>

    <!-- ================= CHẾ ĐỘ 1: TÌM NHANH THEO MÃ ================= -->
    <div v-if="isQuickSearch">
      <BaseSearchSelect
        :model-value="modelValue"
        :options="dsBienTheSearchOptions"
        label-key="label_search"
        value-key="id"
        placeholder="Nhập mã biến thể để tìm..."
        :disabled="disabled"
        @update:model-value="onSelectVariant"
      />
    </div>

    <!-- ================= CHẾ ĐỘ 2: PHỄU LỌC 2 BƯỚC ================= -->
    <div v-else>
      <!-- BƯỚC 1: CHỌN SẢN PHẨM MẸ -->
      <div class="mb-3">
        <label class="form-label small fw-bold text-secondary">
          Bước 1: Chọn sản phẩm gốc
        </label>
        <BaseSearchSelect
          v-model="selectedProductId"
          :options="dsSanPham"
          label-key="ten_san_pham"
          value-key="id"
          placeholder="Gõ tên hoặc mã sản phẩm gốc..."
          :disabled="disabled"
          @update:model-value="onProductChange"
        />
      </div>

      <!-- BƯỚC 2: LỌC THEO THÔNG SỐ CẤU HÌNH -->
      <label class="form-label small fw-bold text-secondary mb-2">
        Bước 2: Chọn thông số kỹ thuật
      </label>
        <div class="row g-2">
          <!-- Màu sắc -->
          <div class="col-md-4 col-6">
            <select
              class="form-select form-control form-select-sm"
              v-model="filterConfig.id_mau_sac"
              :disabled="!selectedProductId || disabled"
            >
              <option value="">-- Tất cả Màu --</option>
              <option
                v-for="opt in availableColors"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.ten_mau_sac }}
              </option>
            </select>
          </div>

          <!-- CPU -->
          <div class="col-md-4 col-6">
            <select
              class="form-select form-control form-select-sm"
              v-model="filterConfig.id_cpu"
              :disabled="!selectedProductId || disabled"
            >
              <option value="">-- Tất cả CPU --</option>
              <option
                v-for="opt in availableCPUs"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.ten_cpu }}
              </option>
            </select>
          </div>

          <!-- GPU -->
          <div class="col-md-4 col-6">
            <select
              class="form-select form-control form-select-sm"
              v-model="filterConfig.id_gpu"
              :disabled="!selectedProductId || disabled"
            >
              <option value="">-- Tất cả GPU --</option>
              <option
                v-for="opt in availableGPUs"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.ten_gpu }}
              </option>
            </select>
          </div>

          <!-- RAM -->
          <div class="col-md-4 col-6">
            <select
              class="form-select form-control form-select-sm"
              v-model="filterConfig.id_ram"
              :disabled="!selectedProductId || disabled"
            >
              <option value="">-- Tất cả RAM --</option>
              <option
                v-for="opt in availableRAMs"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.dung_luong_ram }}
              </option>
            </select>
          </div>

          <!-- ROM -->
          <div class="col-md-4 col-6">
            <select
              class="form-select form-control form-select-sm"
              v-model="filterConfig.id_rom"
              :disabled="!selectedProductId || disabled"
            >
              <option value="">-- Tất cả ROM --</option>
              <option
                v-for="opt in availableROMs"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.dung_luong_rom }}
              </option>
            </select>
          </div>
        </div>

      <!-- KẾT QUẢ BIẾN THỂ LỌC ĐƯỢC -->
      <div v-if="selectedProductId" class="mt-3">
        <label
          class="form-label small fw-bold text-secondary d-flex justify-content-between align-items-center"
        >
          <span
            ><i class="fas fa-list me-1"></i> Danh sách biến thể phù hợp:</span
          >
        </label>

        <!-- Danh sách hiển thị trực tiếp, có scrollbar nếu quá dài -->
        <div
          class="list-group overflow-auto border rounded shadow-sm bg-white"
          style="max-height: 180px"
        >
          <template v-if="filteredVariants.length > 0">
            <button
              type="button"
              v-for="bt in filteredVariants"
              :key="bt.id"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 small cursor-pointer"
              :class="{ 'active fw-bold': modelValue === bt.id }"
              @click="onSelectVariant(bt.id)"
            >
              <div>
                <span class="badge bg-secondary me-2">[{{ bt.id }}]</span>
                <span>{{ formatVariantDetail(bt) }}</span>
              </div>
              <i
                v-if="modelValue === bt.id"
                class="fas fa-check-circle text-white"
              ></i>
            </button>
          </template>

          <!-- Thông báo nếu không tìm thấy -->
          <div v-else class="p-3 text-center text-muted small">
            <i class="fas fa-exclamation-triangle me-1 text-warning"></i> Không
            tìm thấy biến thể nào phù hợp với các thông số đã chọn!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";

export default {
  name: "SelectBienTheTwoSteps",
  components: { BaseSearchSelect },
  props: {
    // ID Biến thể nhận từ v-model của VeeValidate
    modelValue: { type: String, default: "" },
    // Toàn bộ danh sách biến thể (chứa sẵn quan hệ Prisma)
    dsBienThe: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      isQuickSearch: false,
      selectedProductId: "",
      filterConfig: {
        id_mau_sac: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
      },
    };
  },
  computed: {
    // 1. Tự động trích xuất danh sách Sản Phẩm Mẹ từ dsBienThe
    dsSanPham() {
      const mapSp = new Map();
      this.dsBienThe.forEach((bt) => {
        if (bt.san_pham && !mapSp.has(bt.id_san_pham)) {
          mapSp.set(bt.id_san_pham, bt.san_pham);
        } else if (!bt.san_pham && !mapSp.has(bt.id_san_pham)) {
          mapSp.set(bt.id_san_pham, {
            id: bt.id_san_pham,
            ten_san_pham: `Sản phẩm ${bt.id_san_pham}`,
          });
        }
      });
      return Array.from(mapSp.values());
    },

    // 2. Danh sách tùy chọn cho ô Tìm Nhanh (Gộp mã + tên + cấu hình)
    dsBienTheSearchOptions() {
      return this.dsBienThe.map((bt) => ({
        ...bt,
        label_search: `[${bt.id}] ${bt.san_pham?.ten_san_pham} - ${this.formatVariantDetail(bt)}`,
      }));
    },

    // 3. Lọc danh sách biến thể thuộc Sản Phẩm đã chọn
    variantsOfSelectedProduct() {
      if (!this.selectedProductId) return [];
      return this.dsBienThe.filter(
        (bt) => bt.id_san_pham === this.selectedProductId,
      );
    },

    // 4. Các danh sách thuộc tính ĐỘC BẢN (Unique) cho 5 ô Select ở Bước 2
    availableColors() {
      return this.getUniqueOptions("mau_sac", "id_mau_sac", "ten_mau_sac");
    },
    availableCPUs() {
      return this.getUniqueOptions("cpu", "id_cpu", "ten_cpu");
    },
    availableGPUs() {
      return this.getUniqueOptions("gpu", "id_gpu", "ten_gpu");
    },
    availableRAMs() {
      return this.getUniqueOptions(
        "dung_luong_ram",
        "id_ram",
        "dung_luong_ram",
      );
    },
    availableROMs() {
      return this.getUniqueOptions(
        "dung_luong_rom",
        "id_rom",
        "dung_luong_rom",
      );
    },

    // 5. Danh sách biến thể thỏa mãn 5 ô lọc thuộc tính ở Bước 2
    filteredVariants() {
      return this.variantsOfSelectedProduct.filter((bt) => {
        const matchColor =
          !this.filterConfig.id_mau_sac ||
          bt.id_mau_sac === this.filterConfig.id_mau_sac;
        const matchCPU =
          !this.filterConfig.id_cpu || bt.id_cpu === this.filterConfig.id_cpu;
        const matchGPU =
          !this.filterConfig.id_gpu || bt.id_gpu === this.filterConfig.id_gpu;
        const matchRAM =
          !this.filterConfig.id_ram || bt.id_ram === this.filterConfig.id_ram;
        const matchROM =
          !this.filterConfig.id_rom || bt.id_rom === this.filterConfig.id_rom;

        return matchColor && matchCPU && matchGPU && matchRAM && matchROM;
      });
    },
  },
  watch: {
    // Đồng bộ ngược khi Form truyền giá trị ban đầu vào (VD: khi sửa chi tiết)
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.dsBienThe.length > 0) {
          const currentVariant = this.dsBienThe.find((bt) => bt.id === newVal);
          if (currentVariant) {
            this.selectedProductId = currentVariant.id_san_pham;
            this.filterConfig = {
              id_mau_sac: currentVariant.id_mau_sac || "",
              id_cpu: currentVariant.id_cpu || "",
              id_gpu: currentVariant.id_gpu || "",
              id_ram: currentVariant.id_ram || "",
              id_rom: currentVariant.id_rom || "",
            };
          }
        }
      },
    },
  },
  methods: {
    toggleMode() {
      this.isQuickSearch = !this.isQuickSearch;
    },

    onProductChange() {
      this.resetFilterConfig();
      this.onSelectVariant("");
    },

    onSelectVariant(variantId) {
      this.$emit("update:modelValue", variantId);
    },

    resetFilterConfig() {
      this.filterConfig = {
        id_mau_sac: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
      };
    },

    // Hàm bổ trợ lấy tùy chọn duy nhất cho từng thuộc tính
    getUniqueOptions(relationKey, foreignKey, nameKey) {
      const map = new Map();
      this.variantsOfSelectedProduct.forEach((bt) => {
        const id = bt[foreignKey];
        if (id && !map.has(id)) {
          const name = bt[relationKey]?.[nameKey] || id;
          map.set(id, { id, [nameKey]: name });
        }
      });
      return Array.from(map.values());
    },

    // Format chuỗi hiển thị chi tiết thông số
    formatVariantDetail(bt) {
      const parts = [
        bt.cpu?.ten_cpu,
        bt.gpu?.ten_gpu,
        bt.dung_luong_ram?.dung_luong_ram
          ? `RAM ${bt.dung_luong_ram.dung_luong_ram}`
          : null,
        bt.dung_luong_rom?.dung_luong_rom
          ? `ROM ${bt.dung_luong_rom.dung_luong_rom}`
          : null,
        bt.mau_sac?.ten_mau_sac,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(" - ") : "Mặc định";
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none;
}
</style>
