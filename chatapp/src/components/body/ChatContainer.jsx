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

     return ()=>{
      setIncomingCall(false);

     }
  },[callOffer])
  
  useEffect(()=>{
     if(callingState.callState=="onCall")
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
    <section className="h-full flex flex-col bg-[#313338] text-gray-200 overflow-hidden">
      <div
  className={`
    fixed top-4 right-4 z-50
    transition-all duration-300 ease-out
    ${incomingCall
      ? "translate-y-0 opacity-100"
      : "-translate-y-20 opacity-0 pointer-events-none"}
  `}
><IncomingCall /></div>
{/* <button onClick={()=>{setIncomingCall(true)}}>aa</button> */}
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
                onClick={handleClickCall}
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
