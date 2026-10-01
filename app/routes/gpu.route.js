const express = require("express");
const gpu = require("../controllers/gpu.controller");

const router = express.Router();

router.route("/").get(gpu.findAll).post(gpu.create).delete(gpu.deleteAll);

router.route("/:id").get(gpu.findOne).put(gpu.update).delete(gpu.delete);

module.exports = router;
