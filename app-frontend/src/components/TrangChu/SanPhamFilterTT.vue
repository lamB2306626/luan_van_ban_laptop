<template>
  <div class="mb-3">
    <!-- Hàng 1: THƯƠNG HIỆU -->
    <FilterBadgeList
      label="THƯƠNG HIỆU"
      :items="danhSachThuongHieu"
      :model-value="modelValue.id_thuong_hieu"
      value-key="id"
      label-key="ten_thuong_hieu"
      @update:model-value="(val) => updateField('id_thuong_hieu', val)"
      @change="submit"
    />

    <!-- Hàng 2: NHU CẦU / DANH MỤC -->
    <FilterBadgeList
      label="DANH MỤC"
      :items="danhSachDanhMuc"
      :model-value="modelValue.id_danh_muc"
      value-key="id"
      label-key="ten_danh_muc"
      icon-key="icon"
      @update:model-value="(val) => updateField('id_danh_muc', val)"
      @change="submit"
    />
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
  name: "SanPhamFilterTT",
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
      }),
    },
  },
  emits: ["submit", "update:modelValue"],
  data() {
    return {
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

    // Nạp dữ liệu các danh mục danh sách tùy chọn cho các dropdown
    async loadSelectData() {
      try {
        const [thuongHieu, danhMuc] = await Promise.all([
          ThuongHieuService.getAll().catch(() => []),
          DanhMucService.getAll().catch(() => []),
        ]);

        this.danhSachThuongHieu = thuongHieu;
        this.danhSachDanhMuc = danhMuc;
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
.filter-label {
  font-size: 12px;
  letter-spacing: 0.5px;
  min-width: 120px; /* Độ rộng cố định cho nhãn để các dòng căn thẳng hàng */
}
</style>
