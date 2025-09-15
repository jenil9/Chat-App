import { createSlice, createSelector } from '@reduxjs/toolkit'

const initialState = {
  messages: [], // Array of all messages from all friends
  // Structure: { _id, senderId, receiverId, text, createdAt, status, conversationId }
  onlineUsers: {}, // Track online users as plain object
}

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      // Add a new message to the messages array
      const message = action.payload
      // Check if message already exists to avoid duplicates
      const existingMessage = state.messages.find(msg => msg._id === message._id)
      if (!existingMessage) {
        state.messages.push(message)
      }
    },
    addMultipleMessages: (state, action) => {
      // Add multiple messages (useful for pending messages on connection)
      const messages = action.payload
      messages.forEach(message => {
        const existingMessage = state.messages.find(msg => msg._id === message._id)
        if (!existingMessage) {
          state.messages.push(message)
        }
      })
    },
    updateMessageStatus: (state, action) => {
      // Update message status (sent -> delivered -> read)
      const { messageId, status, timestamp } = action.payload
      const message = state.messages.find(msg => msg._id === messageId)
      if (message) {
        message.status = status
        if (timestamp) {
          if (status === 'delivered') {
            message.deliveredAt = timestamp
          } else if (status === 'read') {
            message.readAt = timestamp
          }
        }
      }
    },
    clearMessages: (state) => {
      // Clear all messages (useful for logout)
      state.messages = []
    },
    setUserOnlineStatus: (state, action) => {
      // Set online status for a user
      const { userId, isOnline } = action.payload
      if (isOnline) {
        state.onlineUsers[userId] = true
      } else {
        delete state.onlineUsers[userId]
      }
    },
    clearOnlineUsers: (state) => {
      // Clear all online users (useful for logout)
      state.onlineUsers = {}
    }
  }
})

export const { addMessage, addMultipleMessages, updateMessageStatus, clearMessages, setUserOnlineStatus, clearOnlineUsers } = messagesSlice.actions

// Selector to get messages for a specific friend (memoized)
export const selectMessagesForFriend = createSelector(
  [
    (state) => state.messages.messages,
    (state, friendId) => friendId,
    (state) => state.user.userinfo.id
  ],
  (messages, friendId, currentUserId) => {
    return messages.filter(msg => 
      (msg.senderId === friendId && msg.receiverId === currentUserId) ||
      (msg.senderId === currentUserId && msg.receiverId === friendId)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
)

// Selector to get unread message count for a specific friend (memoized)
export const selectUnreadCountForFriend = createSelector(
  [
    (state) => state.messages.messages,
    (state, friendId) => friendId,
    (state) => state.user.userinfo.id
  ],
  (messages, friendId, currentUserId) => {
    return messages.filter(msg => 
      msg.senderId === friendId && 
      msg.receiverId === currentUserId && 
      msg.status !== 'read'
    ).length
  }
)

// Selector to get all unread message count (memoized)
export const selectTotalUnreadCount = createSelector(
  [
    (state) => state.messages.messages,
    (state) => state.user.userinfo.id
  ],
  (messages, currentUserId) => {
    return messages.filter(msg => 
      msg.receiverId === currentUserId && 
      msg.status !== 'read'
    ).length
  }
)

// Selector to get online status for a specific user
export const selectUserOnlineStatus = (state, userId) => {
  return state.messages.onlineUsers[userId] ? 'Online' : 'Offline'
}

export default messagesSlice.reducer
