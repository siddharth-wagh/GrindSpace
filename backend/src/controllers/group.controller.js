
import Group from "../models/group.model.js";
export const createGroup = async (req,res)=>{
    try {
        const {name,description,isPublic,tags} = req.body;
        const leader = req.user._id;
       
        if(!name){
            return res.status(400).json({ message:"empty name"});
        }
        
        //todo: add logic for private room
        
        const group = await Group.create({
            name,
            description,
            tags,
            leader,
            coLeaders:[],
            members:[leader],
            jitsiRoomName: `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });

        if(!group){
            return res.status(400).json({ message:"invalid info"});
        }
        await User.findByIdAndUpdate(leader, {
                $push: { groups: group._id }
            });
        return res.status(200).json({
            data:group,
            message:"Group created successfully"
        });
    } catch (error) {
         return res.status(500).json({
            message:error.message,
            success:false
        })
    }
}
export const getAllGroups = async(req,res)=>{
    try {
        
        const userId = req.user._id;
       
        const userWithGroups  = await User.findById(userId).populate("groups");


          if (!userWithGroups) {
            return res.status(404).json({ message: "User not found" });
         }   
        return res.status(200).json({
            data:userWithGroups.groups,
            message:"Group fetched successfully"
        });
    } catch (error) {
         return res.status(500).json({
            message:error.message,
            success:false
        })
    }
}

export const joinGroup = async(req,res)=>{
    try {
        
        const userId = req.user._id;
        const groupId = req.params.groupId;
        //todo for private

        const group = await Group.findById(groupId);

       
        if(!group) {
             return res.status(404).json({ message: "group not found" });
        } 

        if (!group.members.includes(userId)) {
                await Group.findByIdAndUpdate(groupId, {
                $addToSet: { members: userId } // avoids duplicates
            });
        }

         await User.findByIdAndUpdate(userId, {
            $addToSet: { groups: groupId }
        });

        return res.status(200).json({
            data:true,
            message:"Group joined successfully"
        });
    } catch (error) {
         return res.status(500).json({
            message:error.message,
            success:false
        })
    }
}
