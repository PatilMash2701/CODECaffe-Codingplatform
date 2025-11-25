jwt=require('jsonwebtoken');
const User=require('../models/user');
const redisClient=require("../config/redis");
const adminMiddleware= async (req,res,next)=>{
    try{
        const {token}=req.cookies;
        if(!token){
            return res.status(406).json({ error: "Token is not present" });
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const {_id,role} = payload;

            if(!_id){
                return res.status(401).json({ error: "Id is missing from token" });
            }
            if(role!='admin'){
                throw new Error("User is not admin");
            }
            const result = await User.findById(_id);
            if(!result){
                return res.status(407).json({ error: "User doesn't exist" });
            }

            //Redis ke blocklist main present toh nahi hai
            const IsBlocked = await redisClient.exists(`token:${token}`);
            if(IsBlocked){
                return res.status(408).json({ error: "Token has been invalidated" });
            }

            req.result = result;
            next();
        } catch (err) {
            return res.status(409).send("Error: "+err);
        }
    }
    catch(err){
        res.status(412).send("Error+middleware:"+err);
    }
}

module.exports=adminMiddleware;