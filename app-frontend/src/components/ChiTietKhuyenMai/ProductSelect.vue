<template>
  <div class="border rounded p-3 bg-light-subtle">
    <!-- 1. THANH BỘ LỌC ĐA TẦNG -->
    <button
      :disabled="
        !searchText && !filterCategory && !filterBrand && !filterSupplier
      "
      class="btn btn-outline-secondary"
      type="button"
      @click="resetFilters"
    >
      Xóa bộ lọc
    </button>
    <div class="row g-2 mb-3">
      <!-- Lọc Danh mục -->
      <div class="col-md-3">
        <label class="form-label small fw-bold text-secondary mb-1"
          >Danh mục</label
        >
        <BaseSearchSelect
          v-model="filterCategory"
          :options="dsDanhMuc"
          label-key="ten_danh_muc"
          value-key="id"
          placeholder="Gõ tên hoặc mã danh mục..."
          :disabled="disabled"
        />
      </div>

      <!-- Lọc Thương hiệu -->
      <div class="col-md-4">
        <label class="form-label small fw-bold text-secondary mb-1"
          >Thương hiệu</label
        >
        <BaseSearchSelect
          v-model="filterBrand"
          :options="dsThuongHieu"
          label-key="ten_thuong_hieu"
          value-key="id"
          placeholder="Gõ tên hoặc mã thương hiệu..."
          :disabled="disabled"
        />
      </div>

      <!-- Lọc Nhà cung cấp -->
      <div class="col-md-4">
        <label class="form-label small fw-bold text-secondary mb-1"
          >Nhà cung cấp</label
        >
        <BaseSearchSelect
          v-model="filterSupplier"
          :options="dsNhaCungCap"
          label-key="ten_ncc"
          value-key="id"
          placeholder="Gõ tên hoặc mã nhà cung cấp..."
          :disabled="disabled"
        />
      </div>
    </div>

    <!-- Ô tìm kiếm từ khóa phụ -->
    <div class="input-group input-group-sm mb-3">
      <span class="input-group-text"><i class="fas fa-search"></i></span>
      <input
        type="text"
        class="form-control"
        placeholder="Gõ tìm nhanh theo tên hoặc mã sản phẩm..."
        v-model="searchText"
      />
    </div>

    <!-- 2. KHU VỰC DANH SÁCH SẢN PHẨM CÓ CHECKBOX -->
    <div
      class="border rounded bg-white p-2"
      style="max-height: 250px; overflow-y: auto"
    >
      <div
        class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2 px-2 small fw-bold text-muted"
      >
        <div>
          <input
            type="checkbox"
            class="form-check-input me-2"
            :checked="isAllFilteredSelected"
            @change="toggleSelectAll"
          />
          <!-- Chỉ tính số lượng sản phẩm khả dụng (chưa áp dụng) cho phần chọn tất cả nếu muốn, hoặc giữ nguyên -->
          Chọn tất cả kết quả hiển thị ({{ filteredProducts.length }})
        </div>
        <div>
          Đã chọn:
          <span class="text-primary fw-bold">{{ modelValue.length }}</span> sản
          phẩm
        </div>
      </div>

      <div
        v-if="filteredProducts.length === 0"
        class="text-center text-muted small py-3"
      >
        Không tìm thấy sản phẩm nào phù hợp với bộ lọc!
      </div>

      <div
        v-for="sp in filteredProducts"
        :key="sp.id"
        class="form-check px-2 py-1 border-bottom-dashed d-flex align-items-center"
        :class="{ 'bg-light text-muted': dsIdSanPhamDaApDung.includes(sp.id) }"
      >
        <!-- Ô checkbox từng sản phẩm -->
        <input
          type="checkbox"
          class="form-check-input"
          :value="sp.id"
          :id="'prod-' + sp.id"
          :checked="modelValue.includes(sp.id)"
          :disabled="dsIdSanPhamDaApDung.includes(sp.id)"
          @change="toggleSelectProduct(sp.id)"
        />

        <!-- Label hiển thị tên sản phẩm kèm Badge thông báo nếu đã tồn tại -->
        <label
          class="form-check-label small d-flex justify-content-between w-100 ms-1"
          :class="{
            'cursor-pointer': !dsIdSanPhamDaApDung.includes(sp.id),
            'opacity-75': dsIdSanPhamDaApDung.includes(sp.id),
          }"
          :for="'prod-' + sp.id"
        >
          <span>
            <strong class="text-secondary">[{{ sp.id }}]</strong>
            {{ sp.ten_san_pham }}

            <!-- Badge thông báo sản phẩm đã được áp dụng -->
            <span
              v-if="dsIdSanPhamDaApDung.includes(sp.id)"
              class="badge bg-secondary text-white ms-2"
              style="font-size: 10px"
            >
              Đã có trong đợt KM
            </span>
          </span>

          <span class="text-muted" style="font-size: 11px">
            {{ sp.thuong_hieu?.ten_thuong_hieu }} |
            {{ sp.danh_muc?.ten_danh_muc }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";

export default {
  name: "ProductSelect",
  components: {
    BaseSearchSelect,
  },
  props: {
    modelValue: { type: Array, default: () => [] }, // Nhận mảng ID sản phẩm được chọn (v-model)
    options: { type: Array, default: () => [] }, // Danh sách toàn bộ sản phẩm gốc truyền vào

    // Mảng ID sản phẩm đã tồn tại từ cha xuống để disable không cho chọn lại
    // sản phẩm đã áp dụng đợt khuyến mãi này trong form thêm mới
    dsIdSanPhamDaApDung: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      filterCategory: "",
      filterBrand: "",
      filterSupplier: "",
      searchText: "",
    };
  },
  computed: {
    // Tự động trích xuất danh mục từ options
    dsDanhMuc() {
      const map = new Map();
      this.options.forEach((sp) => {
        if (sp.danh_muc?.id) map.set(sp.danh_muc.id, sp.danh_muc);
      });
      return Array.from(map.values());
    },
    // Tự động trích xuất thương hiệu
    dsThuongHieu() {
      const map = new Map();
      this.options.forEach((sp) => {
        if (sp.thuong_hieu?.id) {
          if (
            this.filterCategory &&
            String(sp.id_danh_muc) !== String(this.filterCategory)
          )
            return;
          map.set(sp.thuong_hieu.id, sp.thuong_hieu);
        }
      });
      return Array.from(map.values());
    },
    // Tự động trích xuất nhà cung cấp
    dsNhaCungCap() {
      const map = new Map();
      this.options.forEach((sp) => {
        if (
          sp.nha_cung_cap_san_pham &&
          Array.isArray(sp.nha_cung_cap_san_pham)
        ) {
          sp.nha_cung_cap_san_pham.forEach((item) => {
            if (item.nha_cung_cap)
              map.set(item.nha_cung_cap.id, item.nha_cung_cap);
          });
        }
      });
      return Array.from(map.values());
    },
    // Lọc danh sách sản phẩm dựa trên các tiêu chí chọn ở trên
    filteredProducts() {
      return this.options.filter((sp) => {
        if (
          this.filterCategory &&
          String(sp.id_danh_muc) !== String(this.filterCategory)
        )
          return false;
        if (
          this.filterBrand &&
          String(sp.id_thuong_hieu) !== String(this.filterBrand)
        )
          return false;
        if (this.filterSupplier) {
          const hasSup = sp.nha_cung_cap_san_pham?.some(
            (item) => String(item.id_nha_cc) === String(this.filterSupplier),
          );
          if (!hasSup) return false;
        }
        if (this.searchText) {
          const keyword = this.searchText.toLowerCase();
          const matchName = sp.ten_san_pham?.toLowerCase().includes(keyword);
          const matchId = sp.id?.toLowerCase().includes(keyword);
          if (!matchName && !matchId) return false;
        }
        return true;
      });
    },
    isAllFilteredSelected() {
      if (this.filteredProducts.length === 0) return false;
      return this.filteredProducts.every((sp) =>
        this.modelValue.includes(sp.id),
      );
    },
  },
  methods: {
    toggleSelectProduct(id) {
      const newVal = [...this.modelValue];
      const index = newVal.indexOf(id);
      if (index > -1) {
        newVal.splice(index, 1);
      } else {
        newVal.push(id);
      }
      this.$emit("update:modelValue", newVal);
    },
    toggleSelectAll(e) {
      const filteredIds = this.filteredProducts.map((sp) => sp.id);
      if (e.target.checked) {
        // Gom thêm các ID mới vào mảng hiện tại mà không làm mất các ID ở trang/bộ lọc khác đã chọn trước đó
        const combined = Array.from(
          new Set([...this.modelValue, ...filteredIds]),
        );
        this.$emit("update:modelValue", combined);
      } else {
        // Bỏ chọn tất cả các sản phẩm đang hiển thị trong bộ lọc này
        const remaining = this.modelValue.filter(
          (id) => !filteredIds.includes(id),
        );
        this.$emit("update:modelValue", remaining);
      }
    },
    resetFilters() {
      this.filterCategory = "";
      this.filterBrand = "";
      this.filterSupplier = "";
      this.searchText = "";
    },
  },
};
</script>
