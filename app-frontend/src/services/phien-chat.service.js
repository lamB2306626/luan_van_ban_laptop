import createApiClient from "./api.service";

class PhienChatService {
  constructor(baseUrl = "/api/phien-chat-ai") {
    this.api = createApiClient(baseUrl);
  }

  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  async getById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async create(data = {}) {
    return (await this.api.post("/", data)).data;
  }

  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default new PhienChatService();
