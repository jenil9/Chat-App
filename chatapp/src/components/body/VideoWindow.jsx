import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSocket } from '../../../socket'
import {Camera,Mic,MicOff} from "lucide-react"
import { useSelector,useDispatch } from 'react-redux'
import { setCallingState } from '../../store/userSlice'
import RTC from '../../sevices/RTC'
import Lottie from "lottie-react";
import callingAnim from "../../assets/calling.json"; // download from lottiefiles
import offlineAnim from "../../assets/offline.json";

const VideoWindow = ({ onEndCall }) => {
  const { friendId } = useParams()
  const dispatch=useDispatch();
  const socket = getSocket()
  const userId=useSelector((state)=>state.user.userinfo.id)
  let callingState=useSelector((state)=>{return state.user.callingState})
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

  // ✅ Initialize RTC and get streams immediately
  // useEffect(() => {
  
  // }, []);

  useEffect(()=>{
     if(callingState.didICall==true)
     {
       socket.emit("call-request",{"callerId":userId,"receiverId":friendId});
       console.log("call request sent",userId, friendId)
     }
     else
     {
      setFriendState("online")
     }

     const handleCallRequestResponse = ({response})=>{
       console.log("RECEIVED call-request-response", response);
       if(response=="online"){
        setFriendState("online")
       }
       else if(response=="offline")
       {
        setFriendState("offline");
       }
       else if(response=="onOtherCall")
       {
        setFriendState("onOtherCall")
       }
     }
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
  await pcRef.current.createConnection(); // 🔥 move here

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = pcRef.current.localStream;
  }
};
// const initRTC = async () => {
//   if (pcRef.current) return;

//   pcRef.current = new RTC(
//     socket,
//     userId,
//     friendId,
//     (stream) => {
//       if (!remoteVideoRef.current) return;

//       remoteVideoRef.current.srcObject = stream;
//       remoteVideoRef.current.play().catch(() => {});

//       // Monitor ALL tracks continuously
//       stream.getTracks().forEach(track => {
//         // Initial state
//         if (track.kind === 'video') {
//           setRemoteCameraOff(!track.enabled && !track.muted);
//         } else if (track.kind === 'audio') {
//           setRemoteMuted(!track.enabled || track.muted);
//         }

//         // Listen for changes
//         track.onmute = () => {
//           console.log(`Remote ${track.kind} muted`);
//           if (track.kind === 'video') setRemoteCameraOff(true);
//           if (track.kind === 'audio') setRemoteMuted(true);
//         };

//         track.onunmute = () => {
//           console.log(`Remote ${track.kind} unmuted`);
//           if (track.kind === 'video') setRemoteCameraOff(false);
//           if (track.kind === 'audio') setRemoteMuted(false);
//         };

//         track.onended = () => {
//           console.log(`Remote ${track.kind} ended`);
//           if (track.kind === 'video') setRemoteCameraOff(true);
//           if (track.kind === 'audio') setRemoteMuted(true);
//         };
//       });
//     }
//   );

//   await pcRef.current.getStreams();
//   await pcRef.current.createConnection();

//   if (localVideoRef.current) {
//     localVideoRef.current.srcObject = pcRef.current.localStream;
//   }
// };


    
     const handleCallRejected = ({callerId,receiverId})=>{
       if(receiverId!=friendId){return;}
       dispatch(setCallingState({"callState":"idle","didICall":false}));
       onEndCall();
     }

    const handleCallAccepted = async ({ callerId, receiverId }) => {
      console.log("Call accepted by", receiverId);
      
      // if (!pcRef.current) {
      //   console.error("RTC not initialized!");
      //   return;
      // }

      dispatch(setCallingState({ callState: "onCall", didICall: true }));
      setFriendState("onCall");

      // ✅ Create peer connection and offer
      try {
        await initRTC();
        // await pcRef.current.createConnection();
        await pcRef.current.createOffer({
          callerId: userId,
          receiverId: friendId
        });
      } catch (err) {
        console.error("Error in call-accepted:", err);
      }
    };

    const handleNewOffer = async (offerPack) => {
      console.log("Offer received from", offerPack.callerId);
      
      // if (!pcRef.current) {
      //   console.error("RTC not initialized!");
      //   return;
      // }

      try {
        // ✅ Create connection, set remote offer, then answer
        await initRTC();
        // await pcRef.current.createConnection();
        await pcRef.current.setRemoteOffer(offerPack.offer);
        await pcRef.current.answerOffer();
        console.log("Answer sent");
        
        // ✅ Update state to show we're on call
        dispatch(setCallingState({ callState: "onCall", didICall: false }));
        setFriendState("onCall");
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleIceCandidate = (iceCandidate) => {
      if (!pcRef.current) return;
      // if (callingState.callState !== "onCall") return;
      pcRef.current.addNewIceCandidate(iceCandidate);
    };

    const handleAnswerResponse = async (offerObj) => {
      console.log("Answer received");
      if (pcRef.current) {
        await pcRef.current.addAnswer(offerObj.offer);
        console.log("Answer added");
      }
    }

    const handleEndCall = ({callerId,receiverId})=>{
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      dispatch(setCallingState({"callState":"idle","didICall":false}));
      onEndCall();
    }

    const handleRemoteMicToggle = ({ isMuted }) => {
      setRemoteMuted(isMuted);
    };

    const handleRemoteCameraToggle = ({ cameraOff }) => {
      setRemoteCameraOff(cameraOff);
    };

    // Register socket listeners
    socket.on("call-request-response", handleCallRequestResponse)
    socket.on("call-rejected", handleCallRejected)
    socket.on("call-accepted", handleCallAccepted)
    socket.on("newOffer", handleNewOffer)
    socket.on('receivedIceCandidateFromServer', handleIceCandidate)
    socket.on('answerresponse', handleAnswerResponse)
    socket.on('end-call', handleEndCall)
    socket.on('mic-toggle', handleRemoteMicToggle)
    socket.on('camera-toggle', handleRemoteCameraToggle)
  
    // Cleanup
    return ()=>{
      socket.off("call-request-response", handleCallRequestResponse)
      socket.off("call-rejected", handleCallRejected)
      socket.off("call-accepted", handleCallAccepted)
      socket.off("newOffer", handleNewOffer)
      socket.off('receivedIceCandidateFromServer', handleIceCandidate)
      socket.off('answerresponse', handleAnswerResponse)
      socket.off('end-call', handleEndCall)
      socket.off('mic-toggle', handleRemoteMicToggle)
      socket.off('camera-toggle', handleRemoteCameraToggle)
    }
  },[])
  
  useEffect(()=>{
    console.log("EFFECT RUN", {
      friendState,
      didICall: callingState.didICall,
      callSent: callSentRef.current
    });
    
    if(friendState==null) return;
    if(friendState=="offline"||friendState=="onOtherCall") return;
    if(friendState=="onCall") return;

    if(callingState.didICall === true && !callSentRef.current) {
      socket.emit("call-send",{
        callerId:userId,
        receiverId:friendId
      });
      console.log("call send");
      callSentRef.current = true;
    }
  }, [friendState, callingState.didICall])

  // ✅ Update remote video when stream is available
  // useEffect(() => {
  //   console.log("remote stream",pcRef.current?.remoteStream)
  //   if (friendState !== "onCall") return;
  //   if (!pcRef.current?.remoteStream) return;

  //   const checkRemoteStream = setInterval(() => {
  //     // if (pcRef.current?.remoteStream?.getTracks().length > 0) {
  //     if (pcRef.current?.remoteStream){
  //       if (remoteVideoRef.current) {
  //         remoteVideoRef.current.srcObject = pcRef.current.remoteStream;
  //         console.log("Remote stream attached");
  //       }
  //       clearInterval(checkRemoteStream);
  //     }
  //   }, 500);

  //   return () => clearInterval(checkRemoteStream);
  // // }, [friendState]);
  // });

//   useEffect(() => {
//     console.log("remote stream",pcRef.current?.remoteStream)
//   if (friendState !== "onCall") return;
//   if (!pcRef.current?.remoteStream) return;

//   if (remoteVideoRef.current) {
//     remoteVideoRef.current.srcObject = pcRef.current.remoteStream;
//     console.log("Remote stream attached");
//   }
// }, [friendState]);  
// useEffect(() => {
//   if (!remoteStream || !remoteVideoRef.current) return;

//   const video = remoteVideoRef.current;

//   if (video.srcObject !== remoteStream) {
//     video.srcObject = remoteStream;

//     video.onloadedmetadata = () => {
//       video.play().catch(err => {
//         console.warn("Autoplay blocked:", err);
//       });
//     };
//   }
// }, [remoteStream]);

  // Handle mute/unmute
  // const handleMute = () => {
  //   if (pcRef.current?.localStream) {
  //     const audioTracks = pcRef.current.localStream.getAudioTracks();
  //     audioTracks.forEach(track => {
  //       track.enabled = !isMuted;
  //     });
  //     setIsMuted(!isMuted);
  //   }
  // };
  const handleMicToggle = () => {
  if (!pcRef.current?.localStream) return;

  const audioTracks = pcRef.current.localStream.getAudioTracks();

  audioTracks.forEach(track => {
    track.enabled = isMuted; // toggle
  });

  setIsMuted(!isMuted);
  
  // Notify remote user of mic state change
  socket.emit("mic-toggle", {
    callerId: userId,
    receiverId: friendId,
    isMuted: !isMuted
  });
};


  // Handle camera toggle
  // const handleCameraToggle = () => {
  //   if (pcRef.current?.localStream) {
  //     const videoTracks = pcRef.current.localStream.getVideoTracks();
  //     videoTracks.forEach(track => {
  //       track.enabled = cameraOff;
  //     });
  //     setCameraOff(!cameraOff);
  //   }
  // };
  const handleCameraToggle = () => {
  if (!pcRef.current?.localStream) return;

  const videoTracks = pcRef.current.localStream.getVideoTracks();

  // Simply toggle the track enabled state
  videoTracks.forEach(track => {
    track.enabled = cameraOff;  // if cameraOff is true, enable; if false, disable
  });

  // Toggle the state
  setCameraOff(!cameraOff);
  
  // Notify remote user of camera state change
  socket.emit("camera-toggle", {
    callerId: userId,
    receiverId: friendId,
    cameraOff: !cameraOff
  });
};
// const handleCameraToggle = async () => {
//   if (!pcRef.current?.localStream || !localVideoRef.current) return;

//   const videoTracks = pcRef.current.localStream.getVideoTracks();

//   if (cameraOff) {
//     // 🔴 TURN CAMERA OFF
//     videoTracks.forEach(track => (track.enabled = false));
//     localVideoRef.current.srcObject = null;
//   } else {
//     // 🟢 TURN CAMERA ON
//     videoTracks.forEach(track => (track.enabled = true));

//     // 🔥 REATTACH + FORCE PLAY
//     localVideoRef.current.srcObject = pcRef.current.localStream;
//     await localVideoRef.current.play().catch(() => {});
//   }

//   setCameraOff(!cameraOff);
// };

// Add this after all existing useEffects, before the handleMicToggle function
// useEffect(() => {
//   if (friendState !== "onCall") return;
//   if (!pcRef.current?.remoteStream) return;

//   const checkInterval = setInterval(() => {
//     const stream = pcRef.current.remoteStream;
//     if (!stream) return;

//     const videoTrack = stream.getVideoTracks()[0];
//     const audioTrack = stream.getAudioTracks()[0];

//     if (videoTrack) {
//       setRemoteCameraOff(!videoTrack.enabled || videoTrack.muted);
//     }
//     if (audioTrack) {
//       setRemoteMuted(!audioTrack.enabled || audioTrack.muted);
//     }
//   }, 500);

//   return () => clearInterval(checkInterval);
// }, [friendState]);


  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      
      {/* Video Stage */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Remote Video */}
        {/* ================= REMOTE VIDEO ================= */}
       
         {/* ================= REMOTE VIDEO STAGE ================= */}
<div className="absolute inset-0 bg-black">

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
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
      <img
        src={`https://api.dicebear.com/9.x/identicon/svg?seed=${friendId}`}
        className="w-24 h-24 rounded-full"
        alt="Remote avatar"
      />
    </div>
  )}

  {/* Remote mic muted indicator */}
  {friendState === "onCall" && remoteMuted && (
    <div className="absolute top-4 right-4 bg-black/70 p-2 rounded-full z-10">
      <MicOff className="w-5 h-5 text-red-400" />
    </div>
  )}

  {/* OFFLINE STATE */}
  {friendState === "offline" && (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">

    <Lottie
      animationData={offlineAnim}
      loop
      className="w-40 opacity-40"
    />

    <p className="mt-4 text-sm text-white font-medium">
      User is offline
    </p>

    <p className="text-xs text-white/50">
      Try again later
    </p>
  </div>
)}
 {showCallingUI && (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 overflow-hidden">

    {/* Lottie Background (clipped & scaled) */}
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
    <p className="mt-6 text-lg font-medium tracking-wide text-white z-10">
      Calling<span className="animate-pulse">…</span>
    </p>

    <p className="mt-1 text-xs text-white/60 z-10">
      Waiting for them to answer
    </p>
  </div>
)}



  {/* ON OTHER CALL STATE */}
  {friendState === "onOtherCall" && (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-900 backdrop-blur-sm">

    {/* Avatar */}
    <div className="relative">
      {/* busy ring */}
      <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-pulse"></div>

      <img
        src={`https://api.dicebear.com/9.x/initials/svg?seed=${friendId}&backgroundColor=111827`}
        className="relative w-20 h-20 rounded-full border border-white/10 shadow-lg"
      />
    </div>

    {/* Status */}
    <p className="mt-4 text-sm font-medium text-white">
      On another call
    </p>

    <p className="mt-1 text-xs text-white/50 text-center max-w-[220px]">
      They’re currently busy.  
      Please try again in a moment.
    </p>
  </div>
)}

