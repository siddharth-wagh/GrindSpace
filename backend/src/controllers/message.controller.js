import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import cloudinary from "../lib/util.js"
export const createMessage = async (req,res)=>{
    try {
        const {groupId} =  req.params;
        const sender = req.body;
        const {image,text} = req.body;
        const group = await Group.findById(groupId);
        if(!group) {
            return res.status(400).json({
                error:{
                    message:"incorrect groupid"
                },
                success:false
            });
        } 
        if(image) {

        }

    } catch (error) {
        return res.status(500).json({
            error:error,
            success:false
        })
    }
}