import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 1629;
const app = express();


const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
        ],
        methods: ["GET", "POST"]
    }
});


let waitingUsers = [];

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.emit("connected", socket.id);

    socket.on("findMatch", () => {
        console.log(`User ${socket.id} is looking for a match`);


        if (waitingUsers.length > 0) {
            const partnerSocketId = waitingUsers.pop();
            const partnerSocket = io.sockets.sockets.get(partnerSocketId);

            if (partnerSocket) {
                // Notify both users of the match
                socket.emit("matchFound", { partner: partnerSocketId });
                partnerSocket.emit("matchFound", { partner: socket.id });

                // Set up listeners for ICE candidates and SDP messages
                setupWebRTCSignaling(socket, partnerSocket);
                // setupWebRTCSignaling(partnerSocket, socket);
            } else {
                waitingUsers.push(socket.id); // Add the current user to the waiting list
            }
        } else {
            waitingUsers.push(socket.id);
        }

        console.log("waitingUsers: ", waitingUsers);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        waitingUsers = waitingUsers.filter((id) => id !== socket.id);
    });
});

function setupWebRTCSignaling(offerer, answerer) {
    console.log("session created between", offerer.id, "and", answerer.id);
    offerer.emit("generateOffer");
    offerer.on("offer", (data) => {
        answerer.emit("offer", data);
    });

    answerer.on("answer", (data) => {
        offerer.emit("answer", data);
    });

    offerer.on("iceCandidate", (data) => {
        answerer.emit("iceCandidate", data);
    });

    answerer.on("iceCandidate", (data) => {
        offerer.emit("iceCandidate", data);
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
