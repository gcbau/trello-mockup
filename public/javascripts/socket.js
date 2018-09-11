$(function() {
    const socket = io({
        query: {
            userId: userId
        }
    });

    socket.on('invitation', (msg) => {
        console.log(msg);
    })

    socket.on('disconnect', () => {
        console.log("user has disconnected!");
    })
})