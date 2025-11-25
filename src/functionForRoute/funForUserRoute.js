const User=require('../models/user');
const validate=require('../utils/validator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const redisClient=require('../config/redis');
const Submission=require('../models/submission');



const register=async(req,res)=>{
    try{
        //validate the data
        validate(req.body);

        const {firstName,emailId,password} = req.body;
        //very Important step password hashing....
        req.body.password=await bcrypt.hash(password,10)//salt get automatically generated and no of round we pass it for salt generation
        req.body.role='user';
        const user=await User.create(req.body);
        //jwt-token 
        const token=jwt.sign(
            {_id:user._id,emailId:user.emailId,role:user.role},//payload
            process.env.JWT_KEY,
            {expiresIn:3600}
        );
        const reply={
            firstName:user.firstName,
           emailId:user.emailId,
           _id:user._id
        }
        res.cookie('token',token,{
            httpOnly:true,
            secure: false,
            sameSite:'lax',
            path:"/"});
        
        res.status(201).json({
            user:reply,
            message:"Registered Successfully"
        });
    }catch(err){
         res.status(400).send("Error +register: "+err);
    }
}


const login=async (req,res)=>{
    try{
        const {emailId,password}=req.body;
        if(!emailId){
            throw new Error("invalid Credentials");
        }
        if(!password){
            throw new Error("invalid Credentials"); 
        }
        const user = await User.findOne({emailId:emailId});
        if(!user) {
            throw new Error("User not found");
        }
        //bcrypt.compare(plainTextPassword,hashedPassword);
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            throw new Error("invalid Credentials");
        }
        //token
        const token=jwt.sign(
            {_id:user._id,emailId:user.emailId,role:user.role},//payload
            process.env.JWT_KEY,
            {expiresIn:3600}
        );

        const reply={
            firstName:user.firstName,
           emailId:user.emailId,
           _id:user._id
        }
        res.cookie('token',token,{
            httpOnly:false,
            secure: false,
            sameSite:'lax',
            path:"/"});
        
        res.status(200).json({
            user:reply,
            message:"Login Successfully"
        });

    }
    catch(err){
        res.status(502).json({success:false,error:err.message});
    }
}

//logout feature
const logout=async (req,res)=>{
    try{
        //validate the token
        const {token}=req.cookies;
        if(!token) {
            throw new Error("No token found");
        }
        const payload=jwt.verify(token, process.env.JWT_KEY);
        //token add to reddis till its time frame
        await redisClient.set(`token:${token}`,'Block');
        await redisClient.expireAt(`token:${token}`,payload.exp);
        //cookies ko clear karo

        //verify it was added or not (optional )
        const isBlocked = await redisClient.exists(`token:${token}`);
        if(!isBlocked){
            throw new Error('Failed to block token');
        }
        //res.cookie("token",null,{expireAt:new Date(Date.now())});
        // res.clearCookie('token',{
        //        httpOnly: true,
        //        secure:true,
        //        sameSite:'strict',
        //        path:'/'
        // });

        res.cookie("token" , "fuzzyInvalidValue" ,{
            httpOnly:false,
            secure: true,
            sameSite:'strict',
            path:"/",
            expires:new Date(0)
    })
        res.send("Logged out Successfully");
    }catch(err){
        res.status(503).json({error:err.message});
    }
}

const adminRegister=async(req,res)=>{
    try{
        //validate the data
        validate(req.body);

        const {firstName,emailId,password} = req.body;
        //very Important step password hashing....
        req.body.password=await bcrypt.hash(password,10)//salt get automatically generated and no of round we pass it for salt generation
        req.body.role='admin';
        const user=await User.create(req.body);
        //jwt-token 
        const token=jwt.sign(
            {_id:user._id,emailId:user.emailId,role:user.role},//payload
            process.env.JWT_KEY,
            {expiresIn:3600}
        );
        res.cookie('token',token,{maxAge:3600000});
        res.status(201).send("User Registered Successfully");
    }catch(err){
         res.status(400).send("Error +register: "+err);
    }
}

const deleteProfile=async (req,res)=>{
    try{
        const userId=req.result_id;
        //userSchema delete
        await User.findByIdAndDelete(userId);
        //submission se bhi delete kare
        //await Submission.deleteMany({userId:userId});
        res.status(200).send("Deleted Successfully");

    }catch(err){
        res.status(500).send("Internal Server Error");
    }
}
const getRole=async (req,res)=>{
    const token=req.cookies.token;
    const decoded = jwt.verify(token,process.env.JWT_KEY);
    res.json({role:decoded.role});
}

module.exports={register,login,logout,adminRegister,deleteProfile,getRole};