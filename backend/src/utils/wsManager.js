const clients = new Map(); // userId string -> Set of sockets

module.exports = {
  clients,
  sendToUser: (userId, data) => {
    if (!userId) return false;
    const userSockets = clients.get(userId.toString());
    if (userSockets && userSockets.size > 0) {
      let sentCount = 0;
      userSockets.forEach(ws => {
        if (ws.readyState === 1) { // 1 is WebSocket.OPEN
          try {
            ws.send(JSON.stringify(data));
            sentCount++;
          } catch (err) {
            console.error(`Error sending message to socket of user ${userId}:`, err);
          }
        }
      });
      return sentCount > 0;
    }
    return false;
  }
};
