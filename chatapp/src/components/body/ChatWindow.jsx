import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, sendMessage, markMessagesAsRead, loadMessages, checkOnlineStatus } from '../../../socket'
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
    <section className="h-full flex flex-col bg-[#313338] text-gray-200 overflow-hidden">
      {/* messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0 max-h-full" ref={containerref} onScroll={handleScroll}>
        <div ref={messagesTopRef} />
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currmsg.map((msg) => (
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