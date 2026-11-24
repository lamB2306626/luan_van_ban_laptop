<template>
  <form @submit.prevent="handleSubmit" class="address-selector">
    <!-- Họ và tên người nhận -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Họ và tên người nhận: <span class="text-danger">*</span></label
      >
      <input
        type="text"
        class="form-control"
        v-model="receiverName"
        @input="emitAddressData"
        placeholder="Ví dụ: Nguyễn Văn A"
        required
      />
    </div>

    <!-- Số điện thoại người nhận -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Số điện thoại nhận hàng: <span class="text-danger">*</span></label
      >
      <input
        type="tel"
        class="form-control"
        v-model="receiverPhone"
        @input="emitAddressData"
        placeholder="Ví dụ: 0912345678"
        required
      />
    </div>

    <!-- Dropdown Tỉnh / Thành -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Tỉnh / Thành phố: <span class="text-danger">*</span></label
      >
      <select
        class="form-select"
        v-model="selectedProvinceCode"
        @change="handleProvinceChange"
        required
      >
        <option value="">-- Chọn Tỉnh / Thành --</option>
        <option
          v-for="item in provinces"
          :key="item.ProvinceID"
          :value="item.ProvinceID"
        >
          {{ item.ProvinceName }}
        </option>
      </select>
    </div>

    <!-- Dropdown Quận / Huyện -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Quận / Huyện: <span class="text-danger">*</span></label
      >
      <select
        class="form-select"
        v-model="selectedDistrictCode"
        @change="handleDistrictChange"
        :disabled="!selectedProvinceCode"
        required
      >
        <option value="">-- Chọn Quận / Huyện --</option>
        <option
          v-for="item in districts"
          :key="item.DistrictID"
          :value="item.DistrictID"
        >
          {{ item.DistrictName }}
        </option>
      </select>
    </div>

    <!-- Dropdown Phường / Xã -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Phường / Xã: <span class="text-danger">*</span></label
      >
      <select
        class="form-select"
        v-model="selectedWardCode"
        @change="emitAddressData"
        :disabled="!selectedDistrictCode"
        required
      >
        <option value="">-- Chọn Phường / Xã --</option>
        <option
          v-for="item in wards"
          :key="item.WardCode"
          :value="item.WardCode"
        >
          {{ item.WardName }}
        </option>
      </select>
    </div>

    <!-- Ô nhập Địa chỉ chi tiết -->
    <div class="form-group mb-3">
      <label class="form-label fw-semibold"
        >Địa chỉ chi tiết (Số nhà, tên đường):
        <span class="text-danger">*</span></label
      >
      <input
        type="text"
        class="form-control"
        v-model="detailAddress"
        @input="emitAddressData"
        placeholder="Ví dụ: 123 Nguyễn Trãi"
        required
      />
    </div>

    <!-- Checkbox Mặc định -->
    <div class="form-check mb-4">
      <input
        class="form-check-input"
        type="checkbox"
        id="lamacdinhCheck"
        v-model="isDefault"
        @change="emitAddressData"
      />
      <label class="form-check-label" for="lamacdinhCheck">
        Đặt làm địa chỉ giao hàng mặc định
      </label>
    </div>

    <!-- Nút hành động Hủy & Lưu (Giống RamForm) -->
    <div class="d-flex gap-2 justify-content-end pt-2 border-top">
      <button
        type="button"
        class="btn btn-secondary px-3"
        @click="handleCancel"
      >
        <i class="bi bi-x-circle me-1"></i> Hủy
      </button>

      <button
        type="submit"
        class="btn btn-success fw-semibold px-3"
        :disabled="isLoading"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-1"
          role="status"
        ></span>
        <i v-else class="bi bi-check-circle me-1"></i>
        Lưu địa chỉ
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import ghnService from "@/services/ghn.service";

// Khai báo Props
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
});

// Khai báo Emits
const emit = defineEmits(["update:address", "submit:address", "cancel"]);

// Khai báo các reactive state
const receiverName = ref("");
const receiverPhone = ref("");

const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

