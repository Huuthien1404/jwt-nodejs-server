const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const db = require("./query");

app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "https://jwt-reactjs-client.vercel.app",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/v1/auth", authRoute);
app.use("/v1/user", userRoute);

const socketIo = require("socket.io")(server, {
  cors: {
    origin: "https://jwt-reactjs-client.vercel.app",
  },
});

socketIo.on("connection", (socket) => {
  ///Handle khi có connect từ client tới
  socket.on("sendDataClient", async function () {
    try {
      const users = await db.query(
        'select "userId", "username", "email", "admin", "status" from public."Users" order by "userId" asc'
      );
      socketIo.emit("SendDataServer", users.rows);
    } catch (error) {
      socketIo.emit("SendDataServer", {
        msg: error,
      });
    }
  });
  socket.on("setOnlineUser", async (data) => {
    socket.id = data;
    try {
      await db.query(
        `UPDATE public."Users" SET status='online' WHERE "username" = '${data}';`
      );
      const users = await db.query(
        'select "userId", "username", "email", "admin", "status" from public."Users" order by "userId" asc'
      );
      socketIo.emit("SendDataServer", users.rows);
    } catch (error) {
      socketIo.emit("SendDataServer", {
        msg: error,
      });
    }
  });
  socket.on("setOfflineUser", async (data) => {
    try {
      await db.query(
        `UPDATE public."Users" SET status='offline' WHERE "username" = '${data}';`
      );
      const users = await db.query(
        'select "userId", "username", "email", "admin", "status" from public."Users" order by "userId" asc'
      );
      socketIo.emit("SendDataServer", users.rows);
    } catch (error) {
      socketIo.emit("SendDataServer", {
        msg: error,
      });
    }
  });

  socket.on("disconnect", async () => {
    try {
      await db.query(
        `UPDATE public."Users" SET status='offline' WHERE "username" = '${socket.id}';`
      );
      const users = await db.query(
        'select "userId", "username", "email", "admin", "status" from public."Users" order by "userId" asc'
      );
      socketIo.emit("SendDataServer", users.rows);
    } catch (error) {
      socketIo.emit("SendDataServer", {
        msg: error,
      });
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log("Server is running...");
});
