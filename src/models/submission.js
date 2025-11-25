const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    problemId:{
        type:Schema.Types.ObjectId,
        ref:'problem',
        required:true
    },
    code:{
        type:'string',
        required:true
    },
    language:{
        type:String,
        required:true,
        enum:['javascript','c++','java']
    },
    status:{
        type:String,
        enum:['pending','accepted','wrong','error','timelimitexeeded'],
        default:'pending'
    },
    runtime:{
        type:Number,
        default:0
    },
    memory:{
        type:Number,
        default:0
    },
    errorMessage:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0
    },
    testCasesTotal:{
        type:Number,
        default:0
    }
},{timestamps:true});

//here we find submission for perticular problem for perticular user most repeatedly and frequently so we create indexing on it
submissionSchema.index({userId:1 ,problemId:1});

const Submission=mongoose.model('submission',submissionSchema);
module.exports=Submission;