const app = require("./app");
const config = require("./app/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function startServer() {
  try {
    // Kiểm tra kết nối tới PostgreSQL qua Prisma
    await prisma.$connect();
    console.log("Connected to the PostgreSQL database!");

    const PORT = config.app.port || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Cannot connect to the database!", error);
    process.exit(1);
  }
}

startServer();
