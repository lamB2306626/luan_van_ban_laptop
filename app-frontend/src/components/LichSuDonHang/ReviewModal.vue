<template>
  <div class="modal fade" ref="reviewModalRef" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" v-if="showModal">
        <!-- HEADER -->
        <div class="modal-header">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-star text-warning me-2"></i>
            {{ isEdit ? "Chỉnh sửa đánh giá sản phẩm" : "Đánh giá sản phẩm" }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          <div class="d-flex align-items-center mb-3 p-2 bg-light rounded">
            <img
              :src="selectedItem?.duong_dan_anh"
              alt="Product"
              class="rounded me-3"
              style="width: 60px; height: 60px; object-fit: cover"
            />
            <div>
              <h6 class="mb-1 fw-bold text-dark">
                {{ selectedItem?.ten_san_pham }}
              </h6>
              <span
                class="badge text-secondary border bg-light px-2 py-0"
                style="font-size: 10px"
              >
                {{ selectedItem?.ten_bien_the }}
              </span>
            </div>
          </div>

          <!-- Chọn số sao -->
          <div class="text-center mb-3">
            <label class="form-label fw-bold d-block"
              >Chất lượng sản phẩm</label
            >
            <div class="fs-2 text-warning cursor-pointer">
              <i
                v-for="star in 5"
                :key="star"
                class="fa-star me-1"
                :class="
                  star <= form.so_sao
                    ? 'fas text-warning'
                    : 'far text-secondary'
                "
                @click="form.so_sao = star"
              ></i>
            </div>
            <span class="badge bg-warning text-dark mt-1">
              {{ textSoSao }}
            </span>
          </div>

          <!-- Nội dung đánh giá -->
          <div class="mb-3">
            <label for="noiDung" class="form-label fw-bold"
              >Nhận xét của bạn</label
            >
            <textarea
              id="noiDung"
              class="form-control"
              rows="4"
              v-model="form.noi_dung"
              placeholder="Hãy chia sẻ cảm nhận về sản phẩm..."
            ></textarea>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Hủy
          </button>
          <button
            type="button"
            class="btn btn-primary px-4 fw-bold"
            @click="submitReview"
          >
            {{ isEdit ? "Cập nhật đánh giá" : "Gửi đánh giá" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";

export default {
  name: "ReviewModal",
  data() {
    return {
      showModal: false,
      modalInstance: null,
      isEdit: false, // Phân biệt chế độ Thêm hay Sửa
      selectedItem: null,
      form: {
        id_danh_gia: null, // Dành riêng cho update
        so_sao: 5,
        noi_dung: "",
      },
    };
  },
  computed: {
    textSoSao() {
      const map = {
        1: "1 Sao - Rất tệ",
        2: "2 Sao - Không hài lòng",
        3: "3 Sao - Bình thường",
        4: "4 Sao - Hài lòng",
        5: "5 Sao - Tuyệt vời!",
      };
      return map[this.form.so_sao] || "Tuyệt vời!";
    },
  },
  methods: {
    // Mở modal ở chế độ THÊM MỚI
    openModal(item) {
      this.isEdit = false;
      this.selectedItem = { ...item };
      this.form = { id_danh_gia: null, so_sao: 5, noi_dung: "" };
      this.showModal = true;
      this.getModalInstance().show();
    },

    // Mở modal ở chế độ CHỈNH SỬA
    openEditModal(item, existingReview) {
      this.isEdit = true;
      this.selectedItem = { ...item };
      this.form = {
        id_danh_gia: existingReview.id,
        so_sao: existingReview.so_sao,
        noi_dung: existingReview.noi_dung,
      };
      this.showModal = true;
      this.getModalInstance().show();
    },

    closeModal() {
      this.showModal = false;
      this.getModalInstance().hide();
    },

    getModalInstance() {
      if (!this.modalInstance && this.$refs.reviewModalRef) {
        this.modalInstance = new Modal(this.$refs.reviewModalRef);
      }
      return this.modalInstance;
    },

    submitReview() {
      const payload = {
        id: this.form.id_danh_gia,
        id_san_pham: this.selectedItem.id_san_pham,
        id_khach_hang: this.selectedItem.id_khach_hang,
        id_chi_tiet_don_hang: this.selectedItem.id_chi_tiet_don_hang,
        so_sao: this.form.so_sao,
        noi_dung: this.form.noi_dung,
      };

      this.$emit("submit", payload, this.isEdit, () => {
        this.closeModal();
      });
    },
  },
};
</script>
