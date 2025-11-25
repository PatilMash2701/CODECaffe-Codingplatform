const express=require('express');
const authRouter=express.Router();
const {register,login,logout,adminRegister,deleteProfile,getRole}=require('../functionForRoute/funForUserRoute');
const adminMiddleware=require('../middlewear/adminMiddleware');

const userMiddleware = require('../middlewear/userMiddleware');
//Register
authRouter.post('/register',register);
authRouter.post('/admin/register',adminMiddleware,adminRegister);

//login
authRouter.post('/login',login);

//logout
authRouter.post('/logout',userMiddleware,logout);
//deleteProfile
authRouter.delete('/deleteprofile',userMiddleware,deleteProfile);
//getProfile
//authRouter.get('/getProfile',getProfile);
authRouter.get('/role',userMiddleware,getRole);
authRouter.get('/check',userMiddleware,(req,res)=>{
    try{
    const reply={
        firstName:req.result.firstName,
        emailId:req.result.emailId,
        _id:req.result._id
    }
    res.status(200).json({
        user:reply,
        message:"Valid User"
    })
}catch(error){
    res.status(901).send('checkerror',error);
}
})

module.exports=authRouter;