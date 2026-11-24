<template>
  <Form @submit="submitBienThe" :validation-schema="bienTheFormSchema">
    <!-- Mã Biến Thể & Mã Sản Phẩm -->
    <!-- Kiểm tra hasRealIds để nếu là Form tạm trong trang thêm mới sản phẩm thì không cần hiện -->
    <div v-if="hasRealIds" class="row mb-3">
      <div class="col-md-6">
        <label class="form-label fw-semibold">Mã Biến Thể:</label>
        <input
          type="text"
          class="form-control bg-light"
          :value="bienTheLocal.id"
          disabled
        />
      </div>
      <div class="col-md-6">
        <label class="form-label fw-semibold">Mã Sản Phẩm:</label>
        <input
          type="text"
          class="form-control bg-light"
          :value="bienTheLocal.id_san_pham"
          disabled
        />
      </div>
    </div>

    <!-- Cấu hình Phần cứng: CPU & GPU -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id_cpu">CPU <span class="text-danger">*</span>:</label>
        <div class="input-group">
          <Field name="id_cpu" v-model="bienTheLocal.id_cpu">
            <BaseSearchSelect
              v-model="bienTheLocal.id_cpu"
              :options="dsCpu"
              label-key="ten_cpu"
              value-key="id"
              placeholder="Nhập tên hoặc mã CPU để tìm..."
              class="flex-grow-1"
            />
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm CPU mới"
            @click="openQuickCreate('cpu')"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <ErrorMessage name="id_cpu" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_gpu"
          >GPU / Card Đồ Họa <span class="text-danger">*</span>:</label
        >
        <div class="input-group">
          <Field name="id_gpu" v-model="bienTheLocal.id_gpu">
            <BaseSearchSelect
              v-model="bienTheLocal.id_gpu"
              :options="dsGpu"
              label-key="ten_gpu"
              value-key="id"
              placeholder="Nhập tên hoặc mã GPU để tìm..."
              class="flex-grow-1"
            />
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm GPU mới"
            @click="openQuickCreate('gpu')"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <ErrorMessage name="id_gpu" class="text-danger small" />
      </div>
    </div>

    <!-- Cấu hình Bộ nhớ: RAM & ROM -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id_ram">RAM <span class="text-danger">*</span>:</label>
        <div class="input-group">
          <Field name="id_ram" v-model="bienTheLocal.id_ram">
            <BaseSearchSelect
              v-model="bienTheLocal.id_ram"
              :options="dsRam"
              label-key="dung_luong_ram"
              value-key="id"
              placeholder="Nhập tên hoặc mã Dung Lượng Ram để tìm..."
              class="flex-grow-1"
            />
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm Dung Lượng Ram mới"
            @click="openQuickCreate('ram')"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <ErrorMessage name="id_ram" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_rom"
          >ROM / Ổ Cứng <span class="text-danger">*</span>:</label
        >
        <div class="input-group">
          <Field name="id_rom" v-model="bienTheLocal.id_rom">
            <BaseSearchSelect
              v-model="bienTheLocal.id_rom"
              :options="dsRom"
              label-key="dung_luong_rom"
              value-key="id"
              placeholder="Nhập tên hoặc mã Dung Lượng Rom để tìm..."
              class="flex-grow-1"
            />
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm Dung Lượng Rom mới"
            @click="openQuickCreate('rom')"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <ErrorMessage name="id_rom" class="text-danger small" />
      </div>
    </div>

    <!-- Màu sắc & Giá bán -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id_mau_sac"
          >Màu Sắc <span class="text-danger">*</span>:</label
        >
        <div class="input-group">
          <Field name="id_mau_sac" v-model="bienTheLocal.id_mau_sac">
            <BaseSearchSelect
              v-model="bienTheLocal.id_mau_sac"
              :options="dsMauSac"
              label-key="ten_mau_sac"
              value-key="id"
              placeholder="Nhập tên hoặc mã Màu Sắc để tìm..."
              class="flex-grow-1"
            />
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm Màu Sắc mới"
            @click="openQuickCreate('mau-sac')"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <ErrorMessage name="id_mau_sac" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="gia"
          >Giá Bán (VNĐ) <span class="text-danger">*</span>:</label
        >
        <Field
          name="gia"
          type="number"
          step="1000"
          class="form-control"
          v-model.number="bienTheLocal.gia"
          placeholder="VD: 15000000"
        />
        <ErrorMessage name="gia" class="text-danger small" />
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4 text-end">
      <button type="button" class="btn btn-secondary me-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
      <button class="btn btn-primary">
        <i class="fas fa-save me-1"></i> Lưu biến thể
      </button>
    </div>
  </Form>

  <!-- Đặt QuickCreateModal ở cuối Template -->
  <QuickCreateModal ref="quickCreateModal" @created="handleQuickCreated" />
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

// Import các Service tương ứng để nạp danh mục cho Dropdown
import CpuService from "@/services/cpu.service";
import GpuService from "@/services/gpu.service";
import RamService from "@/services/ram.service";
import RomService from "@/services/rom.service";
import MauSacService from "@/services/mau-sac.service";

// Import Modal Thêm Nhanh Dùng Chung
import QuickCreateModal from "@/components/Common/QuickCreateModal.vue";

// Import Modal Vừa tìm, vừa chọn Dùng Chung
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";

