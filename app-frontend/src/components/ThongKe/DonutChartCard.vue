<template>
  <div class="card shadow-sm h-100">
    <!-- Tiêu đề Card -->
    <div class="card-header bg-white py-3">
      <h6 class="mb-0 fw-bold" :class="titleClass">
        <i v-if="icon" :class="icon" class="me-2"></i>{{ title }}
      </h6>
    </div>

    <div class="card-body d-flex flex-column justify-content-center">
      <!-- Trạng thái rỗng -->
      <div v-if="!items.length" class="text-center text-muted py-5">
        <i class="fas fa-chart-pie fs-3 mb-2 opacity-50"></i>
        <p class="mb-0 small">{{ emptyText }}</p>
      </div>

      <!-- Bố cục 1: Chú thích nằm bên phải biểu đồ (Phù hợp thẻ rộng col-lg-7) -->
      <div
        v-else-if="legendPosition === 'right'"
        class="row align-items-center"
      >
        <div
          class="col-md-6"
          :style="{ position: 'relative', height: height + 'px' }"
        >
          <canvas ref="donutCanvas"></canvas>
        </div>
        <div class="col-md-6 mt-3 mt-md-0">
          <ul class="list-group list-group-flush small">
            <li
              v-for="(item, idx) in normalizedItems"
              :key="idx"
              class="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
            >
              <div class="text-truncate pe-2">
                <span
                  class="d-inline-block rounded-circle me-2"
                  style="width: 10px; height: 10px"
                  :style="{ backgroundColor: item.color }"
                ></span>
                <span class="fw-semibold">{{ item.label }}</span>
              </div>
              <div class="text-end text-nowrap">
                <span class="fw-bold">{{ item.value }}</span>
                <span v-if="item.subText" class="text-muted ms-1"
                  >({{ item.subText }})</span
                >
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bố cục 2: Chú thích nằm bên dưới biểu đồ (Phù hợp thẻ gọn col-lg-5 hoặc col-md-6) -->
      <div v-else>
        <div :style="{ position: 'relative', height: height + 'px' }">
          <canvas ref="donutCanvas"></canvas>
        </div>
        <div class="mt-3 pt-2 border-top">
          <div
            v-for="(item, idx) in normalizedItems"
            :key="idx"
            class="d-flex justify-content-between align-items-center small mb-2"
          >
            <span class="fw-semibold text-truncate pe-2">
              <span
                class="d-inline-block rounded-circle me-2"
                style="width: 10px; height: 10px"
                :style="{ backgroundColor: item.color }"
              ></span>
              {{ item.label }}
            </span>
            <span class="text-nowrap">
              <strong>{{ item.value }}</strong>
              <span v-if="item.subText" class="text-muted ms-1"
                >({{ item.subText }})</span
              >
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";

const DEFAULT_PALETTE = [
  "#0d6efd",
  "#198754",
  "#0dcaf0",
  "#ffc107",
  "#fd7e14",
  "#6f42c1",
  "#dc3545",
  "#6c757d",
];

export default {
  name: "DonutChartCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    titleClass: {
      type: String,
      default: "text-primary",
    },
    icon: {
      type: String,
      default: "fas fa-chart-pie",
    },
    items: {
      type: Array,
      default: () => [],
    },
    unitLabel: {
      type: String,
      default: "",
    },
    legendPosition: {
      type: String,
      default: "right",
    },
    height: {
      type: Number,
      default: 240,
    },
    emptyText: {
      type: String,
      default: "Không có dữ liệu hiển thị.",
    },
  },
  // Không khai báo chartInstance trong data() để tránh Vue 3 bọc Proxy
  computed: {
    normalizedItems() {
      return this.items.map((item, index) => ({
        ...item,
        color: item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      }));
    },
  },
  watch: {
    normalizedItems: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.renderChart();
        });
      },
    },
  },
  methods: {
    destroyChart() {
      if (this._chartInstance) {
        this._chartInstance.stop();
        this._chartInstance.destroy();
        this._chartInstance = null;
      }
    },

    renderChart() {
      const canvas = this.$refs.donutCanvas;
      if (!canvas) return;

      this.destroyChart();

      if (!this.normalizedItems.length) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const labels = this.normalizedItems.map((i) => i.label);
      const values = this.normalizedItems.map((i) => i.value);
      const colors = this.normalizedItems.map((i) => i.color);

      this._chartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          animation: {
            duration: 300,
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (ctxItem) => {
                  const item = this.normalizedItems[ctxItem.dataIndex];
                  const unit = this.unitLabel ? ` ${this.unitLabel}` : "";
                  const sub = item.subText ? ` (${item.subText})` : "";
                  return ` ${item.label}: ${item.value}${unit}${sub}`;
                },
              },
            },
          },
        },
      });
    },
  },
  mounted() {
    this.renderChart();
  },
  beforeUnmount() {
    this.destroyChart();
  },
};
</script>
