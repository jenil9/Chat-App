// src/socket.js
import { io } from "socket.io-client";
import store from "./src/store/store";
import { addMessage, addMultipleMessages, updateMessageStatus, setUserOnlineStatus,markMessagesAsReadForFriend,addtoonline,removefromonline } from "./src/store/messagesSlice";
import { useDispatch } from "react-redux";
let socket;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io("http://localhost:3000", {
      auth: { userId }  // attach userId during handshake
    });

    // Set up socket event listeners
    setupSocketListeners();
  }
  return socket;
};

const setupSocketListeners = () => {
  if (!socket) return;

  // Listen for incoming messages
  socket.on('receiveMessage', (message) => {
    store.dispatch(addMessage(message));
  });

  // Listen for multiple pending messages on connection
  socket.on('pendingMessages', (messages) => {
    store.dispatch(addMultipleMessages(messages));
  });

  // Listen for message status updates
  socket.on('messageStatusUpdate', ({ messageId, status, timestamp }) => {
    store.dispatch(updateMessageStatus({ messageId, status, timestamp }));
  });

  socket.on('messageSent',({ message})=>{
    store.dispatch(addMessage(message));
  });

  // Listen for loaded messages
  socket.on('messagesLoaded', (messages) => {
    store.dispatch(addMultipleMessages(messages));
  });

  // Listen for online status updates
  socket.on('friend-online-status', (data) => {
    const { friendId, status } = data;
    if (status === 'Online') {
      store.dispatch(addtoonline(friendId));
    } else {
      store.dispatch(removefromonline(friendId));
    }
  });

  // Listen for connection events
  socket.on('connect', () => {
  });

  socket.on('disconnect', () => {
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  socket.on("iamonline",(userId)=>{
    store.dispatch(addtoonline(userId));
    
  })
  socket.on("iamoffline",(userId)=>{
    store.dispatch(removefromonline(userId));
  })

  socket.on("online-status", ({ friendId, isOnline }) => {
  if (isOnline) {
    store.dispatch(addtoonline(friendId));
  } else {
    store.dispatch(removefromonline(friendId));
  }
});

};

export const getSocket = () => socket;

// Helper function to ensure socket is ready
export const waitForSocket = () => {
  return new Promise((resolve) => {
    if (socket && socket.connected) {
      resolve(socket);
    } else {
      const checkSocket = () => {
        if (socket && socket.connected) {
          resolve(socket);
        } else {
          setTimeout(checkSocket, 100);
        }
      };
      checkSocket();
    }
  });
};

// Helper function to send a message
export const sendMessage = (senderId, receiverId, text) => {
  if (socket) {
    socket.emit('sendMessage', { senderId, receiverId, text });
  }
};

// Helper function to load messages for a conversation
export const loadMessages = async (friendId) => {
  try {
    const socketInstance = await waitForSocket();
    socketInstance.emit('loadMessages', { friendId });
  } catch (error) {
    console.warn('Socket not available for loading messages:', error);
  }
};

// Helper function to mark messages as read
export const markMessagesAsRead = async (peerId) => {
  try {
    const socketInstance = await waitForSocket();
    socketInstance.emit('markRead', { peerId });

    // Update Redux state
    const state = store.getState();
    const currentUserId = state.user.userinfo.id; // get current user
    store.dispatch(markMessagesAsReadForFriend({ friendId: peerId, currentUserId }));
  } catch (error) {
    console.warn('Socket not available for marking messages as read:', error);
  }
};

// Helper function to check online status
export const checkOnlineStatus = async (friendId) => {
  try {
    const socketInstance = await waitForSocket();
    socketInstance.emit('check-online-status', friendId);
  } catch (error) {
    console.warn('Socket not available for checking online status:', error);
  }
};

export const onlogout=(userId)=>{
  socket.emit('logout',userId)
}
