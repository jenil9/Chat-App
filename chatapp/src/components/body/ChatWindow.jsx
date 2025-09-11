import React from 'react'

const ChatWindow = () => {
  return (
    <section className="h-full flex flex-col bg-[#313338] text-gray-200">
      {/* conversation header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold">AL</div>
          <div>
            <div className="font-semibold">Alice Johnson</div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">2:30 PM</div>
      </div>

      {/* empty messages area (design only) */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center text-gray-400 text-sm">
          This is the conversation area. Add your messages here later.
        </div>
      </div>

      {/* input area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2 bg-[#1e1f22] border border-gray-700 rounded-xl px-3 py-2">
          <button className="text-gray-400">📎</button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm"
            readOnly
          />
          <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1">➤</button>
        </div>
      </div>
    </section>
  )
}

export default ChatWindow


