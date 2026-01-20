import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCallingState, setCallOffer } from '../../store/userSlice';
import { getSocket } from '../../../socket';
import { useNavigate } from 'react-router-dom';

const IncomingCall = () => {
  const callOffer=useSelector((state)=>state.user.callOffer)
  const dispatch=useDispatch();
  const socket=getSocket();
  const user=useSelector((state)=>state.user.userinfo)
  const navigate = useNavigate(); // FIXED: Move hook to top level
  
  const handleAccept=()=>{
    dispatch(setCallingState({"callState":"onCall","didICall":false}));
    dispatch(setCallOffer({}));
    socket.emit("call-accept",{"callerId":callOffer.callerId,"receiverId":user.id})
    console.log("call accept")
    navigate('/friends/'+callOffer.callerId) // FIXED: Use navigate, not useNavigate()
    
  }
  const handleReject=()=>{
   dispatch(setCallOffer({}))
   dispatch(setCallingState({"callState":"idle","didICall":false}));
   socket.emit("call-reject",{"callerId":callOffer.callerId,"receiverId":user.id})
  }
  return (
    <div
      className="
        w-72
        rounded-xl
        bg-[#1e1f22]
        border border-gray-700
        shadow-2xl
        p-4
        text-gray-200
        flex flex-col gap-3
      "
    >
      {/* Title */}
      <div className="text-sm font-semibold tracking-wide">
        Incoming Call
      </div>

      {/* Caller Info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-medium">{callOffer.callerName}</span>
          <span className="text-xs text-gray-400">Video calling…</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          className="
            px-3 py-1.5 text-sm
            rounded-md
            bg-gray-600 hover:bg-gray-500
            transition
          "
          onClick={handleReject}
        >
          Reject
        </button>
        <button
          onClick={handleAccept}
          className="
            px-3 py-1.5 text-sm
            rounded-md
            bg-green-600 hover:bg-green-500
            transition
          "
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default IncomingCall