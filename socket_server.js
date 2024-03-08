const io = require('./server.js').io;

io.on('connection', (socket) => {
    console.log(socket.id, " connected");
});