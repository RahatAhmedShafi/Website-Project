const { db } = require('../config/db');
const wsManager = require('./wsManager');

/**
 * Helper to create a notification in DB and send it over WebSocket in real-time
 * @param {string} recipientId - ID of user receiving notification
 * @param {string} senderId - ID of user triggering notification
 * @param {string} type - 'like' | 'comment' | 'follow' | 'friend_request' | 'friend_accept' | 'post' | 'tuition' | 'job' | 'system'
 * @param {string|null} postId - Optional related post ID
 * @returns {object|null} Saved notification object
 */
async function createAndSendNotification(recipientId, senderId, type, postId = null) {
  try {
    // Do not notify yourself
    if (recipientId.toString() === senderId.toString()) return null;

    const notification = await db.create('notifications', {
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      read: false
    });

    // Populate sender details for WS payload
    const sender = await db.findById('users', senderId);
    let populatedNotification = { ...notification };
    if (sender) {
      const { password, ...safeSender } = sender;
      populatedNotification.sender = safeSender;
    }

    if (postId) {
      const post = await db.findById('posts', postId);
      if (post) {
        populatedNotification.post = post;
      }
    }

    // Send via WebSocket if client is connected
    wsManager.sendToUser(recipientId, {
      type: 'notification',
      notification: populatedNotification
    });

    return notification;
  } catch (err) {
    console.error('Error in createAndSendNotification helper:', err);
    return null;
  }
}

module.exports = { createAndSendNotification };
