<template>
  <div class="card shadow-sm h-100">
    <!-- Header của Card -->
    <div
      class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center py-3"
    >
      <div>
        <h6 class="mb-0 fw-bold" :class="titleClass">
          <i v-if="icon" :class="icon" class="me-2"></i>{{ title }}
        </h6>
        <small v-if="subtitle" class="text-muted">{{ subtitle }}</small>
      </div>

      <!-- Slot để nhúng các nút chuyển đổi (VD: Theo ngày/tháng/năm hoặc Top 5/Top 10) -->
      <div v-if="$slots['header-actions']" class="mt-2 mt-sm-0">
        <slot name="header-actions"></slot>
      </div>
    </div>

    <div class="card-body d-flex flex-column justify-content-center">
      <!-- Trạng thái rỗng -->
      <div v-if="!labels.length" class="text-center text-muted py-5">
        <i class="fas fa-folder-open fs-2 mb-2 opacity-50"></i>
        <p class="mb-0 small">{{ emptyText }}</p>
      </div>

      <!-- Vùng vẽ Canvas Chart.js -->
      <div
        v-show="labels.length > 0"
        :style="{ position: 'relative', height: height + 'px', width: '100%' }"
      >
        <canvas ref="barLineCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";

export default {
  name: "BarLineChartCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    titleClass: {
      type: String,
      default: "text-primary",
    },
    icon: {
      type: String,
      default: "fas fa-chart-bar",
    },
    labels: {
      type: Array,
      default: () => [],
    },
    datasets: {
      type: Array,
      default: () => [],
    },
    indexAxis: {
      type: String,
      default: "y",
    },
    valueFormat: {
      type: String,
      default: "currency",
    },
    unitLabel: {
      type: String,
      default: "",
    },
    height: {
      type: Number,
      default: 360,
    },
    emptyText: {
      type: String,
      default: "Không có dữ liệu hiển thị trong khoảng thời gian này.",
    },
  },
  // LƯU Ý QUAN TRỌNG: Không để chartInstance trong data() để tránh Vue 3 bọc Proxy!
  computed: {
    // Gom labels và datasets thành 1 computed duy nhất để watcher chỉ kích hoạt 1 lần
    chartPayload() {
      return {
        labels: this.labels,
        datasets: this.datasets,
      };
    },
  },
  watch: {
    chartPayload: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.renderChart();
        });
      },
    },
  },
  methods: {
    formatValue(val) {
      if (this.valueFormat === "currency") {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val || 0);
      }
      const formattedNum = new Intl.NumberFormat("vi-VN").format(val || 0);
      return this.unitLabel
        ? `${formattedNum} ${this.unitLabel}`
        : formattedNum;
    },

    formatAxisTick(value) {
      if (this.valueFormat === "currency") {
        if (Math.abs(value) >= 1000000000) return `${value / 1000000000} Tỷ`;
        if (Math.abs(value) >= 1000000) return `${value / 1000000} Tr`;
        if (Math.abs(value) >= 1000) return `${value / 1000} K`;
      }
      return value;
    },

    destroyChart() {
      if (this._chartInstance) {
        this._chartInstance.stop(); // Dừng mọi animation đang chạy trước khi hủy
        this._chartInstance.destroy();
        this._chartInstance = null;
      }
    },

    renderChart() {
      const canvas = this.$refs.barLineCanvas;
      if (!canvas) return;

      // Luôn hủy instance cũ an toàn trước khi vẽ
      this.destroyChart();

      if (!this.labels.length || !this.datasets.length) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isHorizontal = this.indexAxis === "x";
      const valueAxisKey = isHorizontal ? "x" : "y";

      // Clone dữ liệu thuần (bỏ Proxy của Vue) trước khi đưa vào Chart.js
      const plainLabels = [...this.labels];
      const plainDatasets = this.datasets.map((ds) => ({
        ...ds,
        data: [...ds.data],
      }));

      // Lưu vào biến thường this._chartInstance (không reactive)
      this._chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: plainLabels,
          datasets: plainDatasets,
        },
        options: {
          indexAxis: isHorizontal ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 300,
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              display: plainDatasets.length > 1,
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || "";
                  const rawVal = isHorizontal
                    ? context.parsed.x
                    : context.parsed.y;
                  return `${label}: ${this.formatValue(rawVal)}`;
                },
              },
            },
          },
          scales: {
            [valueAxisKey]: {
              beginAtZero: true,
              ticks: {
                callback: (value) => this.formatAxisTick(value),
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
