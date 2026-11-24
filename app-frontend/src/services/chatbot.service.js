import createApiClient from "./api.service";

class ChatbotService {
  constructor(baseUrl = "/api/chatbot") {
    this.api = createApiClient(baseUrl);
  }

  async chat(data) {
    // data gồm: { message, id_phien_chat_ai, id_khach_hang }
    return (await this.api.post("/", data)).data;
  }
}

export default new ChatbotService();
