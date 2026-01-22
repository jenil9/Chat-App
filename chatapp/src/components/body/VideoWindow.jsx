import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSocket } from '../../../socket'
import {Camera,Mic} from "lucide-react"
import { useSelector,useDispatch } from 'react-redux'
import { setCallingState } from '../../store/userSlice'
import RTC from '../../sevices/RTC'

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
  useEffect(() => {
  
  }, []);

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
  if (pcRef.current) return; // Already initialized
  // pcRef.current = new RTC(socket, userId, friendId);
  pcRef.current = new RTC(
  socket,
  userId,
  friendId,
  (stream) => {
    const video = remoteVideoRef.current;
    if (!video) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play().catch(err => {
          console.warn("Autoplay blocked:", err);
        });
      };

      console.log("Remote stream attached");
    }
  }
);



  try {
    await pcRef.current.getStreams();
    if (localVideoRef.current && pcRef.current.localStream) {
      localVideoRef.current.srcObject = pcRef.current.localStream;
    }
  } catch (err) {
    console.error(err);
  }
};


    
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
        await pcRef.current.createConnection();
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
        await pcRef.current.createConnection();
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
      if (callingState.callState !== "onCall") return;
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

    // Register socket listeners
    socket.on("call-request-response", handleCallRequestResponse)
    socket.on("call-rejected", handleCallRejected)
    socket.on("call-accepted", handleCallAccepted)
    socket.on("newOffer", handleNewOffer)
    socket.on('receivedIceCandidateFromServer', handleIceCandidate)
    socket.on('answerresponse', handleAnswerResponse)
    socket.on('end-call', handleEndCall)
  
    // Cleanup
    return ()=>{
      socket.off("call-request-response", handleCallRequestResponse)
      socket.off("call-rejected", handleCallRejected)
      socket.off("call-accepted", handleCallAccepted)
      socket.off("newOffer", handleNewOffer)
      socket.off('receivedIceCandidateFromServer', handleIceCandidate)
      socket.off('answerresponse', handleAnswerResponse)
      socket.off('end-call', handleEndCall)
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

  useEffect(() => {
    console.log("remote stream",pcRef.current?.remoteStream)
  if (friendState !== "onCall") return;
  if (!pcRef.current?.remoteStream) return;

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = pcRef.current.remoteStream;
    console.log("Remote stream attached");
  }
}, [friendState]);  
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
  const handleMute = () => {
    if (pcRef.current?.localStream) {
      const audioTracks = pcRef.current.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Handle camera toggle
  const handleCameraToggle = () => {
    if (pcRef.current?.localStream) {
      const videoTracks = pcRef.current.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = cameraOff;
      });
      setCameraOff(!cameraOff);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      
      {/* Video Stage */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Remote Video */}
       <video
  ref={remoteVideoRef}
  autoPlay
  playsInline
  className="absolute inset-0 w-full h-full object-cover bg-black"
/>


        {/* Gradient overlay */}
       {/*<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />


        {/* Local Video (Floating) */}
        <div className="absolute bottom-5 left-5 w-[22%] min-w-[160px] aspect-video rounded-xl overflow-hidden border border-white/20 shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover bg-black"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-neutral-800/95 backdrop-blur-md flex items-center justify-center gap-10 border-t border-white/10">
        
        {/* Mute */}
        <button 
          onClick={handleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-700 hover:bg-neutral-600'
          }`}
        >
          <Mic />
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


// import React, { useEffect, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { getSocket } from '../../../socket'
// import { Camera, Mic } from "lucide-react"
// import { useSelector, useDispatch } from 'react-redux'
// import { setCallingState } from '../../store/userSlice'
// import RTC from '../../sevices/RTC'

// const VideoWindow = ({ onEndCall }) => {
//   const { friendId } = useParams()
//   const dispatch = useDispatch();
//   const socket = getSocket()
//   const userId = useSelector((state) => state.user.userinfo.id)
//   let callingState = useSelector((state) => { return state.user.callingState })
//   const callSentRef = useRef(false);
//   const [friendState, setFriendState] = useState(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [cameraOff, setCameraOff] = useState(false);

//   let pcRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const handleEndCallClick = () => {
//     socket.emit("end-call", {
//       callerId: userId,
//       receiverId: friendId
//     });

//     dispatch(setCallingState({ callState: "idle", didICall: false }));

//     if (pcRef.current) {
//       pcRef.current.close();
//       pcRef.current = null;
//     }

//     onEndCall();
//   };

//   // Initialize RTC instance
//   const initRTC = async () => {
//     if (pcRef.current) {
//       console.log("RTC already initialized");
//       return;
//     }

//     console.log("Initializing RTC...");
//     pcRef.current = new RTC(
//       socket,
//       userId,
//       friendId,
//       (stream) => {
//         console.log("Remote stream callback triggered, tracks:", stream.getTracks());
        
//         const video = remoteVideoRef.current;
//         if (!video) {
//           console.warn("Remote video ref not available");
//           return;
//         }

//         // Set srcObject
//         video.srcObject = stream;

//         // Ensure video plays
//         video.onloadedmetadata = () => {
//           console.log("Remote video metadata loaded");
//           video.play().catch(err => {
//             console.warn("Autoplay blocked:", err);
//           });
//         };
//       }
//     );

//     try {
//       await pcRef.current.getStreams();
//       console.log("Streams acquired");
      
//       // Attach local stream to video element
//       if (localVideoRef.current && pcRef.current.localStream) {
//         localVideoRef.current.srcObject = pcRef.current.localStream;
//         console.log("Local stream attached to video element");
//       }
//     } catch (err) {
//       console.error("Error initializing RTC:", err);
//       throw err;
//     }
//   };

//   useEffect(() => {
//     if (callingState.didICall === true) {
//       socket.emit("call-request", { "callerId": userId, "receiverId": friendId });
//       console.log("call request sent", userId, friendId)
//     } else {
//       setFriendState("online")
//     }

//     const handleCallRequestResponse = ({ response }) => {
//       console.log("RECEIVED call-request-response", response);
//       if (response === "online") {
//         setFriendState("online")
//       } else if (response === "offline") {
//         setFriendState("offline");
//       } else if (response === "onOtherCall") {
//         setFriendState("onOtherCall")
//       }
//     }

//     const handleCallRejected = ({ callerId, receiverId }) => {
//       if (receiverId !== friendId) { return; }
//       dispatch(setCallingState({ "callState": "idle", "didICall": false }));
//       onEndCall();
//     }

//     const handleCallAccepted = async ({ callerId, receiverId }) => {
//       console.log("Call accepted by", receiverId);

//       dispatch(setCallingState({ callState: "onCall", didICall: true }));
//       setFriendState("onCall");

//       try {
//         await initRTC();
//         await pcRef.current.createConnection();
//         await pcRef.current.createOffer({
//           callerId: userId,
//           receiverId: friendId
//         });
//       } catch (err) {
//         console.error("Error in call-accepted:", err);
//       }
//     };

//     const handleNewOffer = async (offerPack) => {
//       console.log("Offer received from", offerPack.callerId);

//       try {
//         await initRTC();
//         await pcRef.current.createConnection();
//         console.log("ji")
//         await pcRef.current.setRemoteOffer(offerPack.offer);
//         await pcRef.current.answerOffer();
//         console.log("Answer sent");

//         dispatch(setCallingState({ callState: "onCall", didICall: false }));
//         setFriendState("onCall");
//       } catch (err) {
//         console.error("Error handling offer:", err);
//       }
//     };

//     const handleIceCandidate = (iceCandidate) => {
//       console.log("ICE candidate received");
//       if (!pcRef.current) {
//         console.warn("No RTC instance for ICE candidate");
//         return;
//       }
//       pcRef.current.addNewIceCandidate(iceCandidate);
//     };

//     const handleAnswerResponse = async (offerObj) => {
//       console.log("Answer received");
//       if (pcRef.current) {
//         await pcRef.current.addAnswer(offerObj.offer);
//         console.log("Answer added");
//       }
//     }

//     const handleEndCall = ({ callerId, receiverId }) => {
//       if (pcRef.current) {
//         pcRef.current.close();
//         pcRef.current = null;
//       }
//       dispatch(setCallingState({ "callState": "idle", "didICall": false }));
//       onEndCall();
//     }

//     // Register socket listeners
//     socket.on("call-request-response", handleCallRequestResponse)
//     socket.on("call-rejected", handleCallRejected)
//     socket.on("call-accepted", handleCallAccepted)
//     socket.on("newOffer", handleNewOffer)
//     socket.on('receivedIceCandidateFromServer', handleIceCandidate)
//     socket.on('answerresponse', handleAnswerResponse)
//     socket.on('end-call', handleEndCall)

//     // Cleanup
//     return () => {
//       socket.off("call-request-response", handleCallRequestResponse)
//       socket.off("call-rejected", handleCallRejected)
//       socket.off("call-accepted", handleCallAccepted)
//       socket.off("newOffer", handleNewOffer)
//       socket.off('receivedIceCandidateFromServer', handleIceCandidate)
//       socket.off('answerresponse', handleAnswerResponse)
//       socket.off('end-call', handleEndCall)

//       // Clean up RTC on unmount
//       if (pcRef.current) {
//         pcRef.current.close();
//         pcRef.current = null;
//       }
//     }
//   }, [])

//   useEffect(() => {
//     console.log("EFFECT RUN", {
//       friendState,
//       didICall: callingState.didICall,
//       callSent: callSentRef.current
//     });

//     if (friendState == null) return;
//     if (friendState === "offline" || friendState === "onOtherCall") return;
//     if (friendState === "onCall") return;

//     if (callingState.didICall === true && !callSentRef.current) {
//       socket.emit("call-send", {
//         callerId: userId,
//         receiverId: friendId
//       });
//       console.log("call send");
//       callSentRef.current = true;
//     }
//   }, [friendState, callingState.didICall])

//   // Handle mute/unmute
//   const handleMute = () => {
//     if (pcRef.current?.localStream) {
//       const audioTracks = pcRef.current.localStream.getAudioTracks();
//       audioTracks.forEach(track => {
//         track.enabled = !track.enabled;
//       });
//       setIsMuted(!isMuted);
//     }
//   };

//   // Handle camera toggle
//   const handleCameraToggle = () => {
//     if (pcRef.current?.localStream) {
//       const videoTracks = pcRef.current.localStream.getVideoTracks();
//       videoTracks.forEach(track => {
//         track.enabled = !track.enabled;
//       });
//       setCameraOff(!cameraOff);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-neutral-900">

//       {/* Video Stage */}
//       <div className="relative flex-1 overflow-hidden">

//         {/* Remote Video */}
//         <video
//           ref={remoteVideoRef}
//           autoPlay
//           playsInline
//           className="absolute inset-0 w-full h-full object-cover bg-black"
//         />

//         {/* Local Video (Floating) */}
//         <div className="absolute bottom-5 left-5 w-[22%] min-w-[160px] aspect-video rounded-xl overflow-hidden border border-white/20 shadow-xl">
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             className="w-full h-full object-cover bg-black"
//           />
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="h-24 bg-neutral-800/95 backdrop-blur-md flex items-center justify-center gap-10 border-t border-white/10">

//         {/* Mute */}
//         <button
//           onClick={handleMute}
//           className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-700 hover:bg-neutral-600'
//             }`}
//         >
//           <Mic />
//         </button>

//         {/* Camera */}
//         <button
//           onClick={handleCameraToggle}
//           className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${cameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-700 hover:bg-neutral-600'
//             }`}
//         >
//           <Camera />
//         </button>

//         {/* End Call */}
//         <button
//           onClick={handleEndCallClick}
//           className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg transition"
//         >
//           End Call
//         </button>
//       </div>
//     </div>
//   )
// }

// export default VideoWindow