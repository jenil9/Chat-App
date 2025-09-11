import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PendingRequestCard } from '../index'

const ProfileView = () => {
  const user = useSelector((state) => state.user.userinfo || {})
  const { name, email, friendCode } = user
  const [pendingRequests, setpendingRequests] = useState([])
  const [failmsg, setfailmsg] = useState("")

  const handleAccept = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/friend/accept`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meid: user.id, requesterid: id }),
        credentials: 'include',
      })
  
      const data = await res.json()   // parse after checking res.ok
      if (!res.ok) {
        setfailmsg(data.message || "Failed to accept request")
        return
      }
  
      // success
      setpendingRequests(prev => prev.filter(req => req.id !== id))
    } catch (err) {
      setfailmsg("Something went wrong")
    }
  }
  
  const handleReject = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/friend/reject`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meid: user.id, requesterid: id }),
        credentials: 'include',
      })
  
      const data = await res.json()
      if (!res.ok) {
        setfailmsg(data.message || "Failed to reject request")
        return
      }
  
      setpendingRequests(prev => prev.filter(req => req.id !== id))
    } catch (err) {
      setfailmsg("Something went wrong")
    }
  }
  

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/friend/pendingRequest/${user.id}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )
        if (!res.ok) {
          setfailmsg("Something went wrong")
          return
        }
        setpendingRequests(await res.json())
      } catch (err) {
        setfailmsg("Failed to get requests, try reloading the page")
      }
    }

    if (user?.id) {
      fetchRequests()
    }
  }, [user?.id])

  return (
    <div className="h-full w-full bg-[#313338] text-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-xl font-semibold">
            {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="text-2xl font-semibold">{name || 'Your Name'}</div>
            <div className="text-sm text-gray-400">{email || 'you@example.com'}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400">Friend Code</div>
            <div className="mt-1 text-lg font-semibold tracking-widest">{friendCode || 'XXXX-XXXX'}</div>
            <div className="mt-2 text-xs text-gray-400">Share this code so others can add you.</div>
          </div>

          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400">Profile Picture</div>
            <div className="mt-2 h-28 rounded-lg bg-[#2b2d31] flex items-center justify-center text-gray-500 text-sm">Upload UI later</div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Pending Friend Requests</h2>
          {failmsg && <div className="text-red-400 text-sm mb-3">{failmsg}</div>}
          <div className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => (
                <PendingRequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            ) : (
              <div className="text-gray-400 text-sm">No pending requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
