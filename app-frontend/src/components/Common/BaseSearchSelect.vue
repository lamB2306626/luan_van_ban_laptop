<template>
  <div class="base-search-select position-relative" ref="selectContainer">
    <!-- Ô Input tìm kiếm / hiển thị -->
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        :class="{ 'is-invalid': invalid }"
        :placeholder="placeholder"
        :disabled="disabled"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="onInput"
      />

      <!-- Nút xóa lựa chọn -->
      <button
        v-if="modelValue && !disabled"
        type="button"
        class="btn btn-outline-secondary"
        @click="clearSelection"
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
        <i
          class="fas"
          :class="isOpen ? 'fa-chevron-up' : 'fa-chevron-down'"
        ></i>
      </button>
    </div>

    <!-- Danh sách gợi ý -->
    <ul
      v-if="isOpen && !disabled"
      class="dropdown-menu show w-100 mt-1 shadow-sm overflow-auto"
      style="max-height: 200px; z-index: 1050"
    >
      <template v-if="filteredOptions.length > 0">
        <li
          v-for="item in filteredOptions"
          :key="getItemValue(item)"
          class="dropdown-item cursor-pointer"
          @click="selectOption(item)"
        >
          [{{ getItemValue(item) }}] {{ getItemLabel(item) }}
        </li>
      </template>

      <li v-else class="dropdown-item disabled text-muted text-center py-2">
        Không tìm thấy kết quả
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "BaseSearchSelect",
  props: {
    modelValue: {
      type: [String, Number],
      default: "",
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
      selectedItem: null,
    };
  },
  computed: {
    // Lọc danh sách theo Tên hoặc Mã ID
    filteredOptions() {
      // Nếu đã chọn xong và chữ trong input bằng đúng tên item chọn -> Hiện full mảng khi click mở lại
      if (
        this.selectedItem &&
        this.searchQuery === this.getItemLabel(this.selectedItem)
      ) {
        return this.options;
      }

      const query = this.searchQuery.toLowerCase().trim();
      if (!query) return this.options;

      return this.options.filter((item) => {
        const label = String(this.getItemLabel(item)).toLowerCase();
        const value = String(this.getItemValue(item)).toLowerCase();

        // Tìm từ khóa trong Tên HOẶC trong Mã ID
        return label.includes(query) || value.includes(query);
      });
    },
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.syncSelectedFromValue(newVal);
      },
      immediate: true,
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
    // Lấy chuỗi Tên an toàn
    getItemLabel(item) {
      if (!item) return "";
      return item[this.labelKey] !== undefined ? item[this.labelKey] : "";
    },

    // Lấy Mã ID an toàn
    getItemValue(item) {
      if (!item) return "";
      return item[this.valueKey] !== undefined ? item[this.valueKey] : "";
    },

    // Đồng bộ tên hiển thị từ ID được truyền từ cha vào
    syncSelectedFromValue(val) {
      if (val !== null && val !== undefined && val !== "") {
        const found = this.options.find(
          (item) => this.getItemValue(item) === val,
        );
        if (found) {
          this.selectedItem = found;
          this.searchQuery = this.getItemLabel(found);
          return;
        }
      }
      this.selectedItem = null;
      this.searchQuery = "";
    },

    onInput() {
      this.isOpen = true;
      this.selectedItem = null;
    },

    // Người dùng click chọn 1 dòng trong danh sách
    selectOption(item) {
      this.selectedItem = item;
      this.searchQuery = this.getItemLabel(item);
      this.isOpen = false;

      // Trả mã ID về v-model cho component cha
      this.$emit("update:modelValue", this.getItemValue(item));
      this.$emit("change", item);
    },

    clearSelection() {
      this.selectedItem = null;
      this.searchQuery = "";
      this.$emit("update:modelValue", "");
      this.$emit("change", null);
      this.isOpen = false;
    },

    // Click ra ngoài ô tìm kiếm mà chưa chọn item -> Tự xóa chữ tự gõ
    handleClickOutside(event) {
      const el = this.$refs.selectContainer;
      if (el && !el.contains(event.target)) {
        this.isOpen = false;

        // Nếu chưa bấm chọn item nào trong danh sách
        if (!this.selectedItem) {
          this.searchQuery = "";
          this.$emit("update:modelValue", "");
        } else {
          // Khôi phục lại đúng tên item đã chọn trước khi gõ dở dang
          this.searchQuery = this.getItemLabel(this.selectedItem);
        }
      }
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
