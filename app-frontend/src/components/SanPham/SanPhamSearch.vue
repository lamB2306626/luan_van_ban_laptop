<template>
  <div class="card card-body bg-light mb-3">
    <!-- Hàng 1: Tìm kiếm cơ bản (Mã SP, Tên SP, Trạng thái) -->
    <div class="row g-2 mb-2 align-items-end">
      <!-- Ô nhập Mã Sản Phẩm -->
      <div class="col-md-3">
        <label class="form-label small fw-bold">Mã sản phẩm:</label>
        <input
          type="text"
          class="form-control"
          placeholder="Nhập mã SP..."
          :value="modelValue.id"
          @input="updateField('id', $event.target.value)"
          @keyup.enter="submit"
        />
      </div>

      <!-- Ô nhập Tên Sản Phẩm -->
      <div class="col-md-6">
        <label class="form-label small fw-bold">Tên sản phẩm:</label>
        <input
          type="text"
          class="form-control"
          placeholder="Nhập tên sản phẩm cần tìm..."
          :value="modelValue.name"
          @input="updateField('name', $event.target.value)"
          @keyup.enter="submit"
        />
      </div>

      <!-- Lọc Trạng Thái -->
      <div class="col-md-3">
        <label class="form-label small fw-bold">Trạng thái:</label>
        <select
          class="form-control form-select"
          :value="modelValue.trang_thai"
          @change="updateField('trang_thai', $event.target.value)"
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="true">Đang kinh doanh</option>
          <option value="false">Ngừng kinh doanh</option>
        </select>
      </div>
    </div>

    <!-- Hàng 2: Lọc Khóa Ngoại (Thương Hiệu, Danh Mục, Nhà Cung Cấp) -->
    <div class="row g-2 mb-2">
      <div class="col-md-3">
        <label class="form-label small fw-bold">Thương hiệu:</label>
        <select
          class="form-control form-select"
          :value="modelValue.id_thuong_hieu"
          @change="updateField('id_thuong_hieu', $event.target.value)"
        >
          <option value="">-- Chọn Thương Hiệu --</option>
          <option
            v-for="item in danhSachThuongHieu"
            :key="item.id"
            :value="item.id"
          >
            {{ item.ten_thuong_hieu }}
          </option>
        </select>
      </div>

      <div class="col-md-3">
        <label class="form-label small fw-bold">Danh mục:</label>
        <select
          class="form-control form-select"
          :value="modelValue.id_danh_muc"
          @change="updateField('id_danh_muc', $event.target.value)"
        >
          <option value="">-- Chọn Danh Mục --</option>
          <option
            v-for="item in danhSachDanhMuc"
            :key="item.id"
            :value="item.id"
          >
            {{ item.ten_danh_muc }}
          </option>
        </select>
      </div>

      <div class="col-md-3">
        <label class="form-label small fw-bold">Nhà cung cấp:</label>
        <select
          class="form-control form-select"
          :value="modelValue.id_nha_cc"
          @change="updateField('id_nha_cc', $event.target.value)"
        >
          <option value="">-- Chọn Nhà Cung Cấp --</option>
          <option
            v-for="item in danhSachNhaCungCap"
            :key="item.id"
            :value="item.id"
          >
            {{ item.ten_ncc }}
          </option>
        </select>
      </div>

      <div class="col-md-3">
        <button
          class="btn btn-outline-secondary me-2"
          type="button"
          @click="resetFilter"
        >
          <i class="fas fa-undo"></i> Đặt lại
        </button>
        <button class="btn btn-primary" type="button" @click="submit">
          <i class="fas fa-search"></i> Tìm kiếm
        </button>
      </div>
    </div>

    <!-- Nút bật/tắt bộ lọc nâng cao (Cấu hình & Khoảng giá) -->
    <div class="d-flex justify-content-between align-items-center mt-2">
      <button
        type="button"
        class="btn btn-link p-0 text-decoration-none small"
        @click="showAdvanced = !showAdvanced"
      >
        <i
          :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        ></i>
        {{
          showAdvanced
            ? "Ẩn bộ lọc cấu hình & giá"
            : "Mở rộng lọc cấu hình & giá"
        }}
      </button>
    </div>

    <!-- Hàng 3: Bộ lọc cấu hình biến thể & giá (Hiển thị khi mở rộng) -->
    <div v-if="showAdvanced" class="row g-2 mt-2 pt-2 border-top">
      <div class="col-md-2">
        <label class="form-label small">CPU:</label>
        <select
          class="form-control form-select form-select-sm"
          :value="modelValue.id_cpu"
          @change="updateField('id_cpu', $event.target.value)"
        >
          <option value="">Tất cả CPU</option>
          <option v-for="item in danhSachCpu" :key="item.id" :value="item.id">
            {{ item.ten_cpu }}
          </option>
        </select>
      </div>

      <div class="col-md-2">
        <label class="form-label small">GPU:</label>
        <select
          class="form-control form-select form-select-sm"
          :value="modelValue.id_gpu"
          @change="updateField('id_gpu', $event.target.value)"
        >
          <option value="">Tất cả GPU</option>
          <option v-for="item in danhSachGpu" :key="item.id" :value="item.id">
            {{ item.ten_gpu }}
          </option>
        </select>
      </div>

      <div class="col-md-2">
        <label class="form-label small">RAM:</label>
        <select
          class="form-control form-select form-select-sm"
          :value="modelValue.id_ram"
          @change="updateField('id_ram', $event.target.value)"
        >
          <option value="">Tất cả RAM</option>
          <option v-for="item in danhSachRam" :key="item.id" :value="item.id">
            {{ item.dung_luong_ram }}
          </option>
        </select>
      </div>

      <div class="col-md-2">
        <label class="form-label small">ROM (Ổ cứng):</label>
        <select
          class="form-control form-select form-select-sm"
          :value="modelValue.id_rom"
          @change="updateField('id_rom', $event.target.value)"
        >
          <option value="">Tất cả ROM</option>
          <option v-for="item in danhSachRom" :key="item.id" :value="item.id">
            {{ item.dung_luong_rom }}
          </option>
        </select>
      </div>

      <div class="col-md-2">
        <label class="form-label small">Màu sắc:</label>
        <select
          class="form-control form-select form-select-sm"
          :value="modelValue.id_mau_sac"
          @change="updateField('id_mau_sac', $event.target.value)"
        >
          <option value="">Tất cả Màu</option>
          <option
            v-for="item in danhSachMauSac"
            :key="item.id"
            :value="item.id"
          >
            {{ item.ten_mau_sac }}
          </option>
        </select>
      </div>

      <!-- Khoảng Giá -->
      <div class="col-md-2">
        <label class="form-label small">Giá từ - đến:</label>
        <div class="input-group input-group-sm">
          <input
            type="number"
            class="form-control"
            placeholder="Từ"
            :value="modelValue.gia_tu"
            @input="updateField('gia_tu', $event.target.value)"
          />
          <input
            type="number"
            class="form-control"
            placeholder="Đến"
            :value="modelValue.gia_den"
            @input="updateField('gia_den', $event.target.value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ThuongHieuService from "@/services/thuong-hieu.service";
