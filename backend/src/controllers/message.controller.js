import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";


export const createMessage = async (req,res)=>{
    try {
       
        const {groupId} =  req.params;
        const sender = req.user._id;
        
        const {image,text} = req.body;
        
        const group = await Group.findById(groupId);
        if(!group) {
            return res.status(400).json({ message:"incorrect groupid" });
        } 
        if(!image && !text) {
            return res.status(400).json({ message:"provide some data" });
        } 
        let imageurl;
        if(image) {
             const uploadResponse = await cloudinary.uploader.upload(image);
             imageurl = uploadResponse.secure_url;
        }
        const message = await Message.create({
            group:group._id,
            sender,
            image:imageurl||null,
            text:text||""
        })
        if(!message)
        {
            return res.status(500).json({message:"invalid data"});
        }
        return res.status(201).json(
            {
                data:message,
                message:"message created successfully",
                
            })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            success:false
        })
    }
}

export const getAllMessagesFromGroup = async(req,res)=>{
      try {
    const groupId = req.params.groupId;
    const userId = req.user._id;

    // Optional: check if user is in this group (security)
    const isMember = await Group.exists({
      _id: groupId,
      members: userId
    });

    if (!isMember) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: -1 }) // latest first
      .limit(20)
      .populate("sender", "username profilePic");
   
    // Optional: reverse to show oldest → newest in UI
    return res.status(200).json({
      data: messages.reverse(),
      message: "Fetched recent messages"
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}