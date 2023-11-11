const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
    origin: "https://jwt-reactjs-client.vercel.app",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use("/v1/auth", authRoute);
app.use("/v1/user", userRoute);

app.listen(process.env.PORT, () => {
    console.log("Server is running...");
})