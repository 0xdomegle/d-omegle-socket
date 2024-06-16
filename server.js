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
        origins: "*",
        methods: ["GET", "POST"],
    },
});

let users = [];

function matchUsers() {
    console.log(users.length, "users are available");
    console.log(users);

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

    console.log("Session created : ", session);

    io.to(offerer.socketId).emit("createOffer", { offererId: offerer.socketId, answererId: answerer.socketId });
}

io.on("connection", (socket) => {

    console.log("user connected : ", socket.id);

    socket.emit("connected", {
        socketId: socket.id,
    })

    socket.on("adminUser", (data) => {
        const user = new User(socket.id, data.address);
        users.push(user);
        matchUsers();
    });

    socket.on("sendOffer", (data) => {
        socket.to(data.peers.answererId).emit("createAnswer", data)
    });

    socket.on("sendAnswer", (data) => {
        socket.to(data.peers.offererId).emit("reciveAnswer", data)
    });

    socket.on("exchangeCandidates", (data) => {
        console.log(data)
        socket.to(data.remoteSocketId).emit("IceCandidateRecived", data.candidate);
    });

    socket.on("changeSession", (data) => {
        socket.to(data.remoteUserSocketID).emit("sessionEnded");
    });

    socket.on("disconnect", () => {
        console.log("user disconnect : ", socket.id);

        users.filter((user) => {
            if (user.socketId === socket.id) {
                users.splice(users.indexOf(user), 1);
            }
        });

        console.log(users);
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