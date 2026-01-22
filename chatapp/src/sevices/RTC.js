export default class RTC
{
  
  constructor(socket,localId,remoteId,onRemoteStream)
  {
    this.pc=null;
    this.localStream=null;
    this.remoteStream=null;
    this.socket=socket;
    this.peerConfiguration = {
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}
   this.hasCamera = null;
    this.hasMic = null;
    this.localId=localId;
    this.remoteId=remoteId;
    this.pendingIceCandidates = [];
    this.pendingAnswer = null;
      this.onRemoteStream = onRemoteStream;

  }
  
  async getStreams() {
  if (this.localStream) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  this.hasCamera = devices.some(d => d.kind === "videoinput");
  this.hasMic = devices.some(d => d.kind === "audioinput");

  // this.localStream = await navigator.mediaDevices.getUserMedia({
  //   video: this.hasCamera,
  //   audio: this.hasMic
  // });
  this.localStream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true
});

}

  
  async createConnection(offerObj) {
//   if (this.pc) return;

//   this.pc = new RTCPeerConnection(this.peerConfiguration);
//   this.remoteStream = new MediaStream();

//   this.localStream.getTracks().forEach(track => {
//     this.pc.addTrack(track, this.localStream);
//   });
if (this.pc) return;

//   // ✅ guarantee browser + media
  // Get RTCPeerConnection with browser compatibility
  const RTCPeerConnectionClass = window.RTCPeerConnection || 
                                 window.webkitRTCPeerConnection || 
                                 window.mozRTCPeerConnection;
  
  if (!RTCPeerConnectionClass) {
    console.error("WebRTC not supported in this browser");
    // return;
  }

  // await this.getStreams(); // 🔥 REQUIRED

  // this.pc = new window.RTCPeerConnection(this.peerConfiguration);
  this.pc = new RTCPeerConnection(this.peerConfiguration);

  // this.remoteStream = new MediaStream();

  this.localStream.getTracks().forEach(track => {
    this.pc.addTrack(track, this.localStream);
  });
  this.pc.onicecandidate = (e) => {
    if (e.candidate) {
      this.socket.emit("sendIceCandidateToSignalingServer", {
        iceCandidate: e.candidate,
        senderId: this.localId,
        receiverId: this.remoteId,
      });
    }
  };

//   this.pc.ontrack = (event) => {
//   console.log("ontrack fired", event.streams);
//   this.remoteStream = event.streams[0];
//   if (this.onRemoteStream) {
//     this.onRemoteStream(this.remoteStream);
//   }
// };

// this.pc.ontrack = (event) => {
//   console.log("ontrack fired", event.streams);

//   this.remoteStream = event.streams[0];

//   if (this.onRemoteStream) {
//     this.onRemoteStream(this.remoteStream);
//   }
  this.pc.ontrack = (event) => {
  this.remoteStream = event.streams[0]; // browser-managed stream
  this.onRemoteStream?.(this.remoteStream);
};


  // 🔥 FORCE PLAYBACK (critical)
  // setTimeout(() => {
  //   const video = document.querySelector("video:not([muted])");
  //   if (video) {
  //     video.play().catch(err =>
  //       console.warn("Autoplay blocked:", err)
  //     );
  //   }
  // }, 0);
// };


  if (this.pendingAnswer) {
    await this.pc.setRemoteDescription(this.pendingAnswer);
    this.pendingAnswer = null;
  }
  if (offerObj) {
    await this.pc.setRemoteDescription(offerObj.offer);
  }
}

async setRemoteOffer(offer) {
  await this.pc.setRemoteDescription(offer);

  // add queued ICE
  for (const candidate of this.pendingIceCandidates) {
    await this.pc.addIceCandidate(candidate);
  }
  this.pendingIceCandidates = [];
}



  async addNewIceCandidate(iceCandidate) {
  if (!this.pc) return;

  if (!this.pc.remoteDescription) {
    // queue ICE until remote description is set
    this.pendingIceCandidates.push(iceCandidate);
    return;
  }

  try {
    await this.pc.addIceCandidate(iceCandidate);
  } catch (err) {
    console.error("Error adding ICE candidate", err);
  }
}

