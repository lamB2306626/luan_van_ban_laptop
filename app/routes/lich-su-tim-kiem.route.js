const express = require("express");
const lichSuTimKiem = require("../controllers/lich-su-tim-kiem.controller");

const router = express.Router();

router
  .route("/")
  .get(lichSuTimKiem.findAll)
  .post(lichSuTimKiem.create)
  .delete(lichSuTimKiem.deleteAll);

router
  .route("/:id")
  .get(lichSuTimKiem.findOne)
  .put(lichSuTimKiem.update)
  .delete(lichSuTimKiem.delete);

module.exports = router;
