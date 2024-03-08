const express = require("express");
const http = require("http");
var cors = require("cors");

const { User, Session, users, sessions, IceCandidates, iceCandidates } = require("./algo");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer({}, app);
const io = new Server(server, {
  cors: {
    origins: ["https://app.0xdomegle.com/", "http://localhost:5173/"],
  },
});

const port = process.env.PORT || 1629;

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
  sessions.push(session);

  io.to(answerer.socketId).emit("matched", {
    sessionId: session.sessionId,
    partner: offerer,
    user: answerer,
  });
}

io.on("connection", (socket) => {
  console.log("domegle connection esablish on", socket.id);

  socket.emit("connection-success", {
    status: "connection-success",
    socketId: socket.id,
  });

  socket.on("disconnect", () => {
    console.log("connection disconnected on", socket.id);
    const userIndex = users.findIndex((user) => user.socketId === socket.id);
    if (userIndex !== -1) users.splice(userIndex, 1);
  });

  socket.on("admitUser", (data) => {
    const user = new User(socket.id, data.userAddress, data.offer);
    users.push(user);
    matchUsers();
  });

  socket.on("passCandidates", (data) => {
    socket.to(data.peerAddress).emit("getIceCandidate", data.candidate);
  });
  socket.on("submitAnswer", (data) => {
    let session = sessions.find(
      (session) => session.sessionId == data.sessionId,
    );
    session.answerer.sdp = data.answer;
    socket.to(session.offerer.socketId).emit("getAnswer", {
      sessionId: session.sessionId,
      answer: session.answerer,
      offerer: session.offerer,
    });
  });

  socket.on("sessionEnd", (data) => {
    console.log(data);
    if (data) {
      socket
        .to(data.remoteUserSocketId)
        .emit("endSession", { sessionId: data.sessionId });
    }
    return;
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});