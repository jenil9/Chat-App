import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, sendMessage, markMessagesAsRead, loadMessages, checkOnlineStatus } from '../../socket'
import { useDispatch, useSelector } from 'react-redux'
import { selectMessagesForFriend, selectUserOnlineStatus, markMessagesAsReadForFriend } from '../../store/messagesSlice'

const ChatWindow = () => {
  const params = useParams()
  const location = useLocation()
  const friendFromState = location.state?.friend
  const friendId = params.friendId
  const [message, setmessage] = useState("")
  const messagesEndRef = useRef(null)
  const messagesTopRef = useRef(null)
  const containerref = useRef(null)
  const socket = getSocket()
  const dispatch = useDispatch()

  const prevScrollHeightRef = useRef(0)
  const prevMessagesLengthRef = useRef(0)
  const isLoadingMoreRef = useRef(false)

  const [cnt, setCnt] = useState(1)
  const currmsg = []
  
  const currentUserId = useSelector((state) => state.user.userinfo.id)
  const messages = useSelector((state) => selectMessagesForFriend(state, friendId))
  const isFriendOnline = useSelector((state) => selectUserOnlineStatus(state, friendId))
  
  let i = 0
  while (i < messages.length && i < cnt * 10) {
    currmsg.unshift(messages[messages.length - i - 1])
    i++
  }

  const friend = useMemo(() => {
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])

  // Scroll to bottom when friend changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    prevMessagesLengthRef.current = messages.length
  }, [friendId])

  // Handle scroll position when messages change
  useEffect(() => {
    const container = containerref.current
    if (!container) return

    const oldMessagesLength = prevMessagesLengthRef.current
    const newMessagesLength = messages.length

    // If loading more messages (pagination)
    if (isLoadingMoreRef.current) {
      const oldScrollHeight = prevScrollHeightRef.current
      const newScrollHeight = container.scrollHeight
      
      // Maintain scroll position
      container.scrollTop = newScrollHeight - oldScrollHeight
      isLoadingMoreRef.current = false
    } 
    // If new message arrived (messages increased)
    else if (newMessagesLength > oldMessagesLength) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      
      // Only auto-scroll if user is near bottom or if it's their own message
      const lastMessage = messages[messages.length - 1]
      if (isNearBottom || lastMessage?.senderId === currentUserId) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      }
    }

    prevMessagesLengthRef.current = newMessagesLength
  }, [messages, currentUserId])

  // Check online status when friend changes
  useEffect(() => {
    if (friendId && socket && socket.connected) {
      checkOnlineStatus(friendId)
    }
  }, [friendId, socket])

  // Load messages when chat window opens
  useEffect(() => {
    if (friendId && currentUserId) {
      loadMessages(friendId, messages.length)
    }
  }, [friendId, currentUserId])

  // Mark messages as read after messages are loaded
  useEffect(() => {
    const markAsRead = async () => {
      if (friendId && currentUserId && messages.length > 0) {
        const hasUnreadMessages = messages.some(msg => 
          msg.senderId === friendId && 
          msg.receiverId === currentUserId && 
          msg.status !== 'read'
        )
        
        if (hasUnreadMessages) {
          await markMessagesAsRead(friendId)
          dispatch(markMessagesAsReadForFriend({ friendId, currentUserId }))
        }
      }
    }
    
    const timeoutId = setTimeout(markAsRead, 100)
    return () => clearTimeout(timeoutId)
  }, [messages, friendId, currentUserId])

  // Mark messages as read when component becomes visible
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
          dispatch(markMessagesAsReadForFriend({ friendId, currentUserId }))
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
    
    const messageText = message
    setmessage("")
    
    sendMessage(currentUserId, friendId, messageText)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleClick()
    }
  }

  const handleScroll = () => {
    const container = containerref.current
    if (!container) return
  
    if (container.scrollTop === 0) {
      // Store height BEFORE loading more
      prevScrollHeightRef.current = container.scrollHeight
      isLoadingMoreRef.current = true
      loadMessages(friendId, messages.length)
      setCnt(prev => prev + 1)
    }
  }
  
  return (
    <section className="h-full w-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 text-slate-50 overflow-hidden">
      {/* messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0 w-full" ref={containerref} onScroll={handleScroll}>
        <div ref={messagesTopRef} />
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center">
              <div className="w-24 h-24 backdrop-blur-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">No messages yet</h3>
              <p className="text-slate-400 mb-6 max-w-sm">Start a conversation by sending your first message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currmsg.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                {msg.senderId !== currentUserId && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mr-2 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/30" />
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl break-words overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-lg ${
                    msg.senderId === currentUserId
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-slate-50 rounded-br-md shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20'
                      : 'bg-white/5 border border-white/10 text-slate-100 rounded-bl-md shadow-lg shadow-black/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm leading-relaxed">{msg.text}</div>
                  <div className={`text-xs mt-2 font-medium ${
                    msg.senderId === currentUserId ? 'text-cyan-300' : 'text-slate-500'
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
      <div className="p-4 border-t border-slate-700/50 flex-shrink-0 backdrop-blur-lg bg-white/5">
        <div className="flex items-end gap-2">
          <button className="flex-shrink-0 w-10 h-10 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-slate-300 transition-all duration-300 hover:scale-110 active:scale-95">
            📎
          </button>
          <textarea
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-2xl text-slate-100 placeholder:text-slate-500 outline-none resize-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10 max-h-24"
            value={message}
            onChange={(e) => setmessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button 
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-110 active:scale-95 font-semibold"
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