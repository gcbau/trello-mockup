const socketConnections = {};

module.exports = {
    sockets: () => {
        return socketConnections;
    },
    init: (server) => {
        const io = require('socket.io')(server);

        io.on('connection', function(socket) {
            let userId = socket.handshake.query.userId
            socketConnections[userId] = socket;
            console.log('a user connected: ' + socket.id);
        });
    },
    invite: (userTarget) => {
        console.log(Object.keys(socketConnections));
        socketConnections[userTarget].emit('invitation', `I'm inviting you to my team!`);
    }
};