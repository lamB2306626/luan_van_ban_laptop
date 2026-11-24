<template>
  <div
    class="payment-return-container"
    style="text-align: center; padding: 50px"
  >
    <div v-if="loading">
      <h3>Đang xử lý kết quả giao dịch...</h3>
    </div>
    <div v-else>
      <div v-if="isSuccess" class="success-box">
        <h2 style="color: green">Thanh toán thành công!</h2>
        <p>
          Mã đơn hàng: <strong>{{ orderId }}</strong>
        </p>
        <p>
          Mã giao dịch VNPAY: <strong>{{ transactionNo }}</strong>
        </p>
        <p>
          Số tiền: <strong>{{ (amount / 100).toLocaleString() }} VNĐ</strong>
        </p>
        <p style="color: gray; font-style: italic">{{ message }}</p>
      </div>
      <div v-else class="error-box">
        <h2 style="color: red">Thanh toán thất bại hoặc đã bị hủy!</h2>
        <p>Mã lỗi VNPAY: {{ responseCode }}</p>
        <p style="color: red">{{ message }}</p>
      </div>

      <br />
      <router-link to="trang-chu" class="btn-home"
        >Quay về trang chủ</router-link
      >
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import ThanhToanService from "@/services/thanh-toan.service"; // Khai báo Service vừa tạo

const route = useRoute();
const loading = ref(true);
const isSuccess = ref(false);
const message = ref(""); // Khai báo biến message để hiển thị thông báo

const orderId = ref("");
const transactionNo = ref("");
const amount = ref(0);
const responseCode = ref("");

onMounted(async () => {
  // Lấy các thông số VNPAY trả về trên URL Query parameters
  const queryParams = route.query;

  responseCode.value = queryParams.vnp_ResponseCode;
  orderId.value = queryParams.vnp_TxnRef;
  transactionNo.value = queryParams.vnp_TransactionNo;
  amount.value = Number(queryParams.vnp_Amount || 0);

  try {
    // Gọi phương thức processVnpayReturn từ ThanhToanService
    const response = await ThanhToanService.processVnpayReturn(queryParams);

    if (response.status === "SUCCESS") {
      isSuccess.value = true;
      message.value = "Thanh toán thành công và đã ghi nhận đơn hàng!";
    } else {
      isSuccess.value = false;
      message.value = "Thanh toán không thành công!";
    }
  } catch (error) {
    console.error("Lỗi xác minh thanh toán:", error);
    isSuccess.value = false;
    message.value =
      error.response?.data?.message || error.message || "Có lỗi xảy ra!";
  } finally {
    loading.value = false;
  }
});
</script>
