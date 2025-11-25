const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const {Schema}=mongoose;

const userSchema=new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:3,
        maxLength:20,
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20,
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim:true//to remove whitespaces from front and backside
    },
    age:{
        type:Number,
        min:6,
        max:80
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }],//array of name of question
        unique:true
    },
    password:{
        type:String,
        required:true
    }
},{timestamps:true});

userSchema.post('findOneAndDelete',async function (userInfo){//after execution of every findByIdAndDelete function this fuction gets called and 
    //the deleted user data get returned in userInfo argument
    //so for deleting this info from other database model we direct use procedure written given below....
    if(userInfo){
        await mongoose.model('submission').deleteMany({userId:userInfo._id});
    }
})

const User=mongoose.model('user',userSchema);//'user' is name passed of collection which get build for model User(it automatically convert user into plural(users));
module.exports=User;