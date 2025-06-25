import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },

  isPublic: {
    type: Boolean,
    default: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coLeaders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: {
  type: [String],
  default: [],
  validate: [arrayLimit, 'You can add up to 5 tags only']
  },
  jitsiRoomName: {
    type: String,
    required: true,
    unique: true
  },
  joinToken: {
  type: String,
  select: false
}

 
},{timstamps:true});

function arrayLimit(val) {
  return val.length <= 5; // Limit to 5 tags
}

const Group = mongoose.model('Group', groupSchema);
export default Group;
