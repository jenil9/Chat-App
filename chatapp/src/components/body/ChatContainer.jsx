import React, { useMemo, useState, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { getSocket, checkOnlineStatus } from '../../socket'
import { useDispatch, useSelector } from 'react-redux'
import { selectUserOnlineStatus } from '../../store/messagesSlice'
import { useSidebar } from '../../context/SidebarContext'
import { ChatWindow, IncomingCall, VideoWindow } from '../index.js'
import { setCallingState } from '../../store/userSlice.js'

const ChatContainer = () => {
  const params = useParams()
  const location = useLocation()
  const { onMenuClick } = useSidebar() || {}
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

  const handleClickCall = () => {
    if (isCalling) return;
    dispatch(setCallingState({ callState: "calling", didICall: true }));
    setIsCalling(true);
  };

  return (
    <section className="h-full min-h-0 flex flex-col bg-[#0d1117] text-slate-50 overflow-hidden">
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

      {/* Header - sticky on mobile, always visible, does not scroll with messages */}
      <div className="sticky top-0 z-10 bg-[#161b22] border-b border-white/[0.08] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Hamburger to open sidebar on mobile */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-colors duration-150"
              aria-label="Open chat list"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-[#2d333b] flex items-center justify-center text-sm font-semibold text-slate-300 flex-shrink-0">
            {(friend.username || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold flex items-center gap-2 text-slate-100">
              {friend.username || 'Friend'}
              <button
                onClick={handleClickCall}
                className="border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 flex items-center gap-1.5"
              >
                📹 Call
              </button>
            </div>
            <div className={`text-[12px] ${isFriendOnline === "Online" ? 'text-green-400' : 'text-slate-500'}`}>
              {isFriendOnline === "Online" ? 'Online' : 'Offline'}
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