const selectedProvinceCode = ref("");
const selectedDistrictCode = ref("");
const selectedWardCode = ref("");
const detailAddress = ref("");
const isDefault = ref(true);

// Trạng thái loading phụ cho dropdown
const loadingProvinces = ref(false);
const loadingDistricts = ref(false);
const loadingWards = ref(false);

// 1. Tải danh sách Tỉnh / Thành từ GHN khi Component mounted
onMounted(async () => {
  emitAddressData();
  try {
    loadingProvinces.value = true;
    const res = await ghnService.getProvinces();
    // GHN trả về mảng tỉnh/thành nằm trong response
    provinces.value = res.data || res || [];
  } catch (err) {
    console.error("Lỗi khi tải danh sách Tỉnh/Thành từ GHN:", err);
  } finally {
    loadingProvinces.value = false;
  }
});

// 2. Xử lý khi chọn Tỉnh / Thành -> Gọi API lấy Quận / Huyện từ GHN
const handleProvinceChange = async () => {
  selectedDistrictCode.value = "";
  selectedWardCode.value = "";
  districts.value = [];
  wards.value = [];

  if (!selectedProvinceCode.value) {
    emitAddressData();
    return;
  }

  try {
    loadingDistricts.value = true;
    const res = await ghnService.getDistricts(selectedProvinceCode.value);
    districts.value = res.data || res || [];
  } catch (err) {
    console.error("Lỗi khi tải danh sách Quận/Huyện từ GHN:", err);
  } finally {
    loadingDistricts.value = false;
  }

  emitAddressData();
};

// 3. Xử lý khi chọn Quận / Huyện -> Gọi API lấy Phường / Xã từ GHN
const handleDistrictChange = async () => {
  selectedWardCode.value = "";
  wards.value = [];

  if (!selectedDistrictCode.value) {
    emitAddressData();
    return;
  }

  try {
    loadingWards.value = true;
    const res = await ghnService.getWards(selectedDistrictCode.value);
    wards.value = res.data || res || [];
  } catch (err) {
    console.error("Lỗi khi tải danh sách Phường/Xã từ GHN:", err);
  } finally {
    loadingWards.value = false;
  }

  emitAddressData();
};

// 4. Xử lý khi chọn Phường / Xã
const handleWardChange = () => {
  emitAddressData();
};

// Đóng gói dữ liệu địa chỉ (Ánh xạ đúng tên trường dữ liệu của GHN)
const getAddressPayload = () => {
  // GHN dùng: ProvinceID, ProvinceName, DistrictID, DistrictName, WardCode, WardName
  const provinceObj = provinces.value.find(
    (p) => String(p.ProvinceID) === String(selectedProvinceCode.value),
  );
  const districtObj = districts.value.find(
    (d) => String(d.DistrictID) === String(selectedDistrictCode.value),
  );
  const wardObj = wards.value.find(
    (w) => String(w.WardCode) === String(selectedWardCode.value),
  );

  return {
    ten_nguoi_nhan: receiverName.value,
    sdt_nguoi_nhan: receiverPhone.value,
    province_id: selectedProvinceCode.value,
    ten_tinh: provinceObj ? provinceObj.ProvinceName : "",
    district_id: selectedDistrictCode.value,
    ten_huyen: districtObj ? districtObj.DistrictName : "",
    ward_code: selectedWardCode.value,
    ten_xa: wardObj ? wardObj.WardName : "",
    dia_chi_cu_the: detailAddress.value,
    la_mac_dinh: Boolean(isDefault.value),
  };
};

// Phát dữ liệu thay đổi ra ngoài (dùng cho v-model hoặc preview)
const emitAddressData = () => {
  emit("update:address", getAddressPayload());
};

// Xử lý khi bấm nút "Lưu địa chỉ"
const handleSubmit = () => {
  const payload = getAddressPayload();
  emit("submit:address", payload);
};

// Xử lý khi bấm nút "Hủy"
const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.address-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
select,
input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease-in-out;
}
select:focus,
input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}
.text-danger {
  color: #dc3545;
}
</style>
