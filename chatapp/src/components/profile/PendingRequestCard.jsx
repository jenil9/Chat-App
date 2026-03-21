import React from 'react'

const PendingRequestCard = ({ request, onAccept=(id)=>{}, onReject=(id)=>{} }) => {
 
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-[#1c2128] border border-white/[0.08] rounded-lg animate-slide-up">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#2d333b] text-slate-300 text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {request.username ? request.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="min-w-0">
          <div className="text-slate-200 text-[14px] font-medium truncate">{request.username}</div>
          <div className="text-sm text-slate-400 truncate">{request.email}</div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0 ml-4">
        <button
          onClick={() => onAccept(request.id)}
          className="bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-md px-3 py-1.5 transition-colors duration-150"
        >
          Accept
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 text-xs rounded-md px-3 py-1.5 transition-colors duration-150"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default PendingRequestCard
