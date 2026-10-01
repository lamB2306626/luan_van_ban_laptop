<template>
  <div class="base-multi-search-select position-relative flex-grow-1" ref="selectContainer">
    <!-- KHỐI 1: Ô Input tìm kiếm chuẩn Bootstrap -->
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        :class="{ 'is-invalid': invalid }"
        :placeholder="placeholder"
        :disabled="disabled"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="isOpen = true"
      />

      <!-- Nút xóa riêng từ khóa đang gõ -->
      <button
        v-if="searchQuery && !disabled"
        type="button"
        class="btn btn-outline-secondary"
        title="Xóa từ khóa tìm kiếm"
        @click="clearSearch"
      >
        <i class="fas fa-times"></i>
      </button>

      <!-- Nút đóng/mở dropdown -->
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="disabled"
        @click="isOpen = !isOpen"
      >
        <i class="fas" :class="isOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
    </div>

    <!-- KHỐI 2: Hiển thị các Tag đã chọn (Nằm riêng biệt ngay bên dưới) -->
    <div
      v-if="selectedItems.length > 0"
      class="selected-tags-container d-flex flex-wrap gap-1 mt-2 p-2 border rounded bg-light"
      style="max-height: 100px; overflow-y: auto;"
    >
      <span
        v-for="item in selectedItems"
        :key="getItemValue(item)"
        class="badge bg-primary d-flex align-items-center gap-1 px-2 py-1"
        style="font-size: 0.85rem;"
      >
        [{{ getItemValue(item) }}] {{ getItemLabel(item) }}
        <i
          v-if="!disabled"
          class="fas fa-times cursor-pointer ms-1 text-white-50 hover-white"
          title="Bỏ chọn"
          @click.stop="removeItem(item)"
        ></i>
      </span>

      <!-- Nút Xóa tất cả các Tag -->
      <button
        v-if="selectedItems.length > 1 && !disabled"
        type="button"
        class="btn btn-xs btn-link text-danger text-decoration-none p-0 ms-auto fw-bold"
        style="font-size: 0.75rem;"
        @click="clearAllTags"
      >
        Xóa tất cả
      </button>
    </div>

    <!-- KHỐI 3: Danh sách gợi ý Checkbox Dropdown -->
    <ul
      v-if="isOpen && !disabled"
      class="dropdown-menu show w-100 mt-1 shadow-sm overflow-auto"
      style="max-height: 220px; z-index: 1050;"
    >
      <!-- Option phụ: Chọn tất cả / Bỏ chọn tất cả -->
      <li
        v-if="filteredOptions.length > 0"
        class="dropdown-item cursor-pointer border-bottom fw-bold text-primary py-2"
        @click="toggleSelectAll"
      >
        <input
          type="checkbox"
          class="form-check-input me-2 cursor-pointer"
          :checked="isAllSelected"
          @click.prevent
        />
        {{ isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả" }}
      </li>

      <!-- Danh sách các sản phẩm -->
      <template v-if="filteredOptions.length > 0">
        <li
          v-for="item in filteredOptions"
          :key="getItemValue(item)"
          class="dropdown-item cursor-pointer d-flex align-items-center py-2"
          @click="toggleItem(item)"
        >
          <input
            type="checkbox"
            class="form-check-input me-2 cursor-pointer"
            :checked="isSelected(item)"
            @click.prevent
          />
          <span>[{{ getItemValue(item) }}] {{ getItemLabel(item) }}</span>
        </li>
      </template>

      <!-- Không tìm thấy -->
      <li v-else class="dropdown-item disabled text-muted text-center py-2">
        Không tìm thấy kết quả
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "BaseMultiSearchSelect",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    labelKey: {
      type: String,
      default: "ten_san_pham",
    },
    valueKey: {
      type: String,
      default: "id",
    },
    placeholder: {
      type: String,
      default: "-- Nhập tên hoặc mã để tìm kiếm --",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    invalid: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      searchQuery: "",
      isOpen: false,
      selectedItems: [],
    };
  },
  computed: {
    filteredOptions() {
      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.options;

      return this.options.filter((item) => {
        const label = String(this.getItemLabel(item)).toLowerCase();
        const value = String(this.getItemValue(item)).toLowerCase();
        return label.includes(query) || value.includes(query);
      });
    },

    isAllSelected() {
      if (this.options.length === 0) return false;
      return this.modelValue.length === this.options.length;
    },
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.syncSelectedFromValue(newVal);
      },
      immediate: true,
      deep: true,
    },
    options: {
      handler() {
        this.syncSelectedFromValue(this.modelValue);
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    getItemLabel(item) {
      if (!item) return "";
      return item[this.labelKey] !== undefined ? item[this.labelKey] : "";
    },

    getItemValue(item) {
      if (!item) return "";
      return item[this.valueKey] !== undefined ? item[this.valueKey] : "";
    },

    isSelected(item) {
      const val = this.getItemValue(item);
      return this.modelValue.includes(val);
    },

    syncSelectedFromValue(valArray) {
      if (Array.isArray(valArray) && valArray.length > 0) {
        this.selectedItems = this.options.filter((item) =>
          valArray.includes(this.getItemValue(item))
        );
      } else {
        this.selectedItems = [];
      }
    },

    toggleItem(item) {
      const val = this.getItemValue(item);
      let newValues = [...this.modelValue];

      if (this.isSelected(item)) {
        newValues = newValues.filter((v) => v !== val);
      } else {
        newValues.push(val);
      }

      this.$emit("update:modelValue", newValues);
      this.$emit("change", newValues);
    },

    removeItem(item) {
      const val = this.getItemValue(item);
      const newValues = this.modelValue.filter((v) => v !== val);
      this.$emit("update:modelValue", newValues);
      this.$emit("change", newValues);
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.$emit("update:modelValue", []);
        this.$emit("change", []);
      } else {
        const allValues = this.options.map((item) => this.getItemValue(item));
        this.$emit("update:modelValue", allValues);
        this.$emit("change", allValues);
      }
    },

    // Xóa từ khóa trong ô tìm kiếm (Không đụng tới Tag)
    clearSearch() {
      this.searchQuery = "";
    },

    // Xóa tất cả Tag đang chọn
    clearAllTags() {
      this.$emit("update:modelValue", []);
      this.$emit("change", []);
    },

    handleClickOutside(event) {
      const el = this.$refs.selectContainer;
      if (el && !el.contains(event.target)) {
        this.isOpen = false;
        // Chỉ đóng dropdown, giữ nguyên từ khóa nếu người dùng chưa muốn xóa
      }
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.hover-white:hover {
  color: #fff !important;
}
</style>