import DanhMucService from "@/services/danh-muc.service";
import NhaCungCapService from "@/services/nha-cung-cap.service";
import CpuService from "@/services/cpu.service";
import GpuService from "@/services/gpu.service";
import RamService from "@/services/ram.service";
import RomService from "@/services/rom.service";
import MauSacService from "@/services/mau-sac.service";

export default {
  name: "SanPhamSearch",
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        id: "",
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        trang_thai: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        id_mau_sac: "",
        gia_tu: "",
        gia_den: "",
      }),
    },
  },
  emits: ["submit", "update:modelValue"],
  data() {
    return {
      showAdvanced: false,
      danhSachThuongHieu: [],
      danhSachDanhMuc: [],
      danhSachNhaCungCap: [],
      danhSachCpu: [],
      danhSachGpu: [],
      danhSachRam: [],
      danhSachRom: [],
      danhSachMauSac: [],
    };
  },
  methods: {
    // Cập nhật từng trường vào object cha khi thay đổi giá trị
    updateField(key, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [key]: value,
      });
    },

    // Phát sự kiện tìm kiếm
    submit() {
      this.$emit("submit");
    },

    // Reset lại bộ lọc về mặc định
    resetFilter() {
      const defaultFilter = {
        id: "",
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        trang_thai: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        id_mau_sac: "",
        gia_tu: "",
        gia_den: "",
      };
      this.$emit("update:modelValue", defaultFilter);
      this.$emit("submit");
    },

    // Nạp dữ liệu các danh mục danh sách tùy chọn cho các dropdown
    async loadSelectData() {
      try {
        const [thuongHieu, danhMuc, nhaCungCap, cpu, gpu, ram, rom, mauSac] =
          await Promise.all([
            ThuongHieuService.getAll().catch(() => []),
            DanhMucService.getAll().catch(() => []),
            NhaCungCapService.getAll().catch(() => []),
            CpuService.getAll().catch(() => []),
            GpuService.getAll().catch(() => []),
            RamService.getAll().catch(() => []),
            RomService.getAll().catch(() => []),
            MauSacService.getAll().catch(() => []),
          ]);

        this.danhSachThuongHieu = thuongHieu;
        this.danhSachDanhMuc = danhMuc;
        this.danhSachNhaCungCap = nhaCungCap;
        this.danhSachCpu = cpu;
        this.danhSachGpu = gpu;
        this.danhSachRam = ram;
        this.danhSachRom = rom;
        this.danhSachMauSac = mauSac;
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bổ trợ cho bộ lọc:", error);
      }
    },
  },
  created() {
    this.loadSelectData();
  },
};
</script>
