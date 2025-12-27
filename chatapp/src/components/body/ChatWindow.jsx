import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, sendMessage, markMessagesAsRead, loadMessages, checkOnlineStatus } from '../../../socket'
import { useDispatch, useSelector } from 'react-redux'
import { selectMessagesForFriend, selectUserOnlineStatus,markMessagesAsReadForFriend } from '../../store/messagesSlice'

const ChatWindow = () => {
  const params = useParams()
  const location = useLocation()
  const friendFromState = location.state?.friend
  const friendId = params.friendId
  const [message, setmessage] = useState("")
  const messagesEndRef = useRef(null)
  const messagesTopRef = useRef(null);
  const containerref = useRef(null);
  const socket = getSocket();
  const dispatch=useDispatch();

  const prevScrollHeightRef = useRef(0);


  const [cnt,setCnt]=useState(1);
  const currmsg=[];
  
  
  const currentUserId = useSelector((state) => state.user.userinfo.id)
  const messages = useSelector((state) => selectMessagesForFriend(state, friendId))
  const isFriendOnline = useSelector((state) => selectUserOnlineStatus(state, friendId))
  let i=0;
  while(i<messages.length && i<cnt*10){//pagination need to do to get only display message from backend rather than all messages
    currmsg.unshift(messages[messages.length-i-1]);
    i++;
  }

  const friend = useMemo(() => {
    // Prefer routed state; fallback to minimal friend object from URL
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [friendId])

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [messages])

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
          dispatch(markMessagesAsReadForFriend(friendId))
        }
      }
    }
    
    // Add a small delay to ensure messages are fully loaded
    const timeoutId = setTimeout(markAsRead, 100)
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    
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

  useEffect(() => {
    const container = containerref.current;
    if (!container) return;
  
    const oldScrollHeight = prevScrollHeightRef.current;
    if (!oldScrollHeight) return;
  
    const newScrollHeight = container.scrollHeight;
  
    // maintain position
    container.scrollTop = newScrollHeight - oldScrollHeight;
  }, [cnt]);//useEffect always runs after React has committed changes to the DOM and the browser has painted the screen.
  //as we need to maintain the position of the scroll bar after loading messages only
  

  const handleClick = () => {
    if (message.trim().length === 0) {
      return
    }
    
    // Clear input immediately for better UX
    const messageText = message
    setmessage("")
    
    // Send message
    sendMessage(currentUserId, friendId, messageText)
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)//as dom updation is slow
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleClick()
    }
  }
  const handleScroll = () => {
    const container = containerref.current;
    if (!container) return;
  
    if (container.scrollTop === 0) {
      // store height BEFORE loading more
      prevScrollHeightRef.current = container.scrollHeight;
      setCnt(prev => prev + 1);
    }//if we adjust scroll here it will be problem as dom is not yet updated and positon of scroll is adjusted just after message kept
  };
  
  
  return (
    <section className="h-full flex flex-col bg-[#313338] text-gray-200 overflow-hidden">
      {/* conversation header */}
     

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


