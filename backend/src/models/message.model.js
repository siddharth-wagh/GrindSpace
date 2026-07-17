import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
  edited: {
    type: Boolean,
    default: false,
  },
  problemMetadata: {
    type: {
      contestId: Number,
      index: String,
      name: String,
      rating: Number,
      tags: [String],
      solvedCount: Number,
      url: String,
    },
    default: null,
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
    index: true,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
