const Message = require('../models/message');
const User = require('../models/user');

let onlineUsers = new Map();
let usersState=new Map();//idle,ringing,onCall,calling

async function onlogout(userId){
  
}

function buildConversationId(userA, userB) {
  const a = String(userA);
  const b = String(userB);
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

 async function chatSocketHandler(io, socket) {

  const userId = String(socket.handshake?.auth?.userId);
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // Add socket.id to user's set
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);
  usersState.set(userId,{"status":"idle"});

  // Notify friends that user is online
  const user = await User.findById(userId);
  const friends = user.friends || [];
  friends.forEach(fId => {
    const fStr = String(fId);
    if (onlineUsers.has(fStr)) {
      onlineUsers.get(fStr).forEach(fSocketId => {
        socket.to(fSocketId).emit("iamonline", userId);
      });
    }
  });
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
    console.log(err)
  }

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

    // FIXED: Handle Set of socket IDs properly
    const receiverSocketIds = onlineUsers.get(String(receiverId));
    if (receiverSocketIds) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit('receiveMessage', {
          _id: message._id,
          senderId,
          receiverId,
          text,
          createdAt: message.createdAt,
          status: 'delivered',
          conversationId: message.conversationId
        });
      });
      await Message.updateOne(
        { _id: message._id },
        { $set: { status: 'delivered', deliveredAt: new Date() } }
      );
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
  socket.on('loadMessages', async ({ friendId , skip }) => {
    if (!friendId) return;
    const conversationId = buildConversationId(userId, friendId);
    try {
      // Load all messages for this conversation
     const PAGE_SIZE = 10;

const messages = await Message.find({ conversationId })
  .sort({ createdAt: -1 })   // oldest → newest
  .skip(skip)               // skip already loaded messages
  .limit(PAGE_SIZE)         // get next 10
  .lean();

        
      
      // Also check for any pending messages for this user that might not be in the conversation yet
      // const pendingMessages = await Message.find({ 
      //   receiver: userId, 
      //   status: 'sent',
      //   conversationId: { $ne: conversationId }
      // }).lean();
      
      // // Update pending messages to delivered status
      // if (pendingMessages.length > 0) {
      //   await Message.updateMany(
      //     { _id: { $in: pendingMessages.map(msg => msg._id) } },
      //     { $set: { status: 'delivered', deliveredAt: new Date() } }
      //   );
      // }
      
      // // Combine conversation messages and pending messages
      // const allMessages = [...messages, ...pendingMessages];
      
      const formattedMessages = messages.map((doc) => ({
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
        const senderSocketIds = onlineUsers.get(String(peerId));
        if (senderSocketIds) {
          senderSocketIds.forEach(socketId => {
            updatedMessages.forEach(msg => {
              io.to(socketId).emit('messageStatusUpdate', {
                messageId: msg._id,
                status: 'read',
                timestamp: msg.readAt
              });
            });
          });
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });

  socket.on("check-online-status", (friendId) => {
    const friendIdStr = String(friendId);
    const isOnline = onlineUsers.has(friendIdStr); 
    const status = isOnline ? "Online" : "Offline";
    socket.emit("friend-online-status", { friendId: friendIdStr, status });
  });
  
  socket.on("disconnect", async () => {
    // Remove only this socket.id
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      // If no other sockets left, user is truly offline
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        friends.forEach(fId => {
          const fStr = String(fId);
          if (onlineUsers.has(fStr)) {
            onlineUsers.get(fStr).forEach(fSocketId => {
              io.to(fSocketId).emit("iamoffline", userId);
            });
          }
        });
      }
    }
  });

  socket.on("logout", async () => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).forEach(sid => io.to(sid).emit("iamoffline", userId));
      onlineUsers.delete(userId);
      usersState.delete(userId);
      friends.forEach(fId => {
          const fStr = String(fId);
          if (onlineUsers.has(fStr)) {
            onlineUsers.get(fStr).forEach(fSocketId => {
              io.to(fSocketId).emit("iamoffline", userId);
            });
          }
        });
    }
  });

  // FIXED: Handle call-request properly with Set of socket IDs
  socket.on("call-request",(obj)=>{
    const {callerId,receiverId}=obj;

    if(onlineUsers.has(String(receiverId)) && usersState.has(String(receiverId)) && usersState.get(String(receiverId)).status=="idle")
    {
       const callerSocketIds = onlineUsers.get(String(callerId));
       if (callerSocketIds) {
         callerSocketIds.forEach(socketId => {
           io.to(socketId).emit("call-request-response",{"response":"online"});
           console.log("sever say online");
         });
       }
    }
    else if(onlineUsers.has(String(receiverId)) && usersState.has(String(receiverId)) && (usersState.get(String(receiverId)).status=="ringing" || usersState.get(String(receiverId)).status=="onCall"))
    {
      const callerSocketIds = onlineUsers.get(String(callerId));
      if (callerSocketIds) {
        callerSocketIds.forEach(socketId => {
          io.to(socketId).emit("call-request-response",{"response":"onOtherCall"});
          console.log("sever say on other cal");
        });
      }
    }
    else
    {
      const callerSocketIds = onlineUsers.get(String(callerId));
      if (callerSocketIds) {
        callerSocketIds.forEach(socketId => {
          io.to(socketId).emit("call-request-response",{"response":"offline"});
          console.log("sever say offline");
        });
      }
    }
  })

  socket.on("end-call",({callerId,receiverId})=>{
    if(usersState.has(String(receiverId))) {
      if(usersState.get(String(receiverId)).status!="idle") {
        const receiverSocketIds = onlineUsers.get(String(receiverId));
        if (receiverSocketIds) {
          receiverSocketIds.forEach(socketId => {
            io.to(socketId).emit("end-call",{callerId,receiverId});
          });
        }
      }
    }
    if(usersState.has(String(callerId))) {
      if(usersState.get(String(callerId)).status!="idle") {
        const callerSocketIds = onlineUsers.get(String(callerId));
        if (callerSocketIds) {
          callerSocketIds.forEach(socketId => {
            io.to(socketId).emit("end-call",{callerId,receiverId});
          });
        }
      }
    }
    if(usersState.has(String(callerId))) {
      usersState.get(String(callerId)).status="idle";
    }
    if(usersState.has(String(receiverId))) {
      usersState.get(String(receiverId)).status="idle";
    }
  })

  socket.on("call-send",async ({callerId,receiverId})=>{
    if(onlineUsers.has(String(receiverId)) && usersState.has(String(receiverId)) && usersState.get(String(receiverId)).status=="idle")
    {
      usersState.get(String(callerId)).status="calling";
      usersState.get(String(receiverId)).status="ringing";
      const user = await User.findById(callerId);
      // FIXED: Iterate through all socket IDs for the receiver
      const receiverSocketIds = onlineUsers.get(String(receiverId));
      if (receiverSocketIds) {
        receiverSocketIds.forEach(socketId => {
          io.to(socketId).emit("call-receive",{
            "callerId":callerId,
            "callerName":user.username
          });
        });
      }
    }
  })

  // FIXED: Handle call-reject properly with Set of socket IDs
  socket.on("call-reject",({callerId,receiverId})=>{
    if(usersState.has(String(callerId))) {
      usersState.get(String(callerId)).status="idle";
    }
    if(usersState.has(String(receiverId))) {
      usersState.get(String(receiverId)).status="idle";
    }
    const callerSocketIds = onlineUsers.get(String(callerId));
    if (callerSocketIds) {
      callerSocketIds.forEach(socketId => {
        io.to(socketId).emit("call-rejected",{callerId,receiverId});
      });
    }
  })

  // FIXED: Handle call-accept properly with Set of socket IDs
  socket.on("call-accept",({callerId,receiverId})=>{
    if(usersState.has(String(callerId))) {
      usersState.get(String(callerId)).status="onCall";
    }
    if(usersState.has(String(receiverId))) {
      usersState.get(String(receiverId)).status="onCall";
    }
    console.log("call accept")
    const callerSocketIds = onlineUsers.get(String(callerId));
    if (callerSocketIds) {
      callerSocketIds.forEach(socketId => {
        io.to(socketId).emit("call-accepted",{callerId,receiverId});
      });
    }
  })

  // FIXED: Handle ICE candidates properly with Set of socket IDs
  socket.on("sendIceCandidateToSignalingServer", ({iceCandidate,senderId,receiverId}) => {
    if(!onlineUsers.has(String(receiverId))) {
      return;
    }
    const receiverSocketIds = onlineUsers.get(String(receiverId));
    if (receiverSocketIds) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit("receivedIceCandidateFromServer", iceCandidate);
      });
    }
  })

  // FIXED: Handle newOffer properly with Set of socket IDs
  socket.on("newOffer", (obj) => {
    if(!onlineUsers.has(String(obj.receiverId))) {
      return;
    }
    const receiverSocketIds = onlineUsers.get(String(obj.receiverId));
    if (receiverSocketIds) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit("newOffer", obj);
      });
    }
  })

  // FIXED: Handle newAnswer properly with Set of socket IDs
  socket.on("newAnswer", (offerpack) => {
    if(!onlineUsers.has(String(offerpack.callerId))) {
      return;
    }
    const callerSocketIds = onlineUsers.get(String(offerpack.callerId));
    if (callerSocketIds) {
      callerSocketIds.forEach(socketId => {
        io.to(socketId).emit("answerresponse", offerpack);
      });
    }
  })

};


async function videoSocketHandler(io, socket) {
  

  
}



module.exports={chatSocketHandler,videoSocketHandler}