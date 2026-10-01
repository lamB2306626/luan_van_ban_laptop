<template>
  <Form @submit="submitBienThe" :validation-schema="bienTheFormSchema">
    <!-- Mã Biến Thể & Mã Sản Phẩm (Chỉ hiển thị disabled khi Edit) -->
    <div v-if="isEdit" class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id">Mã Biến Thể:</label>
        <Field
          name="id"
          type="text"
          class="form-control"
          v-model="bienTheLocal.id"
          disabled
        />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_san_pham">Mã Sản Phẩm:</label>
        <Field
          name="id_san_pham"
          type="text"
          class="form-control"
          v-model="bienTheLocal.id_san_pham"
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
              placeholder="Nhập tên hoặc mã GPU để tìm..."
              class="flex-grow-1"
            >
              <!-- thêm class="flex-grow-1" cho giao diện trang cân bằng BaseSearchSelect và button bên dưới -->

              <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
              <!-- <template #option="{ item }">
                <span class="fw-bold text-secondary">[{{ item.id }}]</span>
                {{ item.ten_cpu }}
              </template> -->
            </BaseSearchSelect>
          </Field>
          <button
            type="button"
            class="btn btn-outline-success"
            title="Thêm Màu Sắc mới"
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
            >
              <!-- thêm class="flex-grow-1" cho giao diện trang cân bằng BaseSearchSelect và button bên dưới -->

              <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
              <!-- <template #option="{ item }">
                <span class="fw-bold text-secondary">[{{ item.id }}]</span>
                {{ item.ten_gpu }}
              </template> -->
            </BaseSearchSelect>
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
            >
              <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
              <!-- <template #option="{ item }">
                <span class="fw-bold text-secondary">[{{ item.id }}]</span>
                {{ item.dung_luong_ram }}
              </template> -->
            </BaseSearchSelect>
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
            >
              <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
              <!-- <template #option="{ item }">
                <span class="fw-bold text-secondary">[{{ item.id }}]</span>
                {{ item.dung_luong_rom }}
              </template> -->
            </BaseSearchSelect>
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

    <!-- Màu sắc & Đường dẫn ảnh -->
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
            >
              <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN
              <template #option="{ item }">
                <span class="fw-bold text-secondary">[{{ item.id }}]</span>
                {{ item.ten_mau_sac }}
              </template> -->
            </BaseSearchSelect>
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

      <!-- Upload Logo / Hình ảnh -->
      <div class="col-md-6 form-group mb-3">
        <label for="duong_dan_anh"
          >Ảnh biến thể <span class="text-danger">*</span>:</label
        >
        <Field name="duong_dan_anh" v-slot="{ field, errors }">
          <input
            type="file"
            id="duong_dan_anh"
            class="form-control"
            accept="image/*"
            @change="handleFileChange"
          />
        </Field>

        <ErrorMessage name="duong_dan_anh" class="text-danger small" />

        <!-- Khung xem trước (Preview) ảnh -->
        <div v-if="previewImage" class="mt-2 text-center">
          <img
            :src="previewImage"
            alt="Preview Image"
            class="img-thumbnail"
            style="max-height: 120px; object-fit: contain"
          />
        </div>
      </div>
    </div>

    <!-- Giá bán lẻ & Số lượng tồn kho -->
    <div class="row">
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

    <!-- Trạng thái kinh doanh -->
    <!-- <div class="form-group mb-3 form-check">
      <input
        type="checkbox"
        class="form-check-input"
        id="trang_thai"
        v-model="bienTheLocal.trang_thai"
      />
      <label class="form-check-label" for="trang_thai">Cho phép kinh doanh biến thể này</label>
    </div> -->

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

const API_URL = import.meta.env.VITE_API_BASE_URL;

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
        // so_luong: 0,
        duong_dan_anh: "",
        // trang_thai: true,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:bienThe", "cancel"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu theo Prisma Model
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
      duong_dan_anh: yup
        .mixed()
        .test("check-image", "Vui lòng chọn ảnh cho biến thể.", () => {
          // Nếu đang Sửa (isEdit) thì không bắt buộc chọn file mới (vì đã có ảnh cũ)
          if (this.isEdit) return true;
          // Nếu là Thêm mới thì bắt buộc phải chọn file
          return !!this.selectedFile;
        }),
    });

    return {
      bienTheLocal: { ...this.bienThe },
      dsCpu: [],
      dsGpu: [],
      dsRam: [],
      dsRom: [],
      dsMauSac: [],
      bienTheFormSchema,
      selectedFile: null, // File hình ảnh được chọn từ máy
      previewImage: this.bienThe?.duong_dan_anh
        ? `${API_URL}/uploads/BienThe/${this.bienThe.duong_dan_anh}`
        : null, // Ảnh hiển thị preview
    };
  },
  watch: {
    bienThe: {
      handler(newVal) {
        this.bienTheLocal = { ...newVal };
        if (newVal?.duong_dan_anh && !this.selectedFile) {
          this.previewImage = `${API_URL}/uploads/BienThe/${newVal.duong_dan_anh}`; //previewImage sẽ tự cập nhật
        }
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

    // Xử lý khi chọn file từ máy tính
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        // Tạo URL xem trước ảnh bằng FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    // Phát sự kiện submit kèm dữ liệu FormData ra cho Component cha
    submitBienThe() {
      const formData = new FormData();
      formData.append("id_mau_sac", this.bienTheLocal.id_mau_sac || "");
      formData.append("id_cpu", this.bienTheLocal.id_cpu || "");
      formData.append("id_gpu", this.bienTheLocal.id_gpu || "");
      formData.append("id_ram", this.bienTheLocal.id_ram || "");
      formData.append("id_rom", this.bienTheLocal.id_rom || "");
      formData.append("gia", this.bienTheLocal.gia || "");
      // formData.append("so_luong", this.bienTheLocal.so_luong);
      // formData.append("trang_thai", this.bienTheLocal.trang_thai || "");

      // CHỈ append file được chọn từ máy tính
      if (this.selectedFile) {
        formData.append("image", this.selectedFile);
      }

      if (this.isEdit && this.bienTheLocal.id) {
        formData.append("id", this.bienTheLocal.id);
      }

      this.$emit("submit:bienThe", formData);
    },

    cancel() {
      this.$emit("cancel");
    },
    // Mở Modal Thêm Nhanh (truyền loại: 'mau-sac' | 'cpu' | 'gpu | 'ram' | "rom"')
    openQuickCreate(type) {
      if (this.$refs.quickCreateModal) {
        this.$refs.quickCreateModal.open(type);
      }
    },

    // Nhận kết quả từ QuickCreateModal -> Tải lại danh sách -> Chọn tự động mục vừa tạo
    async handleQuickCreated({ type, data }) {
      await this.fetchDropdownData(); // Cập nhật lại toàn bộ danh sách select

      const createdId = data?.id || data?._id;
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
