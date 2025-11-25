const jwt=require('jsonwebtoken');
const User=require('../models/user');
const redisClient=require("../config/redis");
const userMiddleware= async (req,res,next)=>{
    try{
        const {token}=req.cookies;
        if(!token){
            return res.status(101).json({ error: "Token is not present" });
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const {_id} = payload;

            if(!_id){
                return res.status(102).json({ error: "Id is missing from token" });
            }

            const result = await User.findById(_id);
            if(!result){
                return res.status(103).json({ error: "User doesn't exist" });
            }

            //Redis ke blocklist main present toh nahi hai
            const IsBlocked = await redisClient.get(`token:${token}`);
            if(IsBlocked){
                return res.status(104).json({ error: "Token has been invalidated" });
            }

            req.result = result;
            next();
        } catch (jwtError) {
            return res.status(105).json({ error: "Invalid token" });
        }
    }
    catch(err){
        res.send("Error+middleware:"+err);
    }
}

module.exports=userMiddleware;