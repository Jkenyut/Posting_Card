module.exports = {
  init: (app) => {
    const { Server } = require("socket.io");
    return (io = new Server(app, {
      cors: {
        origin: "*",
        allowedHeaders: ["Authorization"],
        methods: ["GET,POST,PUT,PATCH,DELETE"],
      },
    }));
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not insitialized");
    }
    console.log("ok socket connected");
    return io;
  },
};
