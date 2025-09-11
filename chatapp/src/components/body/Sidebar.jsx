import React from 'react'
import { useSelector } from 'react-redux'
import noFriendsAnimation from '../../animations/No Data Available.json'
import Lottie from 'lottie-react'

const Sidebar = () => {
  return (
    <aside className="h-full flex flex-col bg-[#2b2d31] text-gray-200">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">A</div>
          <div>
            <div className="font-semibold">{useSelector((state)=>state.user.userinfo.username)}</div>
            <div className="text-xs text-gray-400">online</div>
          </div>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none"
            
          />
        </div>
      </div>

      {/* Empty friends area for future list */}
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <Lottie animationData={noFriendsAnimation} style={{ height: 300, width: 300 }} />
      <h2 style={{ marginTop: 20, fontSize: "1.5rem" }}>No friends yet!</h2>
      <p>Share your unique code to add friends.</p>
      </div>
    </aside>
  )
}

export default Sidebar


