const express = require('express');
const http = require('http');
var cors = require("cors");

const { Server } = require("socket.io");

const PORT = process.env.PORT || 1629;

const app = express();
app.use(cors());

const expressServer = http.createServer({}, app);
const io = new Server(expressServer, {
    cors: {
        origins: ["https://app.0xdomegle.com/", "http://localhost:5173/"],
    },
});

let users = [];

function matchUsers() {
    console.log(users.length, "users are available");
    if (users.length < 2) return;

    const offererIndex = Math.floor(Math.random() * users.length);
    let answererIndex = Math.floor(Math.random() * users.length);

    while (offererIndex === answererIndex) {
        answererIndex = Math.floor(Math.random() * users.length);
    }

    const offerer = users[offererIndex];
    const answerer = users[answererIndex];

    users.splice(offererIndex, 1);
    users.splice(
        answererIndex > offererIndex ? answererIndex - 1 : answererIndex,
        1,
    );
    const session = new Session(offerer, answerer);

    io.to(offerer.socketId).emit("createOffer", { offererID: offerer.socketId, answererID: answerer.socketId });
}

io.on("connection", (socket) => {

    socket.emit("connected", {
        localUserSocketID: socket.id,
    })

    socket.on("adminUser", (data) => {
        const user = new User(data.socketId, data.address);
        users.push(user);
        matchUsers();
    });

    socket.on("sendOffer", (data) => {
        socket.to(data.peers.answererID).emit("createAnswer", data)
    });

    socket.on("sendAnswer", (data) => {
        socket.to(data.peers.offererID).emit("reciveAnswer", data)
    });

    socket.on("exchangeCandidates", (data) => {
        console.log(data);
        socket.to(data.remoteSocketId).emit("IceCandidateRecived", data.candidate);
    });

    socket.on("changeSession", (data) => {
        socket.to(data.remoteUserSocketID).emit("sessionEnded");
    });

    socket.on("disconnect", () => {
        console.log("user disconnect");
    });
});

expressServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

class User {
    constructor(_socketID, _address) {
        this.socketId = _socketID;
        this.address = _address;
    }
}

class Session {
    constructor(_offerer, _senderer) {
        this.sessionId = Date.now();
        this.offerer = _offerer;
        this.answerer = _senderer;
    }
}