import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema({
  // For server channel messages
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null,
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null,
  },
  // For DM messages
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  reactions: [reactionSchema],
}, { timestamps: true });

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
