const mongoose=require('mongoose');

// Flat, append-only message model optimized for pagination and delivery state
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for efficient reads
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

  