async  createOffer({callerId,receiverId})
  {
     try{
        
        const offer = await this.pc.createOffer();
        
        this.pc.setLocalDescription(offer);
       
        const offerpack={
            "offer":offer,
            "callerId":callerId,
            "receiverId":receiverId,
            "didIOffer":true
        }
        this.socket.emit('newOffer',offerpack); //send offer to signalingServer
        console.log("offer send")
    }catch(err){
        console.error("Error creating offer:", err);
    }
  }

async answerOffer()
  {
    try {
      const answer = await this.pc.createAnswer({}); 
      await this.pc.setLocalDescription(answer); 
      console.log("remote stream at answer",this.remoteStream);
      console.log("local stream at amswer",this.localStream);
      const offerpack={
          "offer":answer,
          "callerId":this.remoteId,
          "receiverId":this.localId,
          "didIOffer":false
      } 
      
       this.socket.emit('newAnswer',offerpack)
       console.log("anser sendf")
    } catch(err) {
      console.error("Error answering offer:", err);
    }
  }

  async addAnswer(answer) {
  if (!this.pc) {
    this.pendingAnswer = answer;
    return;
  }

  await this.pc.setRemoteDescription(answer);

  for (const candidate of this.pendingIceCandidates) {
    await this.pc.addIceCandidate(candidate);
  }
  this.pendingIceCandidates = [];
}


  // FIXED: Added missing close() method
  close() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.pendingIceCandidates = [];

  }
}

// export default class RTC {
//   constructor(socket, localId, remoteId, onRemoteStream) {
//     this.pc = null;
//     this.localStream = null;
//     this.remoteStream = null;
//     this.socket = socket;
//     this.peerConfiguration = {
//       iceServers: [
//         {
//           urls: [
//             'stun:stun.l.google.com:19302',
//             'stun:stun1.l.google.com:19302'
//           ]
//         }
//       ]
//     };
//     this.hasCamera = null;
//     this.hasMic = null;
//     this.localId = localId;
//     this.remoteId = remoteId;
//     this.pendingIceCandidates = [];
//     this.pendingAnswer = null;
//     this.onRemoteStream = onRemoteStream;
//   }

//   async getStreams() {
//     if (this.localStream) return;

//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       this.hasCamera = devices.some(d => d.kind === "videoinput");
//       this.hasMic = devices.some(d => d.kind === "audioinput");

//       this.localStream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 1280, height: 720 },
//         audio: true
//       });
      
//       console.log("Local stream acquired:", this.localStream.getTracks());
//     } catch (err) {
//       console.error("Error getting media:", err);
//       throw err;
//     }
//   }

//   async createConnection(offerObj) {
//     if (this.pc) {
//       console.log("Connection already exists");
//       return;
//     }

//     console.log("Creating peer connection...");
//     this.pc = new RTCPeerConnection(this.peerConfiguration);

//     // Add local tracks to peer connection
//     this.localStream.getTracks().forEach(track => {
//       console.log("Adding local track:", track.kind, track.enabled);
//       this.pc.addTrack(track, this.localStream);
//     });

//     // Handle ICE candidates
//     this.pc.onicecandidate = (e) => {
//       if (e.candidate) {
//         console.log("Sending ICE candidate");
//         this.socket.emit("sendIceCandidateToSignalingServer", {
//           iceCandidate: e.candidate,
//           senderId: this.localId,
//           receiverId: this.remoteId,
//         });
//       }
//     };

//     // Handle incoming tracks
//     this.pc.ontrack = (event) => {
//       console.log("Track received:", event.track.kind, "Stream:", event.streams[0]);
      
//       if (!this.remoteStream) {
//         this.remoteStream = event.streams[0];
//         console.log("Remote stream set:", this.remoteStream.getTracks());
//       } else {
//         // Add track if not already present
//         const existingTrack = this.remoteStream.getTracks().find(
//           t => t.kind === event.track.kind
//         );
//         if (!existingTrack) {
//           this.remoteStream.addTrack(event.track);
//         }
//       }

//       // Notify callback
//       if (this.onRemoteStream) {
//         this.onRemoteStream(this.remoteStream);
//       }
//     };

//     // Handle connection state changes
//     this.pc.onconnectionstatechange = () => {
//       console.log("Connection state:", this.pc.connectionState);
//     };

//     this.pc.oniceconnectionstatechange = () => {
//       console.log("ICE connection state:", this.pc.iceConnectionState);
//     };

