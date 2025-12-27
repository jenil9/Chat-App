import { createSlice, createSelector } from '@reduxjs/toolkit'

const initialState = {
  messages: [], // Array of all messages from all friends
  onlineUsers: [], // Track online users as array
}

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Add a single message
    addMessage: (state, action) => {
      const message = action.payload
      if (!state.messages.find(msg => msg._id === message._id)) {
        state.messages = [...state.messages, message] // immutable
      }
    },

    // Add multiple messages
    addMultipleMessages: (state, action) => {
      const messages = action.payload
      const newMessages = messages.filter(
        msg => !state.messages.find(m => m._id === msg._id)
      )
      if (newMessages.length > 0) {
        state.messages = [...state.messages, ...newMessages] // immutable
      }
    },

    // Update message status (sent -> delivered -> read)
    updateMessageStatus: (state, action) => {
      const { messageId, status, timestamp } = action.payload
      state.messages = state.messages.map(msg => {
        if (msg._id !== messageId) return msg
        return {
          ...msg,
          status,
          deliveredAt: status === 'delivered' ? timestamp || msg.deliveredAt : msg.deliveredAt,
          readAt: status === 'read' ? timestamp || msg.readAt : msg.readAt
        }
      })
    },
    // In messagesSlice
    markMessagesAsReadForFriend: (state, action) => {
      const { friendId, currentUserId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg.senderId === friendId && msg.receiverId === currentUserId) {
          return { ...msg, status: 'read', readAt: new Date().toISOString() };
        }
        return msg;
      });
    },
    


    // Clear all messages (logout)
    clearMessages: (state) => {
      state.messages = []
    },

    // // Set online status for a user
    // setUserOnlineStatus: (state, action) => {
    //   const { userId, isOnline } = action.payload
    //   state.onlineUsers = { ...state.onlineUsers } // clone object
    //   if (isOnline) {
    //     state.onlineUsers[userId] = true
    //   } else {
    //     delete state.onlineUsers[userId]
    //   }
    // },

    // Clear all online users (logout)
    clearOnlineUsers: (state) => {
      state.onlineUsers = []
    },

    addtoonline:(state,action)=>{
     const userid=String(action.payload);
     if (!state.onlineUsers.includes(userid)) {
       state.onlineUsers=[...state.onlineUsers,userid];
     }
    },
    removefromonline:(state,action)=>{
     const userid=String(action.payload);
     state.onlineUsers=state.onlineUsers.filter((x)=>{
       if(x===userid){return false;}
       return true;
     })
    }
  }
})

// Selector to get messages for a specific friend
export const selectMessagesForFriend = createSelector(
  [
    (state) => state.messages.messages,
    (state, friendId) => friendId,
    (state) => state.user.userinfo.id
  ],
  (messages, friendId, currentUserId) => {
    return messages
      .filter(msg =>
        (msg.senderId === friendId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === friendId)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
)

// Selector to get unread message count for a specific friend
export const selectUnreadCountForFriend = createSelector(
  [
    (state) => state.messages.messages,
    (state, friendId) => friendId,
    (state) => state.user.userinfo.id
  ],
  (messages, friendId, currentUserId) => {
    return messages.filter(
      msg => msg.senderId === friendId && msg.receiverId === currentUserId && msg.status !== 'read'
    ).length
  }
)

// Selector to get total unread messages
export const selectTotalUnreadCount = createSelector(
  [
    (state) => state.messages.messages,
    (state) => state.user.userinfo.id
  ],
  (messages, currentUserId) => {
    return messages.filter(msg => msg.receiverId === currentUserId && msg.status !== 'read').length
  }
)

// Selector to get online status for a specific user
export const selectUserOnlineStatus = (state, userId) => {
  const userIdStr = String(userId);
  return state.messages.onlineUsers.includes(userIdStr)?"Online":"Offline";
}

export const {
  addMessage,
  addMultipleMessages,
  updateMessageStatus,
  clearMessages,
  setUserOnlineStatus,
  clearOnlineUsers,
  markMessagesAsReadForFriend,
  addtoonline,
  removefromonline
} = messagesSlice.actions

export default messagesSlice.reducer
