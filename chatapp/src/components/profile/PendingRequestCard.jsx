import React from 'react'

const PendingRequestCard = ({ request, onAccept=(id)=>{}, onReject=(id)=>{} }) => {
 
  return (
    <div className="flex items-center justify-between backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg hover:bg-white/10 transition-all duration-300 animate-slide-up">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {request.username ? request.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-100 truncate">{request.username}</div>
          <div className="text-sm text-slate-400 truncate">{request.email}</div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0 ml-4">
        <button
          onClick={() => onAccept(request.id)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Accept
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default PendingRequestCard
