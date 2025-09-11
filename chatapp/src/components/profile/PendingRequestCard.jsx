import React from 'react'

const PendingRequestCard = ({ request, onAccept=(id)=>{}, onReject=(id)=>{} }) => {
 
  return (
    <div className="flex items-center justify-between bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
      <div>
        <div className="font-semibold">{request.username}</div>
        <div className="text-sm text-gray-400">{request.email}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
        >
          Accept
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default PendingRequestCard
