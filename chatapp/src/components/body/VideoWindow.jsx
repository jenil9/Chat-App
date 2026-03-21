import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSocket } from '../../socket'
import {Camera,Mic,MicOff} from "lucide-react"
import { useSelector,useDispatch } from 'react-redux'
import { setCallingState } from '../../store/userSlice'
import RTC from '../../sevices/RTC'
import Lottie from "lottie-react";
import callingAnim from "../../assets/calling.json";
import offlineAnim from "../../assets/offline.json";

const VideoWindow = ({ onEndCall }) => {
  const { friendId } = useParams()
  const dispatch = useDispatch();
  const socket = getSocket();
  const userId = useSelector((state) => state.user.userinfo.id);
  const callingState = useSelector((state) => state.user.callingState);
  const callSentRef = useRef(false);
  const [friendState,setFriendState]=useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
const [remoteMuted, setRemoteMuted] = useState(false);


  const showCallingUI =
  callingState.callState === "calling" &&
  callingState.didICall === true &&
  friendState === "online";

  
  let pcRef=useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const handleEndCallClick = () => {
    socket.emit("end-call", {
      callerId: userId,
      receiverId: friendId
    });

    dispatch(setCallingState({ callState: "idle", didICall: false }));

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    onEndCall();
  };

  useEffect(() => {
    if (callingState.didICall === true) {
      socket.emit("call-request", { callerId: userId, receiverId: friendId });
    } else {
      setFriendState("online");
    }

     const handleCallRequestResponse = ({ response }) => {
       if (response === "online") {
        setFriendState("online");
       } else if (response === "offline") {
        setFriendState("offline");
       } else if (response === "onOtherCall") {
        setFriendState("onOtherCall");
       }
     };
 const initRTC = async () => {
  if (pcRef.current) return;

  pcRef.current = new RTC(
    socket,
    userId,
    friendId,
    (stream) => {
      if (!remoteVideoRef.current) return;

      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setRemoteCameraOff(!videoTrack.enabled);
        videoTrack.onmute = () => setRemoteCameraOff(true);
        videoTrack.onunmute = () => setRemoteCameraOff(false);
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        setRemoteMuted(!audioTrack.enabled);
        audioTrack.onmute = () => setRemoteMuted(true);
        audioTrack.onunmute = () => setRemoteMuted(false);
      }
    }
  );

  await pcRef.current.getStreams();
  await pcRef.current.createConnection();

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = pcRef.current.localStream;
  }
};

     const handleCallRejected = ({ callerId, receiverId }) => {
       if (receiverId !== friendId) return;
       dispatch(setCallingState({ callState: "idle", didICall: false }));
       onEndCall();
     }

    const handleCallAccepted = async ({ callerId, receiverId }) => {
      dispatch(setCallingState({ callState: "onCall", didICall: true }));
      setFriendState("onCall");

      // ✅ Create peer connection and offer
      try {
        await initRTC();
        await pcRef.current.createOffer({
          callerId: userId,
          receiverId: friendId
        });
      } catch (err) {
        console.error("Error in call-accepted:", err);
      }
    };

    const handleNewOffer = async (offerPack) => {
      try {
        await initRTC();
        await pcRef.current.setRemoteOffer(offerPack.offer);
        await pcRef.current.answerOffer();
        dispatch(setCallingState({ callState: "onCall", didICall: false }));
        setFriendState("onCall");
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleIceCandidate = (iceCandidate) => {
      if (!pcRef.current) return;
      pcRef.current.addNewIceCandidate(iceCandidate);
    };

    const handleAnswerResponse = async (offerObj) => {
      if (pcRef.current) {
        await pcRef.current.addAnswer(offerObj.offer);
      }
    };

    const handleEndCall = ({ callerId, receiverId }) => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      dispatch(setCallingState({ callState: "idle", didICall: false }));
      onEndCall();
    }

    const handleRemoteMicToggle = ({ isMuted }) => {
      setRemoteMuted(isMuted);
    };

    const handleRemoteCameraToggle = ({ cameraOff }) => {
      setRemoteCameraOff(cameraOff);
    };

    socket.on("call-request-response", handleCallRequestResponse);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("newOffer", handleNewOffer);
    socket.on("receivedIceCandidateFromServer", handleIceCandidate);
    socket.on("answerresponse", handleAnswerResponse);
    socket.on("end-call", handleEndCall);
    socket.on("mic-toggle", handleRemoteMicToggle);
    socket.on("camera-toggle", handleRemoteCameraToggle);

    return () => {
      socket.off("call-request-response", handleCallRequestResponse);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("newOffer", handleNewOffer);
      socket.off("receivedIceCandidateFromServer", handleIceCandidate);
      socket.off("answerresponse", handleAnswerResponse);
      socket.off("end-call", handleEndCall);
      socket.off("mic-toggle", handleRemoteMicToggle);
      socket.off("camera-toggle", handleRemoteCameraToggle);
    };
  }, []);
  
  useEffect(() => {
    if (friendState === null) return;
    if (friendState === "offline" || friendState === "onOtherCall") return;
    if (friendState === "onCall") return;

    if (callingState.didICall === true && !callSentRef.current) {
      socket.emit("call-send", {
        callerId: userId,
        receiverId: friendId
      });
      callSentRef.current = true;
    }
  }, [friendState, callingState.didICall]);

  const handleMicToggle = () => {
  if (!pcRef.current?.localStream) return;

  const audioTracks = pcRef.current.localStream.getAudioTracks();

  audioTracks.forEach((track) => {
    track.enabled = isMuted;
  });

  setIsMuted(!isMuted);

  socket.emit("mic-toggle", {
    callerId: userId,
    receiverId: friendId,
    isMuted: !isMuted
  });
};

  const handleCameraToggle = () => {
  if (!pcRef.current?.localStream) return;

  const videoTracks = pcRef.current.localStream.getVideoTracks();

  videoTracks.forEach((track) => {
    track.enabled = cameraOff;
  });

  setCameraOff(!cameraOff);

  socket.emit("camera-toggle", {
    callerId: userId,
    receiverId: friendId,
    cameraOff: !cameraOff
  });
};

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[#0d1117]">
      
      {/* Video Stage */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Remote Video */}
        {/* ================= REMOTE VIDEO ================= */}
       
         {/* ================= REMOTE VIDEO STAGE ================= */}
<div className="absolute inset-0 bg-[#0d1117]">

  {/* Remote Video (always mounted) */}
  <video
    ref={remoteVideoRef}
    autoPlay
    playsInline
    className={`w-full h-full object-cover ${
      friendState === "onCall" && !remoteCameraOff ? "block" : "hidden"
    }`}
  />

  {/* Avatar when remote camera is OFF */}
  {friendState === "onCall" && remoteCameraOff && (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] animate-fade-in">
      <img
        src={`https://api.dicebear.com/9.x/identicon/svg?seed=${friendId}`}
        className="w-32 h-32 rounded-full"
        alt="Remote avatar"
      />
    </div>
  )}

  {/* Remote mic muted indicator */}
  {friendState === "onCall" && remoteMuted && (
    <div className="absolute top-4 right-4 bg-red-500/20 border border-red-400/50 p-3 rounded-full z-10">
      <MicOff className="w-5 h-5 text-red-400" />
    </div>
  )}

  {/* OFFLINE STATE */}
  {friendState === "offline" && (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d1117] animate-fade-in">

    <Lottie
      animationData={offlineAnim}
      loop
      className="w-40 opacity-40"
    />

    <p className="mt-4 text-sm text-slate-400 font-medium">
      User is offline
    </p>

    <p className="text-xs text-slate-600">
      Try again later
    </p>
  </div>
)}
 {showCallingUI && (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] overflow-hidden animate-fade-in">

    {/* Animated background gradient */}
    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
      <div className="absolute w-96 h-96 bg-blue-500/50 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
    </div>

    {/* Lottie Animation */}
    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
      <div className="w-full h-full max-w-[600px] max-h-[600px]">
        <Lottie
          animationData={callingAnim}
          loop
          className="w-full h-full"
        />
      </div>
    </div>

    {/* Text */}
    <div className="relative z-10 text-center">
      <p className="text-2xl font-bold tracking-wide text-slate-50">
        Calling<span className="animate-pulse">…</span>
      </p>

      <p className="mt-2 text-sm text-slate-400">
        Waiting for them to answer
      </p>
    </div>
  </div>
)}



  {/* ON OTHER CALL STATE */}
  {friendState === "onOtherCall" && (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d1117] animate-fade-in">

    {/* Avatar */}
    <div className="relative">
      {/* busy ring */}
      <div className="absolute inset-0 rounded-full border-2 border-orange-400/50 animate-pulse-slow scale-110"></div>

      <div className="relative w-20 h-20 rounded-full bg-orange-600 border border-white/[0.08] flex items-center justify-center text-white text-2xl font-bold" />
    </div>

    {/* Status */}
    <p className="mt-6 text-base font-semibold text-slate-100">
      On another call
    </p>

    <p className="mt-2 text-xs text-slate-400 text-center max-w-[220px] leading-relaxed">
      They’re currently busy.  
      Please try again in a moment.
    </p>
  </div>
)}

