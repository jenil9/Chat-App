const mongoose=require('mongoose');
const {User}=require('./index');

const pendingSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }, { timestamps: true });


module.exports=mongoose.model("Pending",pendingSchema);