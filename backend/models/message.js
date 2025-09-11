const {User}=require('./index');
const mongoose=require('mongoose');
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        text: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  }, { timestamps: true });


module.exports= mongoose.model('Message', messageSchema);

  