export default {
  name: "BienTheForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    QuickCreateModal,
    BaseSearchSelect,
  },
  props: {
    bienThe: {
      type: Object,
      default: () => ({
        id_mau_sac: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        gia: 0,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:bienThe", "cancel"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu (Không còn validate ảnh)
    const bienTheFormSchema = yup.object().shape({
      id_mau_sac: yup.string().required("Vui lòng chọn màu sắc."),
      id_cpu: yup.string().required("Vui lòng chọn CPU."),
      id_gpu: yup.string().required("Vui lòng chọn GPU."),
      id_ram: yup.string().required("Vui lòng chọn dung lượng RAM."),
      id_rom: yup.string().required("Vui lòng chọn dung lượng ROM."),
      gia: yup
        .number()
        .typeError("Giá phải là một chữ số.")
        .required("Giá bán không được để trống.")
        .min(0, "Giá bán không được nhỏ hơn 0."),
    });

    return {
      bienTheLocal: { ...this.bienThe },
      dsCpu: [],
      dsGpu: [],
      dsRam: [],
      dsRom: [],
      dsMauSac: [],
      bienTheFormSchema,
    };
  },
  computed: {
    // Computed kiểm tra mã biến thể có thật không
    hasRealIds() {
      const id = this.bienTheLocal?.id;

      // Nếu không có ID hoặc là mã tạm BT_TAM_ -> Ẩn
      if (!id || (typeof id === "string" && id.startsWith("BT_TAM_"))) {
        return false;
      }

      // Có ID thật từ DB -> Hiện
      return true;
    },
  },
  watch: {
    bienThe: {
      handler(newVal) {
        this.bienTheLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Nạp song song toàn bộ dữ liệu danh mục linh kiện cho các ô Chọn Dropdown
    async fetchDropdownData() {
      try {
        const [cpus, gpus, rams, roms, mauSacs] = await Promise.all([
          CpuService.getAll({}),
          GpuService.getAll({}),
          RamService.getAll({}),
          RomService.getAll({}),
          MauSacService.getAll({}),
        ]);
        this.dsCpu = cpus;
        this.dsGpu = gpus;
        this.dsRam = rams;
        this.dsRom = roms;
        this.dsMauSac = mauSacs;
      } catch (error) {
        console.error("Lỗi khi tải danh mục linh kiện cho Biến thể:", error);
      }
    },

    // Phát sự kiện submit kèm dữ liệu OBJECT THUẦN TÚY ra cho Component cha
    submitBienThe() {
      // Tìm object thông tin linh kiện tương ứng để BienTheTable có thông tin hiển thị tên
      const selectedCpu = this.dsCpu.find(
        (item) => item.id === this.bienTheLocal.id_cpu,
      );
      const selectedGpu = this.dsGpu.find(
        (item) => item.id === this.bienTheLocal.id_gpu,
      );
      const selectedRam = this.dsRam.find(
        (item) => item.id === this.bienTheLocal.id_ram,
      );
      const selectedRom = this.dsRom.find(
        (item) => item.id === this.bienTheLocal.id_rom,
      );
      const selectedMauSac = this.dsMauSac.find(
        (item) => item.id === this.bienTheLocal.id_mau_sac,
      );

      const payload = {
        ...this.bienTheLocal,
        gia: Number(this.bienTheLocal.gia || 0),
        id_mau_sac: this.bienTheLocal.id_mau_sac || "",
        id_cpu: this.bienTheLocal.id_cpu || "",
        id_gpu: this.bienTheLocal.id_gpu || "",
        id_dung_luong_ram:
          this.bienTheLocal.id_ram || this.bienTheLocal.id_dung_luong_ram || "",
        id_dung_luong_rom:
          this.bienTheLocal.id_rom || this.bienTheLocal.id_dung_luong_rom || "",

        // Đính kèm các object hiển thị cho BienTheTable
        cpu: selectedCpu || null,
        gpu: selectedGpu || null,
        dung_luong_ram: selectedRam || null,
        dung_luong_rom: selectedRom || null,
        mau_sac: selectedMauSac || null,
      };

      if (this.isEdit && this.bienTheLocal.id) {
        payload.id = this.bienTheLocal.id;
      }

      this.$emit("submit:bienThe", payload);
    },

    cancel() {
      this.$emit("cancel");
    },

    // Mở Modal Thêm Nhanh (truyền loại: 'mau-sac' | 'cpu' | 'gpu' | 'ram' | "rom")
    openQuickCreate(type) {
      if (this.$refs.quickCreateModal) {
        this.$refs.quickCreateModal.open(type);
      }
    },

    // Nhận kết quả từ QuickCreateModal -> Tải lại danh sách -> Chọn tự động mục vừa tạo
    async handleQuickCreated({ type, data }) {
      await this.fetchDropdownData(); // Cập nhật lại toàn bộ danh sách select

      const createdId = data?.data.id;
      if (!createdId) return;

      // Gán ID vừa tạo vào ô Select tương ứng
      if (type === "mau-sac") {
        this.bienTheLocal.id_mau_sac = createdId;
      } else if (type === "cpu") {
        this.bienTheLocal.id_cpu = createdId;
      } else if (type === "gpu") {
        this.bienTheLocal.id_gpu = createdId;
      } else if (type === "ram") {
        this.bienTheLocal.id_ram = createdId;
      } else if (type === "rom") {
        this.bienTheLocal.id_rom = createdId;
      }
    },
  },
  async mounted() {
    // 1. Lấy dsMauSac, dsCpu,.. thông qua fetchDropdownData
    await this.fetchDropdownData();

    // 2. Sau khi đã có dsMauSac, dsCpu,.. mới gán dữ liệu cho form Edit
    if (this.isEdit) {
      this.bienTheLocal = { ...this.bienThe };
    }
  },
};
</script>
