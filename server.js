// index.js  (server)
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);
const CHAT_PASSWORD = process.env.CHAT_PASSWORD || "defaultpassword";
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));

// ----------------------
// Online users tracking
// ----------------------
// Map socket.id -> { name, avatar, room }
const users = {};

// Helper: send user list for a room
function emitRoomUsers(room) {
    const list = Object.values(users).filter(u => u.room === room);
    io.to(room).emit("users", list); // client listens to "users"
}

// Password gate
io.use((socket, next) => {
    const pass = socket.handshake.auth?.password;
    if (pass === CHAT_PASSWORD) return next();
    next(new Error("invalid password"));
});

io.on("connection", (socket) => {
    let currentRoom = null;

    // client calls this first after connect
    socket.on("register", ({ name, avatar, text }) => {
        if (!name) name = "Adventurer";
        users[socket.id] = { name, avatar: avatar || "", room: null };
    });

    // client calls whenever room is chosen/changed
    socket.on("joinRoom", (roomName) => {
        if (!roomName) return;

        // leave old room (if any)
        if (currentRoom) socket.leave(currentRoom);

        // join new room
        currentRoom = roomName;
        socket.join(currentRoom);

        // update the user's room
        if (users[socket.id]) users[socket.id].room = currentRoom;

        // notify this socket
        socket.emit("system", `🧭 Joined room: ${currentRoom}`);

        // update lists for both old and new rooms
        emitRoomUsers(currentRoom);
    });

    // chat messages go only to current room
    socket.on("chat", (data) => {
        if (!currentRoom) return;
        io.to(currentRoom).emit("chat", data);
    });

    socket.on("disconnect", () => {
        // remember the room before removing
        const wasIn = users[socket.id]?.room || null;

        // remove user
        delete users[socket.id];

        // update that room's list
        if (wasIn) emitRoomUsers(wasIn);
    });
});

server.listen(PORT, () =>
    console.log(`🧙‍♂️ D&D Chat running on port ${PORT}`)
);
