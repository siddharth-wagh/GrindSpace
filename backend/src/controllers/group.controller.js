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