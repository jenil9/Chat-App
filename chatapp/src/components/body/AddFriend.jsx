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
          body: JSON.stringify({ code }),
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
    <div className="h-full w-full flex items-center justify-center min-h-full bg-[#0d1117] p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-8 animate-scale-in">
          <h1 className="text-slate-100 text-xl font-semibold mb-1">Add a Friend</h1>
          <p className="text-slate-400 text-sm mb-6">
            Enter their friend code to send a request.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col">
            <label className="block text-[12px] text-slate-500 uppercase tracking-wider mb-2">
              Friend code
            </label>
            <input
              className="w-full bg-[#1c2128] border border-white/[0.08] focus:border-blue-500/50 rounded-lg px-4 py-3 text-slate-100 text-base font-mono tracking-[0.15em] uppercase placeholder:text-slate-600 outline-none transition-colors duration-150"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 text-sm font-semibold transition-colors duration-150 mt-4"
              type="submit"
            >
              Send Request
            </button>
          </form>

          {status && (
            <p className={`mt-3 text-sm ${
              status.includes('sent') 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddFriend
