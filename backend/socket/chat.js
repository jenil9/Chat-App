
let onlineUsers = new Map();

export default function chatSocketHandler(io, socket) {
    const userId = socket.handshake.auth.userId;
    onlineUsers.set(userId,socket.id);


    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
        try{
        const message = { text, senderId, timestamp: Date.now() };

        const receiverSocketId = onlineUsers.get(receiverId);
    
        if (receiverSocketId) {
          // Deliver instantly
          io.to(receiverSocketId).emit("receiveMessage", message);
    
          // Store in conversation history
          await Message.updateOne(
            { sender: senderId, receiver: receiverId },
            { $push: { messages: message } },
            { upsert: true }
          );
        } else {
          await PendingMessage.create({ sender: senderId, receiver: receiverId, text });
        }
    }
    catch(err)
    {
        
    }
      });

      // Handle disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
  });
}