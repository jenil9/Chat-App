export default class RTC {
    constructor(socket) {
      this.pc = null
      this.socket = socket
    }
  
    createConnection() {
      this.pc = new RTCPeerConnection()
  
      // Send ICE candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit("candidate", { candidate: event.candidate })
        }
      }
    }
  
    async createOffer() {
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)
      return offer
    }
  
    async handleOffer(data) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      return answer
    }
  
    async handleAnswer(data) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
    }
  
    async addIceCandidate(candidate) {
      if (candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    }
  }
  