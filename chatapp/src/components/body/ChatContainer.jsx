import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getSocket, checkOnlineStatus } from '../../../socket'
import { useDispatch, useSelector } from 'react-redux'
import { selectUserOnlineStatus } from '../../store/messagesSlice'
import { ChatWindow,IncomingCall,VideoWindow } from '../index.js'
import { setCallingState } from '../../store/userSlice.js'

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
  const [incomingCall,setIncomingCall]=useState(false)
  const callOffer=useSelector((state)=>state.user.callOffer);
  const callingState=useSelector((state)=>state.user.callingState);
  const UserId = useSelector((state) => state.user.userinfo.id)
  const isFriendOnline = useSelector((state) =>
    friendId ? selectUserOnlineStatus(state, friendId) : null
  )
  
  const friend = useMemo(() => {
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])

  useEffect(()=>{
     if(callingState.callState=="ringing")
     {
      setIncomingCall(true);
     }
     else
     {
      setIncomingCall(false);
     }

     return ()=>{
      setIncomingCall(false);

     }
  },[callOffer])
  
  useEffect(()=>{
     if(callingState.didICall==false&&callingState.callState=="onCall")
     {
      setIsCalling(true);
     }
     
  },[callingState])

  // Check online status when friend changes

//  useEffect(() => {
//   if (friendId && socket?.connected) {
//     selectUserOnlineStatus()
//   }
// }, [friendId, socket])



const handleClickCall=() => {
  if(isCalling)//duplicate button click on call
  {
    return;
  }
  dispatch(setCallingState({"callState":"calling","didICall":true}));
  setIsCalling(true)
  
}

  return (
    <section className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 text-slate-50 overflow-hidden">
      <div
        className={`
          fixed top-4 right-4 z-50
          transition-all duration-300 ease-out
          ${incomingCall
            ? "translate-y-0 opacity-100"
            : "-translate-y-20 opacity-0 pointer-events-none"}
        `}
      >
        <IncomingCall />
      </div>

      {/* Header */}
      <div className="px-4 py-4 backdrop-blur-lg bg-white/5 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
            {(friend.username || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-2 text-slate-100">
              {friend.username || 'Friend'}
              <button
                onClick={handleClickCall}
                className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30"
              >
                📹 Call
              </button>
            </div>
            <div className={`text-xs font-medium ${isFriendOnline === "Online" ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isFriendOnline === "Online" ? '🟢 Online' : '🔴 Offline'}
            </div>
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
