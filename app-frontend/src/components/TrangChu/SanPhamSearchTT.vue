<template>
  <div class="bg-white p-3">
    <!-- Thanh Tìm kiếm Tên & 2 Nút thao tác nằm ở trên cùng -->
    <div class="row mb-3 align-items-center">
      <div class="col col-8">
        <div class="input-group">
          <span class="input-group-text bg-light border-end-0 text-muted">
            <i class="fas fa-search"></i>
          </span>
          <input
            type="text"
            class="form-control bg-light border-start-0 ps-0 fs-6"
            placeholder="Nhập tên laptop, mã máy hoặc từ khóa..."
            :value="modelValue.name"
            @input="updateField('name', $event.target.value)"
            @keyup.enter="submit"
          />
        </div>
      </div>
      <div class="col col-2">
        <button
          class="btn btn-primary w-100 py-2 fw-bold shadow-sm"
          type="button"
          @click="submit"
        >
          <i class="fas fa-search me-1"></i> Tìm kiếm
        </button>
      </div>

      <div class="col col-2">
        <button
          class="btn btn-secondary w-100 py-2 fw-bold shadow-sm"
          type="button"
          @click="resetFilter"
        >
          Đặt Lại
        </button>
      </div>
    </div>

    <!-- TẦNG 1: CÁC BỘ LỌC CHIA 2 CỘT ĐỐI XỨNG HOÀN HẢO -->
    <div class="d-flex flex-column gap-2 mb-2">
      <!-- Hàng 1: Thương hiệu <-> Dung lượng RAM -->
      <div class="row g-3 mb-3 align-items-start">
        <div class="col-md-6">
          <FilterBadgeList
            label="THƯƠNG HIỆU"
            :items="danhSachThuongHieu"
            :model-value="modelValue.id_thuong_hieu"
            value-key="id"
            label-key="ten_thuong_hieu"
            img-key="logo"
            @update:model-value="(val) => updateField('id_thuong_hieu', val)"
          />
        </div>
        <div class="col-md-6">
          <FilterBadgeList
            label="DUNG LƯỢNG RAM"
            :items="danhSachRam"
            :model-value="modelValue.id_ram"
            value-key="id"
            label-key="dung_luong_ram"
            @update:model-value="(val) => updateField('id_ram', val)"
            :limit="8"
          />
        </div>
      </div>

      <!-- Hàng 2: Nhu cầu sử dụng <-> Ổ cứng (SSD) -->
      <div class="row g-3 mb-3 align-items-start">
        <div class="col-md-6">
          <FilterBadgeList
            label="NHU CẦU SỬ DỤNG"
            :items="danhSachDanhMuc"
            :model-value="modelValue.id_danh_muc"
            value-key="id"
            label-key="ten_danh_muc"
            icon-key="icon"
            @update:model-value="(val) => updateField('id_danh_muc', val)"
          />
        </div>
        <div class="col-md-6">
          <FilterBadgeList
            label="Ổ CỨNG (SSD)"
            :items="danhSachRom"
            :model-value="modelValue.id_rom"
            value-key="id"
            label-key="dung_luong_rom"
            @update:model-value="(val) => updateField('id_rom', val)"
            :limit="8"
          />
        </div>
      </div>

      <!-- Hàng 3: Khoảng giá <-> Màu sắc -->
      <div class="row g-3 align-items-start">
        <div class="col-md-6">
          <div class="filter-row-container">
            <span class="fw-bold text-secondary text-uppercase filter-label">
              KHOẢNG GIÁ:
            </span>
            <!-- Thêm class align-items-center để ép tất cả các ô input và text ngang hàng tuyệt đối -->
            <div
              class="input-group input-group-sm align-items-center"
              style="max-width: 340px"
            >
              <input
                type="number"
                class="form-control"
                placeholder="Giá từ (đ)"
                :value="modelValue.gia_tu"
                @input="updateField('gia_tu', $event.target.value)"
              />
              <span class="input-group-text bg-light text-muted px-2 py-1"
                >-</span
              >
              <input
                type="number"
                class="form-control"
                placeholder="Giá đến (đ)"
                :value="modelValue.gia_den"
                @input="updateField('gia_den', $event.target.value)"
              />
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <FilterBadgeList
            label="MÀU SẮC"
            :items="danhSachMauSac"
            :model-value="modelValue.id_mau_sac"
            value-key="id"
            label-key="ten_mau_sac"
            @update:model-value="(val) => updateField('id_mau_sac', val)"
            :limit="6"
          />
        </div>
      </div>
    </div>

    <hr class="my-3 text-muted opacity-25" />

    <!-- TẦNG 2: CÁC BỘ LỌC ĐỘC LẬP (Trải rộng 100% bề ngang) -->
    <div class="d-flex flex-column gap-2">
      <FilterBadgeList
        label="DÒNG CHIP (CPU)"
        :items="danhSachCpu"
        :model-value="modelValue.id_cpu"
        value-key="id"
        label-key="ten_cpu"
        @update:model-value="(val) => updateField('id_cpu', val)"
        :limit="8"
        class="mb-3"
      />

      <FilterBadgeList
        label="CARD ĐỒ HỌA (GPU)"
        :items="danhSachGpu"
        :model-value="modelValue.id_gpu"
        value-key="id"
        label-key="ten_gpu"
        @update:model-value="(val) => updateField('id_gpu', val)"
        :limit="8"
      />
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
import LichSuTimKiemService from "@/services/lich-su-tim-kiem.service";

import FilterBadgeList from "./FilterBadgeList.vue";

export default {
  name: "SanPhamSearchTT",
  components: {
    FilterBadgeList,
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
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
  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
  },
  methods: {
    // Cập nhật từng trường vào object cha khi thay đổi giá trị
    updateField(key, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [key]: value,
      });
    },

    // Phát sự kiện tìm kiếm và đồng thời lưu lịch sử tìm kiếm của khách hàng
    async submit() {
      this.$emit("submit");
    },

    // Reset lại bộ lọc về mặc định
    resetFilter() {
      const defaultFilter = {
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        id_mau_sac: "",
        gia_tu: "",
        gia_den: "",
      };
      this.$emit("update:modelValue", defaultFilter);
      // this.$emit("submit");
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

<style scoped>
/* Đồng bộ class để nhãn Khoảng Giá thẳng hàng hoàn hảo với các nhãn bên trên */
.filter-row-container {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.filter-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 135px; /* Cố định độ rộng để ép các input khoảng giá thẳng cột với các badge bên phải */
  flex-shrink: 0;
}
</style>
