const express = require("express");
const cuocTroTruyen = require("../controllers/cuoc-tro-truyen.controller");

const router = express.Router();

router.route("/").post(cuocTroTruyen.create);

module.exports = router;
