<template>
  <div
    v-if="show"
    class="toast-container position-fixed top-0 end-0 p-3"
    style="z-index: 9999"
  >
    <div
      class="toast show shadow-lg border-0"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header bg-primary text-white">
        <i class="fas fa-headset me-2"></i>
        <strong class="me-auto">{{ title }}</strong>
        <small class="text-white-50">Vừa xong</small>
        <button
          type="button"
          class="btn-close btn-close-white"
          @click="$emit('close')"
        ></button>
      </div>
      <div
        class="toast-body bg-light cursor-pointer"
        @click="$emit('click-body')"
      >
        <p class="mb-1 text-dark fw-medium">
          {{ message }}
        </p>
        <small class="text-primary fw-bold"
          >Bấm vào đây để phản hồi &rarr;</small
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotificationToast",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Thông báo",
    },
    message: {
      type: String,
      default: "",
    },
  },
  emits: ["close", "click-body"],
};
</script>
