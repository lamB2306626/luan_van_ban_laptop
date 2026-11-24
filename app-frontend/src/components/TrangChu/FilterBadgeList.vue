<template>
  <div class="filter-row-container">
    <!-- Tiêu đề tiêu chuẩn phía trước (Cố định chiều rộng để các dòng thẳng tắp) -->
    <span
      v-if="label"
      class="fw-bold text-secondary text-uppercase filter-label"
    >
      {{ label }}:
    </span>

    <div class="filter-pills-wrapper">
      <!-- Nút "Tất cả" -->
      <button
        type="button"
        class="btn btn-sm filter-pill m-1"
        :class="
          modelValue === '' || modelValue === null || modelValue === undefined
            ? 'active-pill'
            : 'inactive-pill'
        "
        @click="selectItem('')"
      >
        Tất Cả
      </button>

      <!-- Danh sách các thẻ dữ liệu (Giữ nguyên vị trí gốc, không splice/unshift) -->
      <button
        v-for="item in displayedItems"
        :key="getItemValue(item)"
        type="button"
        class="btn btn-sm filter-pill d-flex align-items-center gap-1 m-1"
        :class="
          modelValue == getItemValue(item) ? 'active-pill' : 'inactive-pill'
        "
        @click="selectItem(getItemValue(item))"
      >
        <!-- Hiển thị Icon nếu có -->
        <i v-if="item[iconKey]" :class="item[iconKey]"></i>
        <span>{{ getItemLabel(item) }}</span>
      </button>

      <!-- Nút Xem thêm / Thu gọn (Thiết kế thành nút pill đồng bộ) -->
      <button
        v-if="items.length > limit"
        type="button"
        class="btn btn-sm filter-pill more-pill m-1"
        @click="showAll = !showAll"
      >
        <i
          :class="showAll ? 'fas fa-chevron-up me-1' : 'fas fa-ellipsis-h me-1'"
        ></i>
        {{ showAll ? "Thu gọn" : `Xem thêm (${items.length - limit})` }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "FilterBadgeList",
  props: {
    label: { type: String, default: "" },
    items: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: "" },
    valueKey: { type: String, default: "id" },
    labelKey: { type: String, default: "name" },
    iconKey: { type: String, default: "icon" },
    limit: { type: Number, default: 999 },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      // 💡 Nếu limit >= 999 thì mặc định bật showAll luôn để khỏi cần nút "Xem thêm"
      showAll: this.limit >= 999,
    };
  },
  computed: {
    displayedItems() {
      if (!this.items || this.items.length === 0) return [];
      let list = [...this.items];

      return this.showAll ? list : list.slice(0, this.limit);
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal !== "" && newVal !== null && newVal !== undefined) {
          const index = this.items.findIndex(
            (item) => String(this.getItemValue(item)) === String(newVal),
          );
          if (index >= this.limit) {
            this.showAll = true;
          }
        }
      },
    },
  },

  methods: {
    getItemValue(item) {
      return item[this.valueKey] !== undefined ? item[this.valueKey] : item;
    },
    getItemLabel(item) {
      return item[this.labelKey] !== undefined ? item[this.labelKey] : item;
    },
    selectItem(val) {
      this.$emit("update:modelValue", val);
      this.$emit("change", val);
    },
  },
};
</script>

<style scoped>
/* Sử dụng Flexbox để cố định nhãn bên trái, phần danh sách pill bên phải tự động tràn và thẳng hàng */
.filter-row-container {
  display: flex;
  align-items: flex-start !important; /* Dùng !important để chống bị ghi đè từ bên ngoài */
  width: 100%;
  padding: 4px 0;
}

.filter-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 135px; /* Cố định độ rộng nhãn để tất cả các dòng thụt vào đều tăm tắp */
  flex-shrink: 0;
  align-self: flex-start !important; /* Ép riêng phần nhãn luôn nằm ở trên cùng, không bị căn giữa theo chiều dọc */
  padding-top: 8px; /* Căn chỉnh cho ngang hàng với dòng button đầu tiên */
}

.filter-pills-wrapper {
  display: flex;
  flex-wrap: wrap;
  flex-grow: 1;
  gap: 4px;
}

.filter-pill {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  border: none;
  transition: all 0.2s ease;
}

/* Thẻ chưa chọn */
.inactive-pill {
  background-color: #f1f5f9;
  color: #334155;
}

.inactive-pill:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

/* Thẻ đang được chọn */
.active-pill {
  background-color: #2563eb !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

/* Nút Xem thêm đồng bộ dạng pill */
.more-pill {
  background-color: #e2e8f0;
  color: #1d4ed8;
  font-weight: 600;
}
.more-pill:hover {
  background-color: #cbd5e1;
  color: #1e40af;
}
</style>
