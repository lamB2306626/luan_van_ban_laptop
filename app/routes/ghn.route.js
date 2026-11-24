const express = require("express");
const ghn = require("../controllers/ghn.controller");

const router = express.Router();

// Lấy danh sách Tỉnh/Thành
router.get("/provinces", ghn.getProvinces);

// Lấy danh sách Quận/Huyện theo Tỉnh/Thành ID
router.get("/districts/:provinceId", ghn.getDistricts);

// Lấy danh sách Phường/Xã theo Quận/Huyện ID
router.get("/wards/:districtId", ghn.getWards);

// Tính phí vận chuyển
router.post("/calculate-fee", ghn.calculateShippingFee);

router.post("/:id/create-order-ghn", ghn.createOrderGHN);

router.get("/ghn-order/:orderCode", ghn.getGHNOrderDetail);

router.post("/webhook", ghn.handleGHNWebhook);

module.exports = router;

//https://status-mushy-antitoxic.ngrok-free.dev/api/ghn/webhook
//localhost:5000/api/don-hang/DH01
//npx ngrok http 5000
//uvicorn main:app --reload --port 8000
//.\venv\Scripts\activate
//python main.py
