const Message = require('../models/message');

let onlineUsers = new Map();

function buildConversationId(userA, userB) {
  const a = String(userA);
  const b = String(userB);
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

 async function chatSocketHandler(io, socket) {
  const userId = socket.handshake?.auth?.userId;
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  onlineUsers.set(userId, socket.id);

  // Deliver undelivered messages on connect
  try {
    const pending = await Message.find({ receiver: userId, status: 'sent' })
      .sort({ createdAt: 1 })
      .lean();
    if (pending.length > 0) {
      // Send all pending messages as a batch
      const pendingMessages = pending.map((doc) => ({
        _id: doc._id,
        senderId: doc.sender,
        receiverId: doc.receiver,
        text: doc.text,
        createdAt: doc.createdAt,
        status: 'delivered',
        conversationId: doc.conversationId
      }));
      
      socket.emit('pendingMessages', pendingMessages);
      
      await Message.updateMany(
        { receiver: userId, status: 'sent' },
        { $set: { status: 'delivered', deliveredAt: new Date() } }
      );
    }
  } catch (err) {
    // swallow to avoid disconnecting user on delivery failure
  }

  // Send a new message
  socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
    if (!senderId || !receiverId || !text) return;
    const conversationId = buildConversationId(senderId, receiverId);
    try {
      const message = await Message.create({
        conversationId,
        sender: senderId,
        receiver: receiverId,
        text,
        status: 'sent'
      });

      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          _id: message._id,
          senderId,
          receiverId,
          text,
          createdAt: message.createdAt,
          status: 'delivered',
          conversationId: message.conversationId
        });
        await Message.updateOne(
          { _id: message._id },
          { $set: { status: 'delivered', deliveredAt: new Date() } }
        );
      } else {
      }
      socket.emit('messageSent', { 
        message: {
          _id: message._id,
          senderId,
          receiverId,
          text,
          createdAt: message.createdAt,
          status: 'sent',
          conversationId: message.conversationId
        }
      });
    } catch (err) {
      socket.emit('messageError', { error: 'FAILED_TO_SEND' });
    }
  });

  // Load messages for a specific conversation
  socket.on('loadMessages', async ({ friendId }) => {
    if (!friendId) return;
    const conversationId = buildConversationId(userId, friendId);
    try {
      // Load all messages for this conversation
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean();
      
      // Also check for any pending messages for this user that might not be in the conversation yet
      const pendingMessages = await Message.find({ 
        receiver: userId, 
        status: 'sent',
        conversationId: { $ne: conversationId }
      }).lean();
      
      // Update pending messages to delivered status
      if (pendingMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: pendingMessages.map(msg => msg._id) } },
          { $set: { status: 'delivered', deliveredAt: new Date() } }
        );
      }
      
      // Combine conversation messages and pending messages
      const allMessages = [...messages, ...pendingMessages];
      
      const formattedMessages = allMessages.map((doc) => ({
        _id: doc._id,
        senderId: doc.sender,
        receiverId: doc.receiver,
        text: doc.text,
        createdAt: doc.createdAt,
        status: doc.status === 'sent' ? 'delivered' : doc.status,
        conversationId: doc.conversationId
      }));
      
      socket.emit('messagesLoaded', formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      socket.emit('messageError', { error: 'FAILED_TO_LOAD_MESSAGES' });
    }
  });

  // Mark conversation messages as read
  socket.on('markRead', async ({ peerId, before }) => {
    if (!peerId) return;
    const conversationId = buildConversationId(userId, peerId);
    const cutoff = before ? new Date(before) : new Date(); 
    try {
      const result = await Message.updateMany(
        { conversationId, receiver: userId, status: { $in: ['sent', 'delivered'] }, createdAt: { $lte: cutoff } },
        { $set: { status: 'read', readAt: new Date() } }
      );
      
      
      // If messages were updated, emit status updates to the sender
      if (result.modifiedCount > 0) {
        const updatedMessages = await Message.find({
          conversationId, 
          receiver: userId, 
          status: 'read',
          readAt: { $exists: true }
        }).lean();
        
        // Notify the sender about read status
        const senderSocketId = onlineUsers.get(String(peerId));
        if (senderSocketId) {
          updatedMessages.forEach(msg => {
            io.to(senderSocketId).emit('messageStatusUpdate', {
              messageId: msg._id,
              status: 'read',
              timestamp: msg.readAt
            });
          });
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });
  socket.on("check-online-status", (friendId) => {
    const isOnline = onlineUsers.has(String(friendId)); 
    const status = isOnline ? "Online" : "Offline";
    socket.emit("friend-online-status", { friendId, status });
  });
  
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
  });
};




async function videoSocketHandler(io, socket) {
  const userId = socket.handshake?.auth?.userId
  if (!userId) {
    socket.disconnect(true)
    return
  }

  socket.on("offer", async (data) => {
    socket.to(data.to).emit("offer", { sdp: data.sdp, from: socket.id })
  })

  socket.on("answer", async (data) => {
    socket.to(data.to).emit("answer", { sdp: data.sdp })
  })

  socket.on("candidate", async (data) => {
    socket.to(data.to).emit("candidate", data.candidate)
  })
}



module.exports={chatSocketHandler,videoSocketHandler}