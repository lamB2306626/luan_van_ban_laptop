<template>
  <div>
    <!-- 1. HÌNH THỨC CHỌN KHÁCH HÀNG -->
    <div class="form-group mb-3">
      <label class="fw-bold mb-2">Hình thức chọn khách hàng:</label>
      <div class="d-flex gap-4">
        <div class="form-check">
          <input
            class="form-check-input cursor-pointer"
            type="radio"
            :id="`typeGroup_${_uid}`"
            value="GROUP"
            v-model="type"
            @change="handleTypeChange"
          />
          <label
            class="form-check-label cursor-pointer fw-semibold"
            :for="`typeGroup_${_uid}`"
          >
            Theo Hạng Khách Hàng
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input cursor-pointer"
            type="radio"
            :id="`typeCustom_${_uid}`"
            value="CUSTOM"
            v-model="type"
            @change="handleTypeChange"
          />
          <label
            class="form-check-label cursor-pointer fw-semibold"
            :for="`typeCustom_${_uid}`"
          >
            Tùy chọn danh sách Khách Hàng
          </label>
        </div>
      </div>
    </div>

    <!-- 2. CHẾ ĐỘ 1: CHỌN THEO HẠNG -->
    <div v-if="type === 'GROUP'">
      <div class="form-group">
        <label class="fw-bold mb-1">
          Chọn Hạng Khách Hàng <span class="text-danger">*</span>:
        </label>

        <Field
          name="hang_khach_hang"
          v-model="selectedHangId"
          v-slot="{ errors }"
        >
          <BaseSearchSelect
            v-model="selectedHangId"
            :options="dsHangKhachHang"
            label-key="ten_hang"
            value-key="id"
            placeholder="Chọn hạng khách hàng..."
            :invalid="errors.length > 0"
            @change="onSelectHang"
          />
        </Field>
        <ErrorMessage name="hang_khach_hang" class="text-danger small" />
      </div>

      <div
        v-if="targetCustomerIds.length > 0"
        class="mt-2 text-success small fw-bold"
      >
        <i class="fas fa-check-circle me-1"></i>
        Đã tìm thấy {{ targetCustomerIds.length }} khách hàng thuộc hạng này.
      </div>
    </div>

    <!-- 3. CHẾ ĐỘ 2: CHỌN TÙY CHỌN -->
    <div v-if="type === 'CUSTOM'">
      <div class="form-group">
        <label class="fw-bold mb-1">
          Danh sách khách hàng nhận <span class="text-danger">*</span>:
        </label>

        <Field
          name="ds_khach_hang_id"
          v-model="selectedCustomerIds"
          v-slot="{ errors }"
        >
          <BaseMultiSearchSelect
            v-model="selectedCustomerIds"
            :options="dsKhachHangFormatted"
            label-key="ho_ten_email"
            value-key="id"
            placeholder="Nhập mã hoặc tên Khách Hàng để tìm..."
            :invalid="errors.length > 0"
            @update:modelValue="emitCustomerIds"
          />
        </Field>
        <ErrorMessage name="ds_khach_hang_id" class="text-danger small" />
      </div>
    </div>
  </div>
</template>

<script>
import { Field, ErrorMessage } from "vee-validate";
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";

import KhachHangService from "@/services/khach-hang.service";
import HangThanhVienService from "@/services/hang-thanh-vien.service";

export default {
  name: "CustomerSelector",
  components: {
    Field,
    ErrorMessage,
    BaseSearchSelect,
    BaseMultiSearchSelect,
  },
  emits: ["update:selectedIds"],
  data() {
    return {
      type: "GROUP",
      selectedHangId: "",
      selectedCustomerIds: [],
      targetCustomerIds: [],
      dsKhachHang: [],
      dsHangKhachHang: [],
    };
  },
  computed: {
    dsKhachHangFormatted() {
      return this.dsKhachHang.map((item) => ({
        ...item,
        ho_ten_email: `${item.ho_ten} (${item.email || item.id})`,
      }));
    },
  },
  async mounted() {
    await Promise.all([this.fetchKhachHang(), this.fetchHangThanhVien()]);
  },
  methods: {
    async fetchKhachHang() {
      try {
        this.dsKhachHang = await KhachHangService.getAll({});
      } catch (err) {
        console.error("Lỗi nạp danh sách khách hàng:", err);
      }
    },
    async fetchHangThanhVien() {
      try {
        const data = await HangThanhVienService.getAll({});
        this.dsHangKhachHang = [
          { id: "TAT_CA", ten_hang: "Tất cả khách hàng" },
          ...data,
        ];
      } catch (err) {
        console.error("Lỗi nạp danh sách hạng thành viên:", err);
      }
    },
    handleTypeChange() {
      this.selectedHangId = "";
      this.selectedCustomerIds = [];
      this.targetCustomerIds = [];
      this.emitCustomerIds();
    },
    onSelectHang(hangItem) {
      if (!hangItem) {
        this.targetCustomerIds = [];
      } else if (hangItem.id === "TAT_CA") {
        this.targetCustomerIds = this.dsKhachHang.map((k) => k.id);
      } else {
        this.targetCustomerIds = this.dsKhachHang
          .filter((k) => k.id_hang_thanh_vien === hangItem.id)
          .map((k) => k.id);
      }
      this.emitCustomerIds();
    },
    emitCustomerIds() {
      const finalIds =
        this.type === "GROUP"
          ? this.targetCustomerIds
          : this.selectedCustomerIds;
      this.$emit("update:selectedIds", {
        type: this.type,
        ids: finalIds,
      });
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>