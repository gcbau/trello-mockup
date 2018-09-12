$(function() {
    const socket = io({
        query: {
            userId: userId
        }
    });

    socket.on('invitation', (sqlres) => {
        res = sqlres[0][0];
        res.date = res.createdOn;
        console.log(res);
        let inv = generateInvitationNotification(res);
        console.log(inv);
        $('#notifications-content').find('.heading').after(inv);
    })

    socket.on('disconnect', () => {
        console.log("user has disconnected!");
    })
})