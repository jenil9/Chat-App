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
        },{
  urls: [
    'turn:openrelay.metered.ca:80',
    'turn:openrelay.metered.ca:443',
    'turns:openrelay.metered.ca:443'
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject'
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

  this.localStream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true
});

}

  
  async createConnection(offerObj) {
    if (this.pc) return;

    const RTCPeerConnectionClass = window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection;

    if (!RTCPeerConnectionClass) {
      console.error("WebRTC not supported in this browser");
    }

    this.pc = new RTCPeerConnection(this.peerConfiguration);

    this.localStream.getTracks().forEach((track) => {
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

    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];

      event.track.onended = () => {
        this.onRemoteStream?.(this.remoteStream);
      };

      event.track.onmute = () => {
        this.onRemoteStream?.(this.remoteStream);
      };

      event.track.onunmute = () => {
        this.onRemoteStream?.(this.remoteStream);
      };

      this.onRemoteStream?.(this.remoteStream);
    };

    this.pc.onconnectionstatechange = () => {
  if (this.remoteStream && this.onRemoteStream) {
    this.onRemoteStream(this.remoteStream);
  }
};

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

    for (const candidate of this.pendingIceCandidates) {
    await this.pc.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];
  }

  async addNewIceCandidate(iceCandidate) {
    if (!this.pc) return;

    if (!this.pc.remoteDescription) {
      this.pendingIceCandidates.push(iceCandidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(iceCandidate);
    } catch (err) {
      console.error("Error adding ICE candidate", err);
    }
  }

  async createOffer({ callerId, receiverId }) {
  try {
      const offer = await this.pc.createOffer();
      this.pc.setLocalDescription(offer);

      const offerpack = {
        offer,
        callerId,
        receiverId,
        didIOffer: true
      };
      this.socket.emit("newOffer", offerpack);
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  }

  async answerOffer() {
  try {
      const answer = await this.pc.createAnswer({});
      await this.pc.setLocalDescription(answer);

      const offerpack = {
        offer: answer,
        callerId: this.remoteId,
        receiverId: this.localId,
        didIOffer: false
      };
      this.socket.emit("newAnswer", offerpack);
      } catch (err) {
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