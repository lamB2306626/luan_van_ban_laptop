<template>
  <div class="card shadow-sm border-0 h-100">
    <div class="card-header bg-white fw-bold py-3 border-bottom">
      <i class="fas fa-history text-secondary me-2"></i>Lịch sử tư vấn
    </div>

    <div class="card-body p-2 session-list">
      <!-- Trường hợp chưa đăng nhập -->
      <div v-if="!currentUser" class="text-center p-3 text-muted small">
        <i class="fas fa-user-lock fa-2x mb-2 text-secondary"></i>
        <p class="mb-0">
          Bạn đang chat với tư cách khách vãng lai. Đăng nhập để lưu và xem lại
          lịch sử tư vấn nhé!
        </p>
      </div>

      <!-- Trường hợp đã đăng nhập nhưng chưa có lịch sử -->
      <div
        v-else-if="sessions.length === 0"
        class="text-center p-3 text-muted small"
      >
        Chưa có cuộc trò chuyện nào trước đây.
      </div>

      <!-- Danh sách các phiên chat cũ -->
      <div v-else class="list-group list-group-flush">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="list-group-item list-group-item-action border-0 rounded mb-1 d-flex justify-content-between align-items-center session-item"
          :class="{ active: activeSessionId === session.id }"
          @click="$emit('select-session', session.id)"
        >
          <div class="text-truncate pe-2" style="max-width: 180px">
            <div class="fw-semibold small text-truncate">
              {{ session.tieu_de || "Cuộc trò chuyện mới" }}
            </div>
            <small
              :class="
                activeSessionId === session.id ? 'text-white-50' : 'text-muted'
              "
              style="font-size: 0.72rem"
            >
              {{ formatDate(session.ngay_cap_nhat) }}
            </small>
          </div>

          <button
            class="btn btn-sm p-1 border-0"
            :class="
              activeSessionId === session.id ? 'text-white' : 'text-danger'
            "
            title="Xóa phiên chat"
            @click.stop="$emit('delete-session', session.id)"
          >
            <i class="fas fa-trash-alt small"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PhienChatList",
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
    sessions: {
      type: Array,
      default: () => [],
    },
    activeSessionId: {
      type: String,
      default: null,
    },
  },
  emits: ["select-session", "delete-session"],
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.session-list {
  max-height: 68vh;
  overflow-y: auto;
}

.session-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
</style>
