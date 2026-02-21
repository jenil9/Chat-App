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
      className="w-80 rounded-2xl backdrop-blur-2xl bg-slate-800/40 border border-slate-700/50 shadow-2xl shadow-black/50 p-6 text-slate-50 flex flex-col gap-4 animate-slide-up"
    >
      {/* Title */}
      <div className="text-sm font-semibold tracking-wide text-cyan-400">
        📞 Incoming Call
      </div>

      {/* Caller Info */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg">
          {callOffer.callerName ? callOffer.callerName.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-100">{callOffer.callerName}</span>
          <span className="text-xs text-slate-400">📹 Video calling...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          onClick={handleReject}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default IncomingCall