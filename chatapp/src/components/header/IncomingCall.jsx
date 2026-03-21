import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCallingState, setCallOffer } from '../../store/userSlice';
import { getSocket } from '../../socket';
import { useNavigate } from 'react-router-dom';

const IncomingCall = () => {
  const callOffer=useSelector((state)=>state.user.callOffer)
  const dispatch=useDispatch();
  const socket=getSocket();
  const user=useSelector((state)=>state.user.userinfo)
  const navigate = useNavigate(); 
  
  const handleAccept = () => {
    dispatch(setCallingState({ callState: "onCall", didICall: false }));
    dispatch(setCallOffer({}));
    navigate(`/friends/${callOffer.callerId}`);

    setTimeout(() => {
      socket.emit("call-accept", {
        callerId: callOffer.callerId,
        receiverId: user.id
      });
    }, 50);
  };
  const handleReject = () => {
    dispatch(setCallOffer({}));
    dispatch(setCallingState({ callState: "idle", didICall: false }));
    socket.emit("call-reject", {
      callerId: callOffer.callerId,
      receiverId: user.id
    });
  };
  return (
    <div
      className="fixed top-4 right-4 z-50 w-72 bg-[#1c2128] border border-white/[0.08] rounded-xl p-4 shadow-2xl shadow-black/60 animate-slide-up"
    >
      {/* Title */}
      <div className="text-[11px] uppercase tracking-widest text-blue-400 font-medium mb-3">
        Incoming Call
      </div>

      {/* Caller Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#2d333b] text-slate-300 text-sm font-semibold flex items-center justify-center flex-shrink-0">
          {callOffer.callerName ? callOffer.callerName.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex flex-col">
          <span className="text-slate-100 text-[14px] font-semibold">{callOffer.callerName}</span>
          <span className="text-slate-500 text-[12px]">Video calling...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 h-9 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm transition-colors duration-150"
          onClick={handleReject}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 h-9 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors duration-150"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default IncomingCall