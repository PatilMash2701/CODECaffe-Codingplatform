const {getLanguageById,submitBatch,submitToken}=require("../utils/judge0Utility");
const Problem=require("../models/problem");
const madeProblem=require('../utils/Validproblem');
const Submission = require("../models/submission");


const createProblem=async (req,res)=>{
    const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution}=req.body;

    try{
        for(const {language,completeCode} of referenceSolution){
             
            //source_code:
            // langauge_id:
            //stdin:
            //expectedOutput
            const languageId=getLanguageById(language);
             
            //I am creating batch submission for each languauge each....
            const submissions=visibleTestCases.map((testcase)=>({
                 source_code:completeCode,
                 language_id:languageId,
                 stdin:testcase.input,
                 expected_output:testcase.output
            }));
            const submitResult=await submitBatch(submissions);

            const resultToken=submitResult.map((value)=>value.token);
            const testResult=await submitToken(resultToken);

            for(const test of testResult){
                if(test.status_id!=3){
                    return res.status(411).send("you code not satify to testcase and their result");
                }
            }
            
        }
        //we can store it into database
        const userProblem= await Problem.create({...req.body,problemCreator:req.result._id});//req.result._id is used from adminmiddleware
        //req.result contain object related to user we identified from the token coming to server understand which is useful in further processes also
        console.log("Problem generated successfully");
        res.status(201).json({ message: "Problem created!" });//at the end send is always mandetory
    }catch(err){
        res.status(400).json({ error: err.message });
    }
}

const updateProblem= async (req,res)=>{
     const {id}=req.params;
     try{
        if(!id){
            res.status(400).send("Invalid Id send");
        }
        const oldProblem=await Problem.findById(id);
        if(!oldProblem){
            res.status(400).send("No problem present with this Id");
        }
        const newProblemStatus=madeProblem(req.body);
        if(!newProblemStatus){
            res.send("There is error related to new problem creation");
        }
        const newProblem=await Problem.findByIdAndUpdate(id,{...req.body,problemCreator:req.result._id},{runValidators:true,new:true});
        return res.send("problem get updated Successfully");
     }catch(err){
        return res.send("Error:"+err.message);
     }
}
const deleteProblem=async (req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
            return res.status(400).send("Id is missing");
        }
        const deletedProblem=await Problem.findByIdAndDelete(id);
        if(!deletedProblem){
            return res.status(404).send("problem is missing with this Id");
        }
        return res.status(200).send("Successfully Deleted");
    }catch(err){
        return res.status(500).send("Error :"+err);
    }
}

const getProblemById=async(req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
            return res.status(400).send("Id is missing");
        }
        const problem=await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution');
        if(!problem){
            return res.send("No such a Problem is present of id");
        }
        return res.status(200).send(problem);

    }catch(err){
            return res.status(500).send("Error :"+err);
    }
}
const getAllProblem=async(req,res)=>{
    //PAGINATION:
    //localhost:3000/problem/getallproblem?page=2&limit=10
    // const page=2;
    // const limit=10
    // const skip=(page-1)*limit;
    //await Problem.find().skip(10).limit(10)

    //filtering

    //await problem.find({difficulty:"easy",tags:"arrays"});
    //problem.find({votes:{$gte:100},tags:{$in:["array","hashmap"]}})  //gte:greaterthanequalto

    try{
        const getProblem=await Problem.find({}).select('_id title difficulty tags');
        if(!getProblem.length===0){
             return res.send(404).send("Problem is missing");
        }
        return res.status(200).send(getProblem);
    }catch(err){
        res.status(500).send("Error : "+err);
    }
}

const allProblemSolvedByUser=async (req,res)=>{
    const user=req.result;//due to userMiddleware
   //we use ref here to find information of all the submission in one-go
   try{
      const userProbe=await user.populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      res.status(200).send(userProbe.problemSolved);
   }catch(err){
      res.send("err at allproblemsolvedbyuser :",err);
   }

    
}
const getSubmissions=async(req,res)=>{
    const user = req.result._id;
    const problemId=req.params.pid;
    try{
        const result=await Submission.find({userId:user,problemId:problemId});
        if(result.length==0){
            res.status(200).send("No Submission is present");
        }
        res.status(200).send(result);

    }catch(err){
        res.status(400).send("Error (related to problemsubmissions) :",err);
    }
}

const getSubmissionUser= async(req,res)=>{
    const user=req.result._id;
    try{
        const result=await Submission.find({userId:user});
        if(result.length==0){
            res.status(200).send('No Submission is present');
        }
        res.status(200).send(result);
    }catch(err){
        res.status(400).send('Error related to problem submissions')
    }
}
module.exports={createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,allProblemSolvedByUser,getSubmissions,getSubmissionUser};