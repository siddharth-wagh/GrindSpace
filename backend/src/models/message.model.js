import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index:true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String // for text messages
  },
  image: {
    type: String // for image URL if message has an image
  },
},{timestamps:true});

messageSchema.index({ group: 1, createdAt: -1 });//indexing for latest msg sorting and kepping same group msg together

const Message = mongoose.model('Message', messageSchema);
export default Message;
