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
    <section className="h-full w-full flex flex-col bg-[#0d1117] text-slate-50 overflow-hidden">
      {/* messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0 w-full" ref={containerref} onScroll={handleScroll}>
        <div ref={messagesTopRef} />
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#1c2128] border border-white/[0.08] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-slate-400 mb-2">No messages yet</h3>
              <p className="text-slate-600 text-sm max-w-xs">Start a conversation by sending your first message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currmsg.map((msg, index) => {
              const isMe = msg.senderId === currentUserId
              const prevSameSender = index > 0 && currmsg[index - 1]?.senderId === msg.senderId
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${prevSameSender ? 'mt-0.5' : 'mt-2'} animate-slide-up`}
                >
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full bg-[#2d333b] text-slate-400 text-[10px] font-semibold mr-2 flex-shrink-0 flex items-center justify-center ${prevSameSender ? 'invisible' : ''}`} />
                  )}
                  <div
                    className={`break-words overflow-hidden ${
                      isMe
                        ? 'msg-bubble-sent px-3.5 py-2 max-w-[65%]'
                        : 'msg-bubble-recv px-3.5 py-2 max-w-[65%]'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">{msg.text}</div>
                    <div className={`text-[11px] mt-1 ${
                      isMe ? 'text-blue-200/50 text-right' : 'text-slate-600'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {isMe && (
                        <span className="ml-1">
                          {msg.status === 'read' ? '✓✓' : 
                           msg.status === 'delivered' ? '✓' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* input area */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-[#161b22] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#1c2128] border border-white/[0.08] focus-within:border-blue-500/40 rounded-2xl px-3 py-1.5 transition-colors duration-150">
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 flex items-center justify-center flex-shrink-0 transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <textarea
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm placeholder:text-slate-600 resize-none py-2 max-h-24"
            value={message}
            onChange={(e) => setmessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button 
            className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleClick}
            disabled={!message.trim()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatWindow