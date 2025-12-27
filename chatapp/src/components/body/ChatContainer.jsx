import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, checkOnlineStatus } from '../../../socket'
import { useDispatch, useSelector } from 'react-redux'
import { selectUserOnlineStatus } from '../../store/messagesSlice'
import { ChatWindow,VideoWindow } from '../index.js'

// Placeholder chat component


// Placeholder video call component


const ChatContainer = () => {
  const params = useParams()
  const location = useLocation()
  const friendFromState = location.state?.friend
  const friendId = params.friendId

  const socket = getSocket()
  const dispatch = useDispatch()
  const [isCalling, setIsCalling] = useState(false)

  const currentUserId = useSelector((state) => state.user.userinfo.id)
  const isFriendOnline = useSelector((state) =>
    friendId ? selectUserOnlineStatus(state, friendId) : null
  )
  
  const friend = useMemo(() => {
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])


  // Check online status when friend changes

//  useEffect(() => {
//   if (friendId && socket?.connected) {
//     selectUserOnlineStatus()
//   }
// }, [friendId, socket])


  return (
    <section className="h-full flex flex-col bg-[#313338] text-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold">
            {(friend.username || '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {friend.username || 'Friend'}
              <button
                onClick={() => setIsCalling(true)}
                className="text-sm bg-green-600 hover:bg-green-500 px-2 py-1 rounded"
              >
                📹
              </button>
            </div>
            <div className="text-xs text-gray-400">{isFriendOnline}</div>
          </div>
        </div>
      </div>

      {/* Conditional rendering: Video or Chat */}
      {isCalling ? (
        <VideoWindow onEndCall={() => setIsCalling(false)} />
      ) : (
       <ChatWindow />
      )}
    </section>
  )
}

export default ChatContainer
