const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const CHAT_PASSWORD = "Goldenfire2000"; // 🧙‍♂️ change this to your own secret phrase

io.use((socket, next) => {
    const clientPassword = socket.handshake.auth?.password;
    if (clientPassword === CHAT_PASSWORD) {
        next();
    } else {
        console.log("Rejected connection (wrong password)");
        next(new Error("invalid password"));
    }
});

io.on("connection", socket => {
    console.log("✅ A player connected");
    socket.on("chat", msg => io.emit("chat", msg));
    socket.on("disconnect", () => console.log("❌ A player left"));
});

server.listen(8080, () => console.log("Chat running on http://localhost:8080"));
