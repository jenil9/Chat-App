import React, { useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { getSocket } from '../../../socket'
import RTC from '../../sevices/RTC'

const VideoWindow = ({ onEndCall }) => {
  const params = useParams()
  const location = useLocation()
  const friendId = params.friendId
  const socket = getSocket()
  
  // Use useRef to store persistent RTC instance
  const rtcRef = useRef(null)

  const friend = useMemo(() => {
    // Prefer routed state; fallback to minimal friend object from URL
    if (friendFromState) return friendFromState
    return { id: friendId, username: 'Friend', email: '' }
  }, [friendFromState, friendId])

  useEffect(() => {
    if (friendId && socket && socket.connected) {
      checkOnlineStatus(friendId);
    }
  }, [friendId, socket])

  useEffect(() => {
    if (!socket) return

    rtcRef.current = new RTC(socket)
    rtcRef.current.createConnection()

    // Make offer when component mounts (caller side)
    ;(async () => {
      const offer = await rtcRef.current.createOffer()///issue if user accept incoming call useeffect run and again new connection think of it
      socket.emit("offer", { to: friendId, sdp: offer })
    })()

    // Handle incoming offer
    socket.on("offer", async (data) => {
      const answer = await rtcRef.current.handleOffer(data)
      socket.emit("answer", { to: data.from, sdp: answer })
    })

    // Handle incoming answer
    socket.on("answer", (data) => {
      rtcRef.current.handleAnswer(data)
    })

    // Handle ICE candidates
    socket.on("candidate", (data) => {
      rtcRef.current.addIceCandidate(data.candidate)
    })

    return () => {
      socket.off("offer")
      socket.off("answer")
      socket.off("candidate")
    }
  }, [socket, friendId])

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white">
      <p>Video call with friendId: {friendId}</p>
      <button
        className="mt-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
        onClick={onEndCall}
      >
        End Call
      </button>
    </div>
  )
}

export default VideoWindow
