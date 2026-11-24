const express = require("express");
const PhienChatAI = require("../controllers/phien-chat-ai.controller");

const router = express.Router();

router.route("/").get(PhienChatAI.findAll).post(PhienChatAI.create);

router
  .route("/:id")
  .get(PhienChatAI.findOne)
  .put(PhienChatAI.update)
  .delete(PhienChatAI.delete);

module.exports = router;