</div>

        


        {/* Gradient overlay */}
        {/* <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" /> */}

        {/* Local Video (Floating) */}
        <div className="absolute bottom-5 left-5 w-[22%] min-w-[160px] aspect-video rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black">
          <div className="relative w-full h-full">
            {callingState.callState === "calling" ? (
              /* ===== CALLING ===== */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <img src={`https://api.dicebear.com/9.x/identicon/svg?seed=${Math.random()}`} className="w-20 h-20 rounded-full" />
               
              </div>
            ) : callingState.callState === "offline" ? (
              /* ===== OFFLINE ===== */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                <img src="/avatar-offline.png" className="w-20 h-20 rounded-full opacity-80" />
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
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
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
              <div className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full">
                <MicOff className="w-4 h-4 text-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Controls */}
      <div className="h-24 bg-neutral-800/95 backdrop-blur-md flex items-center justify-center gap-10 border-t border-white/10">
        
        {/* Mute */}
       <button 
  onClick={handleMicToggle}
  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-700 hover:bg-neutral-600'
  }`}
>
  {isMuted ? <MicOff /> : <Mic />}
</button>


        {/* Camera */}
        <button 
          onClick={handleCameraToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
            cameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-700 hover:bg-neutral-600'
          }`}
        >
          <Camera />
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCallClick}
          className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg transition"
        >
          End Call
        </button>
      </div>
    </div>
  )
}

export default VideoWindow