</div>

        


        {/* Local Video (Floating) */}
        <div className="absolute bottom-8 left-8 w-[22%] min-w-[180px] aspect-video rounded-lg border border-white/[0.08] overflow-hidden bg-[#0d1117] animate-slide-up">
          <div className="relative w-full h-full">
            {callingState.callState === "calling" ? (
              /* ===== CALLING ===== */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]">
                <div className="w-20 h-20 rounded-full bg-[#2d333b] flex items-center justify-center text-white text-3xl font-bold" />
               
              </div>
            ) : callingState.callState === "offline" ? (
              /* ===== OFFLINE ===== */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-red-400">Offline</p>
              </div>
            ) : (
              /* ===== ON CALL ===== */
              <>
                {/* Video always in DOM - just hidden */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${cameraOff ? 'hidden' : ''}`}
                />
                
                {/* Avatar shown when camera is off */}
                {cameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
                    <img
                      src={`https://api.dicebear.com/9.x/identicon/svg?seed=${Math.random()}`}
                      className="w-16 h-16 rounded-full"
                      alt="avatar"
                    />
                  </div>
                )}
              </>
            )}

            {/* ===== MIC OFF OVERLAY ===== */}
            {isMuted && (
              <div className="absolute top-2 right-2 bg-red-500/20 border border-red-400/50 p-1.5 rounded-full">
                <MicOff className="w-4 h-4 text-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Controls */}
      <div className="bg-[#161b22] border-t border-white/[0.08] py-4 flex items-center justify-center gap-4">
        
        {/* Mute */}
        <button 
          onClick={handleMicToggle}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-150 ${
            isMuted 
              ? 'bg-white/90 border-white/20 text-[#0d1117]' 
              : 'bg-[#1c2128] border-white/[0.08] text-slate-300 hover:bg-[#2d333b]'
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Camera */}
        <button 
          onClick={handleCameraToggle}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-150 ${
            cameraOff 
              ? 'bg-white/90 border-white/20 text-[#0d1117]' 
              : 'bg-[#1c2128] border-white/[0.08] text-slate-300 hover:bg-[#2d333b]'
          }`}
        >
          <Camera size={22} />
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCallClick}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white border-none flex items-center justify-center transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default VideoWindow


