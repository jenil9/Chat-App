import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, sendMessage, markMessagesAsRead, loadMessages, checkOnlineStatus } from '../../../socket'
import { useSelector } from 'react-redux'
import { selectMessagesForFriend, selectUserOnlineStatus } from '../../store/messagesSlice'

const ChatWindow = () => {
  const params = useParams()
  const location = useLocation()
  const friendFromState = location.state?.friend
  const friendId = params.friendId
  const [message, setmessage] = useState("")
  const messagesEndRef = useRef(null)
  const socket = getSocket();
  
  const currentUserId = useSelector((state) => state.user.userinfo.id)
  const messages = useSelector((state) => selectMessagesForFriend(state, friendId))
  const isFriendOnline = useSelector((state) => selectUserOnlineStatus(state, friendId))

  const friend = useMemo(() => {
    // Prefer routed state; fallback to minimal friend object from URL
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check online status when friend changes
  useEffect(() => {
    if (friendId && socket && socket.connected) {
      checkOnlineStatus(friendId);
    }
  }, [friendId, socket])

  // Load messages when chat window opens
  useEffect(() => {
    if (friendId && currentUserId) {
      loadMessages(friendId);
    }
  }, [friendId, currentUserId]);

  // Mark messages as read after messages are loaded
  useEffect(() => {
    const markAsRead = async () => {
      if (friendId && currentUserId && messages.length > 0) {
        // Check if there are any unread messages for this friend
        const hasUnreadMessages = messages.some(msg => 
          msg.senderId === friendId && 
          msg.receiverId === currentUserId && 
          msg.status !== 'read'
        )
        
        if (hasUnreadMessages) {
          await markMessagesAsRead(friendId)
        }
      }
    }
    
    // Add a small delay to ensure messages are fully loaded
    const timeoutId = setTimeout(markAsRead, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages, friendId, currentUserId]) // Now depends on messages to trigger after loading

  // Mark messages as read when component becomes visible (user switches to this chat)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && friendId && messages.length > 0) {
        const hasUnreadMessages = messages.some(msg => 
          msg.senderId === friendId && 
          msg.receiverId === currentUserId && 
          msg.status !== 'read'
        )
        
        if (hasUnreadMessages) {
          markMessagesAsRead(friendId)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [friendId, currentUserId, messages])

  const handleClick = () => {
    if (message.trim().length === 0) {
      return
    }
    
    // Clear input immediately for better UX
    const messageText = message
    setmessage("")
    
    // Send message
    sendMessage(currentUserId, friendId, messageText)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <section className="h-full flex flex-col bg-[#313338] text-gray-200 overflow-hidden">
      {/* conversation header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold">
            {(friend.username || '?').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{friend.username || 'Friend'}</div>
            <div className="text-xs text-gray-400">{isFriendOnline}</div>
          </div>
        </div>
       
      </div>

      {/* messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0 max-h-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words overflow-hidden ${
                    msg.senderId === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                <div className="text-sm">{msg.text}</div>
                <div className={`text-xs mt-1 ${
                  msg.senderId === currentUserId ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {msg.senderId === currentUserId && (
                    <span className="ml-1">
                      {msg.status === 'read' ? '✓✓' : 
                       msg.status === 'delivered' ? '✓' : ''}
                    </span>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* input area */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#1e1f22] border border-gray-700 rounded-xl px-3 py-2">
          <button className="text-gray-400">📎</button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={message}
            onChange={(e) => setmessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1"
            onClick={handleClick}
          >
            ➤
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatWindow


