import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const AddFriend = () => {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const user = useSelector((state) => state.user.userinfo)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()

    if (!code.trim()) {
      setStatus('Enter a valid code')
    } else {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/friend/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ myId: user.id, code }),
          credentials: 'include',
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus(data.message || 'Error sending request')
          return
        }

        setStatus('Friend request sent')
        navigate('/')
      } catch (err) {
        console.error(err)
        setStatus('Something went wrong')
      }
    }
  }

  return (
    <div className="h-full w-full bg-[#313338] text-gray-200 p-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-5">
          <div className="text-lg font-semibold">Add a Friend</div>
          <div className="text-sm text-gray-400 mt-1">
            Enter their friend code to send a request.
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
            <input
              className="flex-1 bg-[#2b2d31] border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none"
              placeholder="XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm"
              type="submit"
            >
              Send
            </button>
          </form>

          {status && <div className="mt-3 text-xs text-gray-400">{status}</div>}
        </div>
      </div>
    </div>
  )
}

export default AddFriend
