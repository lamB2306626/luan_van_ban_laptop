<template>
  <div
    class="modal fade"
    id="quickCreateModal"
    tabindex="-1"
    ref="quickCreateModal"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- Header linh hoạt theo cấu hình -->
        <div class="modal-header">
          <h5 class="modal-title">
            <i :class="modalConfig.icon" class="me-2"></i>
            {{ modalConfig.title }}
          </h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <!-- Body: Render Form tương ứng dựa vào configType -->
        <div class="modal-body">
          <!-- Form Màu Sắc -->
          <MauSacForm
            v-if="isOpen && configType === 'mau-sac'"
            @submit:mauSac="handleSave"
            @cancel="close"
          />

          <!-- Form CPU -->
          <CpuForm
            v-if="isOpen && configType === 'cpu'"
            @submit:cpu="handleSave"
            @cancel="close"
          />

          <!-- Form GPU -->
          <GpuForm
            v-if="isOpen && configType === 'gpu'"
            @submit:gpu="handleSave"
            @cancel="close"
          />

          <!-- Form RAM -->
          <RamForm
            v-if="isOpen && configType === 'ram'"
            @submit:ram="handleSave"
            @cancel="close"
          />

          <!-- Form RAM -->
          <RomForm
            v-if="isOpen && configType === 'rom'"
            @submit:rom="handleSave"
            @cancel="close"
          />

          <!-- Form Thương Hiệu -->
          <ThuongHieuForm
            v-if="isOpen && configType === 'thuong-hieu'"
            @submit:thuongHieu="handleSave"
            @cancel="close"
          />

          <!-- Form Danh Mục -->
          <DanhMucForm
            v-if="isOpen && configType === 'danh-muc'"
            @submit:danhMuc="handleSave"
            @cancel="close"
          />

          <!-- Form Nhà Cung Cấp -->
          <NhaCungCapForm
            v-if="isOpen && configType === 'nha-cung-cap'"
            @submit:nhaCungCap="handleSave"
            @cancel="close"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";

// Import các Form con
import MauSacForm from "@/components/MauSac/MauSacForm.vue";
import CpuForm from "@/components/Cpu/CpuForm.vue";
import GpuForm from "@/components/Gpu/GpuForm.vue";
import RamForm from "@/components/Ram/RamForm.vue";
import RomForm from "@/components/Rom/RomForm.vue";
import ThuongHieuForm from "@/components/ThuongHieu/ThuongHieuForm.vue";
import DanhMucForm from "@/components/DanhMuc/DanhMucForm.vue";
import NhaCungCapForm from "@/components/NhaCungCap/NhaCungCapForm.vue";

// Import các Service xử lý API
import MauSacService from "@/services/mau-sac.service";
import CpuService from "@/services/cpu.service";
import GpuService from "@/services/gpu.service";
import RamService from "@/services/ram.service";
import RomService from "@/services/rom.service";
import ThuongHieuService from "@/services/thuong-hieu.service";
import DanhMucService from "@/services/danh-muc.service";
import NhaCungCapService from "@/services/nha-cung-cap.service";

export default {
  name: "QuickCreateModal",
  components: {
    MauSacForm,
    CpuForm,
    GpuForm,
    RamForm,
    RomForm,
    ThuongHieuForm,
    DanhMucForm,
    NhaCungCapForm,
  },
  emits: ["created"],
  data() {
    return {
      configType: "", // 'thuong-hieu' | 'danh-muc' | 'nha-cung-cap'
      isOpen: false,
      modalInstance: null,
    };
  },
  computed: {
    // Tự động điều chỉnh Tiêu đề và Icon hiển thị trên Modal
    modalConfig() {
      switch (this.configType) {
        case "mau-sac":
          return {
            title: "Thêm Màu Sắc Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "cpu":
          return {
            title: "Thêm CPU Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "gpu":
          return {
            title: "Thêm GPU Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "ram":
          return {
            title: "Thêm RAM Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "rom":
          return {
            title: "Thêm ROM Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "thuong-hieu":
          return {
            title: "Thêm Thương Hiệu Mới",
            icon: "fas fa-copyright text-primary",
          };
        case "danh-muc":
          return {
            title: "Thêm Danh Mục Mới",
            icon: "fas fa-folder-plus text-warning",
          };
        case "nha-cung-cap":
          return {
            title: "Thêm Nhà Cung Cấp Mới",
            icon: "fas fa-truck text-success",
          };
        default:
          return {
            title: "Thêm Mới",
            icon: "fas fa-plus",
          };
      }
    },
  },
  methods: {
    // Khởi tạo instance Bootstrap Modal
    getModalInstance() {
      if (!this.modalInstance && this.$refs.quickCreateModal) {
        this.modalInstance = new Modal(this.$refs.quickCreateModal);
      }
      return this.modalInstance;
    },

    // Hàm public được gọi từ Component cha (SanPhamForm)
    // Ví dụ: this.$refs.quickCreateModal.open('thuong-hieu')
    open(type) {
      this.configType = type;
      this.isOpen = true;
      this.getModalInstance().show();
    },

    // Đóng Modal
    close() {
      this.isOpen = false;
      this.getModalInstance().hide();
    },

    // Xử lý gọi API chung cho cả 3 loại dựa vào configType
    async handleSave(formData) {
      try {
        let createdData = null;
        if (this.configType === "mau-sac") {
          createdData = await MauSacService.create(formData);
        } else if (this.configType === "cpu") {
          createdData = await CpuService.create(formData);
        } else if (this.configType === "gpu") {
          createdData = await GpuService.create(formData);
        } else if (this.configType === "ram") {
          createdData = await RamService.create(formData);
        } else if (this.configType === "rom") {
          createdData = await RomService.create(formData);
        } else if (this.configType === "thuong-hieu") {
          createdData = await ThuongHieuService.create(formData);
        } else if (this.configType === "danh-muc") {
          createdData = await DanhMucService.create(formData);
          console.log("KẾT QUẢ API TRẢ VỀ:", createdData)
        } else if (this.configType === "nha-cung-cap") {
          createdData = await NhaCungCapService.create(formData);
        }

        // Bắn sự kiện kèm loại thực thể và dữ liệu mới tạo ra ngoài cho SanPhamForm
        this.$emit("created", {
          type: this.configType,
          data: createdData,
        });

        this.close();
      } catch (error) {
        console.error(`Lỗi khi tạo mới ${this.configType}:`, error);
        alert(
          error.response?.data?.message ||
            "Không thể tạo mới. Vui lòng kiểm tra lại dữ liệu!",
        );
      }
    },
  },
};
</script>
