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


  useEffect(()=>{
     if(callingState.didICall==true)
     {
     socket.emit("call-request",{"callerId":userId,"receiverId":friendId});
     console.log("call request send",userId, friendId)
     }
     else
     {
      setFriendState("online")
     }

     // FIXED: Define socket event handlers
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

     const handleCallRejected = ({callerId,receiverId})=>{
         if(receiverId!=friendId){return;}
      dispatch(setCallingState({"callState":"idle","didICall":false}));
      onEndCall();
     }

    const handleCallAccepted = async ({ callerId, receiverId }) => {
  if (!pcRef.current) {
    pcRef.current = new RTC(socket, userId, friendId);
  }

  dispatch(setCallingState({ callState: "onCall", didICall: true }));
  setFriendState("onCall");

  await pcRef.current.getStreams();
  await pcRef.current.createConnection();
  await pcRef.current.createOffer({
    callerId: userId,
    receiverId: friendId
  });
};


    const handleNewOffer = async (offerPack) => {
  if (!pcRef.current) {
    pcRef.current = new RTC(socket, userId, friendId);
  }
 console.log("offer receive")
  await pcRef.current.getStreams();
  await pcRef.current.createConnection();   // create pc FIRST
  await pcRef.current.setRemoteOffer(offerPack.offer); // THEN set offer
  await pcRef.current.answerOffer();         // THEN answer
  console.log("answer offer")
};



    const handleIceCandidate = (iceCandidate) => {
  if (!pcRef.current) return;
  if (callingState.callState !== "onCall") return;
  pcRef.current.addNewIceCandidate(iceCandidate);
};


     const handleAnswerResponse = (offerObj)=>{
        if (pcRef.current){
           pcRef.current.addAnswer(offerObj.offer)
           console.log("add anserr")
        }
     }

     const handleEndCall = ({callerId,receiverId})=>{
      dispatch(setCallingState({"callState":"idle","didICall":false}));
      onEndCall();
     }

     // FIXED: Register socket listeners
     socket.on("call-request-response", handleCallRequestResponse)
     socket.on("call-rejected", handleCallRejected)
     socket.on("call-accepted", handleCallAccepted)
     socket.on("newOffer", handleNewOffer)
     socket.on('receivedIceCandidateFromServer', handleIceCandidate)
     socket.on('answerresponse', handleAnswerResponse)
     socket.on('end-call', handleEndCall)


     
  
     // FIXED: Proper cleanup function with socket listener removal
     return ()=>{
      //  socket.emit("end-call",{"callerId":userId,"receiverId":friendId});
      //   callSentRef.current = null;
       // Remove socket listeners to prevent duplicates
       socket.off("call-request-response", handleCallRequestResponse)
       socket.off("call-rejected", handleCallRejected)
       socket.off("call-accepted", handleCallAccepted)
       socket.off("newOffer", handleNewOffer)
       socket.off('receivedIceCandidateFromServer', handleIceCandidate)
       socket.off('answerresponse', handleAnswerResponse)
       socket.off('end-call', handleEndCall)
       
       // Close RTC connection
      if (pcRef.current) {
    pcRef.current.close();
    pcRef.current = null;
  }
       
      //  dispatch(setCallingState({"callState":"idle","didICall":false}))
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


  // useEffect(()=>{
  //   if(friendState!="onCall")
  //   {
  //     return;
  //   }

  //  const startCall=async()=>{
  //   if (!pcRef.current) return;//doubt on multiple request 
  //   await pcRef.current.getStreams();
  //   if(callingState.didICall==true&& !callSentRef.current)
  //   {
  //   await pcRef.current.createConnection();
  //    pcRef.current.createOffer({"callerId":userId,"receiverId":friendId})
  //   }
  //  }

  //  startCall();

  // },[friendState])

  useEffect(() => {
  if (!pcRef.current) return;
  if (!pcRef.current.localStream) return;

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = pcRef.current.localStream;
  }
}, [friendState]);

useEffect(() => {
  if (friendState !== "onCall") return;
  if (!pcRef.current?.remoteStream) return;

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = pcRef.current.remoteStream;
  }
}, [friendState]);

// FIXED: Handle mute/unmute
const handleMute = () => {
  if (pcRef.current?.localStream) {
    const audioTracks = pcRef.current.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !isMuted;
    });
    setIsMuted(!isMuted);
  }
};

// FIXED: Handle camera toggle
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />

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