//     // Set remote description if offer provided
//     if (offerObj) {
//       await this.pc.setRemoteDescription(offerObj.offer);
//       console.log("Remote description set from offer");
//     }

//     // Process pending answer
//     if (this.pendingAnswer) {
//       await this.pc.setRemoteDescription(this.pendingAnswer);
//       this.pendingAnswer = null;
//       console.log("Pending answer set");
//     }

//     // Process pending ICE candidates
//     for (const candidate of this.pendingIceCandidates) {
//       await this.pc.addIceCandidate(candidate);
//     }
//     if (this.pendingIceCandidates.length > 0) {
//       console.log(`Added ${this.pendingIceCandidates.length} pending ICE candidates`);
//     }
//     this.pendingIceCandidates = [];
//   }

//   async setRemoteOffer(offer) {
//     console.log("Setting remote offer");
//     await this.pc.setRemoteDescription(offer);

//     // Add queued ICE candidates
//     for (const candidate of this.pendingIceCandidates) {
//       await this.pc.addIceCandidate(candidate);
//     }
//     if (this.pendingIceCandidates.length > 0) {
//       console.log(`Added ${this.pendingIceCandidates.length} queued ICE candidates`);
//     }
//     this.pendingIceCandidates = [];
//   }

//   async addNewIceCandidate(iceCandidate) {
//     if (!this.pc) {
//       console.log("No peer connection, queueing ICE candidate");
//       this.pendingIceCandidates.push(iceCandidate);
//       return;
//     }

//     if (!this.pc.remoteDescription) {
//       console.log("No remote description, queueing ICE candidate");
//       this.pendingIceCandidates.push(iceCandidate);
//       return;
//     }

//     try {
//       await this.pc.addIceCandidate(iceCandidate);
//       console.log("ICE candidate added");
//     } catch (err) {
//       console.error("Error adding ICE candidate", err);
//     }
//   }

//   async createOffer({ callerId, receiverId }) {
//     try {
//       console.log("Creating offer...");
//       const offer = await this.pc.createOffer();
//       await this.pc.setLocalDescription(offer);

//       const offerpack = {
//         offer: offer,
//         callerId: callerId,
//         receiverId: receiverId,
//         didIOffer: true
//       };
      
//       this.socket.emit('newOffer', offerpack);
//       console.log("Offer sent");
//     } catch (err) {
//       console.error("Error creating offer:", err);
//     }
//   }

//   async answerOffer() {
//     try {
//       console.log("Creating answer...");
//       const answer = await this.pc.createAnswer();
//       await this.pc.setLocalDescription(answer);
      
//       console.log("Local stream tracks:", this.localStream?.getTracks());
//       console.log("Remote stream tracks:", this.remoteStream?.getTracks());

//       const offerpack = {
//         offer: answer,
//         callerId: this.remoteId,
//         receiverId: this.localId,
//         didIOffer: false
//       };

//       this.socket.emit('newAnswer', offerpack);
//       console.log("Answer sent");
//     } catch (err) {
//       console.error("Error answering offer:", err);
//     }
//   }

//   async addAnswer(answer) {
//     console.log("Adding answer");
    
//     if (!this.pc) {
//       console.log("No peer connection, storing pending answer");
//       this.pendingAnswer = answer;
//       return;
//     }

//     await this.pc.setRemoteDescription(answer);
//     console.log("Remote description set from answer");

//     // Add any pending ICE candidates
//     for (const candidate of this.pendingIceCandidates) {
//       await this.pc.addIceCandidate(candidate);
//     }
//     if (this.pendingIceCandidates.length > 0) {
//       console.log(`Added ${this.pendingIceCandidates.length} pending ICE candidates after answer`);
//     }
//     this.pendingIceCandidates = [];
//   }

//   close() {
//     console.log("Closing RTC connection");
    
//     if (this.pc) {
//       this.pc.close();
//       this.pc = null;
//     }
    
//     if (this.localStream) {
//       this.localStream.getTracks().forEach(track => {
//         track.stop();
//         console.log("Stopped track:", track.kind);
//       });
//       this.localStream = null;
//     }
    
//     this.remoteStream = null;
//     this.pendingIceCandidates = [];
//     this.pendingAnswer = null;
//   }
// }