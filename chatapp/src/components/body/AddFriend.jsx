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
    <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950 text-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="backdrop-blur-2xl bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-scale-in">
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Add a Friend</h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter their friend code to send a request.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <input
              className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10 uppercase tracking-widest font-mono text-lg"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
              type="submit"
            >
              Send Request
            </button>
          </form>

          {status && (
            <div className={`mt-4 p-3 rounded-xl text-sm font-medium backdrop-blur-lg ${
              status.includes('sent') 
                ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300' 
                : 'bg-red-500/20 border border-red-400/30 text-red-300'
            }`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddFriend
