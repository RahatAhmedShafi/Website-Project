const clients = new Map();

module.exports = {
  clients,
  sendToUser: (userId, data) => {
    if (!userId) return false;
    const ws = clients.get(userId.toString());
    if (ws && ws.readyState === 1) { // 1 is WebSocket.OPEN
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error(`Error sending message to user ${userId}:`, err);
        return false;
      }
    }
    return false;
  }
};
