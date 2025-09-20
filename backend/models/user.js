const mongoose=require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friendCode: { type: String, unique: true },
  profilePic: { type: String, default: null },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

userSchema.pre("save", function (next) {
  if (!this.friendCode) {
    this.friendCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});
module.exports= mongoose.model('User', userSchema);
