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
  const [friendState,setFriendState]=useState(null);//offline,onOtherCall,online,oncall
  
  let pcRef=useRef(null);
  const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);

  useEffect(()=>{
     if(callingState.didICall==true)
     {
     socket.emit("call-request",{"callerId":userId,"receiverId":friendId});
     }//otherwise receiver also send call request
     else
     {
      setFriendState("online")
     }

     //socket events 

     socket.on("call-request-response",({response})=>{
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
     })

     socket.on("call-rejected",({callerId,receiverId})=>{
         if(receiverId!=friendId){return;}
      dispatch(setCallingState({"callState":"idle","didICall":false}));
      onEndCall();
    
     })

     socket.on("call-accepted",({callerId,receiverId})=>{
        dispatch(setCallingState({"callState":"onCall","didICall":true}));
        setFriendState("onCall");
     })

     socket.on("newOffer",async (offerPack)=>{
      await pcRef.current.getStreams();
      await pcRef.current.createConnection(offerPack);
      pcRef.current.answerOffer();
     })

     socket.on('receivedIceCandidateFromServer',iceCandidate=>{
        pcRef.current.addNewIceCandidate(iceCandidate)
        // console.log(iceCandidate)
    })
     socket.on('answerresponse',offerObj=>{
        // console.log(offerObj)
        pcRef.current.addAnswer(offerObj.offer)
    })
    socket.on('end-call',({callerId,receiverId})=>{
      dispatch(setCallingState({"callState":"idle","didICall":false}));
      onEndCall();
    })
     if (pcRef.current) return;

  pcRef.current = new RTC(socket,userId,friendId);
  
     return ()=>{
       socket.emit("end-call",{"callerId":userId,"receiverId":friendId});
      //  socket.off();
        // pcRef.current?.close();
    pcRef.current = null;
    dispatch(setCallingState({"callState":"idle","didICall":false}))
     }
  },[])

  useEffect(()=>{
     if(friendState==null)
     {
       return;
     }
     if(friendState=="offline"||friendState=="onOtherCall")
     {
       return;
     }
    //  dispatch(setCallingState({"callState":"calling","didICall":true}));
    if(callingState.didICall==true&& !callSentRef.current)
    {
     socket.emit("call-send",{"callerId":userId,"receiverId":friendId});//debouncing to be implement
    callSentRef.current = true;//what to do if call rejected link with debouncing
    }

  },[friendState])

  useEffect(()=>{
    if(friendState!="onCall")
    {
      return;
    
    }

   const startCall=async()=>{
    await pcRef.current.getStreams();
    if(callingState.didICall==true&& !callSentRef.current)
    {
    await pcRef.current.createConnection();
     pcRef.current.createOffer({userId,friendId})
    }
    else
    {
      // 
      // await pcRef.current.createConnection(obj);
    }
   
   }

   startCall();
   

  },[friendState])

  useEffect(() => {
  if (!pcRef.current) return;
  if (!pcRef.current.localStream) return;//doubt here

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = pcRef.current.localStream;
  }
}, [friendState]);
useEffect(() => {
  if (friendState !== "onCall") return;
  if (!pcRef.current?.remoteStream) return;//doubt here how it will recall if stream arrive

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = pcRef.current.remoteStream;
  }
}, [friendState]);


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

        {/* Gradient overlay (cinematic look) */}
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
        <button className="w-12 h-12 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition">
          <Mic />
        </button>

        {/* Camera */}
        <button className="w-12 h-12 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white transition">
          <Camera />
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg transition"
        >
          End Call
        </button>
      </div>
    </div>
  )
}

export default VideoWindow
