const Problem=require('../models/problem');
const User=require('../models/user');
const Submission=require('../models/submission');
const {getLanguageById,submitBatch,submitToken}=require("../utils/judge0Utility");

const submitCode=async (req,res)=>{

    try{
        const userId=req.result._id;//in userMiddleware we put all information about user in req.result
        const problemId=req.params.id;
        const {code,languageId}=req.body;

        if(!userId||!code||!problemId||!languageId){
            return res.status(400).send("Some feild missing");
        }
        const problem=await Problem.findById(problemId);
        if(!problem){
            return res.send("problem is not fount for this id");
        }
        //console.log(problem);
        //we got hidden testcases from here that we can pass to judge0
        const getLanguageId=(lang)=>{
            const language={
                '54':"c++",
                '62':"java",
                '63':"javascript"
            }
            // const id = language[lang.toLowerCase()];
            // if (id === undefined) {
            //     throw new Error(`Unsupported language: ${lang}`);
            // }
            return language[lang];
        }
        const language='c++';

        const submittedResult=await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesPassed:0,
            status:'pending',
            testCasesTotal:problem.hiddenTestCases?.length || 0
        })
        //judge0 code ko submit kerwana hai
        console.log("length :",problem.hiddenTestCases?.length || 0);
       
        // Check if hiddenTestCases exists and has items
        if(!problem.hiddenTestCases || !Array.isArray(problem.hiddenTestCases) || problem.hiddenTestCases.length === 0){
            return res.status(400).send("No hidden testcases found in this problem");
        }
        
        const submissions=problem.hiddenTestCases.map((testcase)=>({
                source_code:code,
                language_id:Number(languageId),
                stdin:testcase.input,
                expected_output:testcase.output
        }))
        
        if(submissions.length === 0){
            return res.status(400).send("Failed to create submissions array");
        }
        
        const submitResult=await submitBatch(submissions);
        if(!submitResult){
            return res.status(500).send("Problem is Related to the submitResult");
        }
        if (!Array.isArray(submitResult)) {
            return res.status(500).send("Judge0 did not return a valid result.");
        }

        const resultToken=submitResult.map((value)=>value.token);
        let testResult=await submitToken(resultToken);
        console.log(testResult);
        let passTestCase=0;
        let repeat=0;
        let declareSign=0;
        let totalTime=0;
        let totalMemory=0;
        let n=problem.hiddenTestCases.length;
        let checkSuccess=new Array(n).fill(0);
        for(let [index,test] of testResult.entries()){
            if(test.status_id===3 && checkSuccess[index]!==3){
                passTestCase=passTestCase+1;
                totalTime+=parseFloat(test.time);
                totalMemory=Math.max(totalMemory,test.memory);
                checkSuccess[index]=3;
            }
            if(test.status_id>3){
                declareSign=test.status_id;
                break;
            }
            if(test.status_id<3){
                repeat=1;
            }
        }
        while(repeat==1){
            repeat=0;
            testResult=await submitToken(resultToken);
            for(const [index,test] of testResult.entries()){
                if(test.status_id===3 && checkSuccess[index]!=3){
                    passTestCase=passTestCase+1;
                    totalTime=parseFloat(test.time);
                    totalMemory+=Math.max(totalMemory,test.memory);
                    checkSuccess[index]=3;
                }
                if(test.status_id>3){
                    declareSign=test.status_id;
                    break;
                }
                if(test.status_id<3){
                    repeat=1;
                }
            }
            await new Promise(resolve=>setTimeout(resolve,1000));
        }
            if(passTestCase===problem.hiddenTestCases.length){
                submittedResult.status="accepted";
                //check that problem Id is present in the User.problemSolved
                const userProblem=req.result.problemSolved;
                if(!userProblem.includes(problemId)){
                    userProblem.push(problemId);
                }
                await req.result.save();
            }else if(declareSign===4){
                submittedResult.status="wrong";
            }else if(declareSign===5){
                submittedResult.status="timelimitexeeded";
            }else{
                submittedResult.status="error"
            }

            submittedResult.runtime=totalTime;
            submittedResult.memory=totalMemory;
            submittedResult.testCasesPassed=passTestCase;
            await submittedResult.save();
            return res.send(submittedResult);
        }catch(err){
            console.error("Error in submitCode:", err);
            // Check if response has already been sent
            if (!res.headersSent) {
                return res.status(500).send("Error: " + err.message);
            }
        }
    }

const runCode=async(req,res)=>{
    try{
        const userId=req.result._id;//in userMiddleware we put all information about user in req.result
        const problemId=req.params.id;
        const {code,language}=req.body;

        if(!userId||!code||!problemId||!language){
            return res.status(400).send("Some feild missing");
        }
        const problem=await Problem.findById(problemId);
        if(!problem){
            return res.send("problem is not fount for this id");
        }
        //console.log(problem);
        
        console.log("length :",problem.visibleTestCases?.length || 0);
        
        // Check if visibleTestCases exists and has items
        if(!problem.visibleTestCases || !Array.isArray(problem.visibleTestCases) || problem.visibleTestCases.length === 0){
            return res.status(400).send("No visible testcases found in this problem");
        }
        
        const languageId=getLanguageById(language);
        const submissions=problem.visibleTestCases.map((testcase)=>({
                source_code:code,
                language_id:languageId,
                stdin:testcase.input,
                expected_output:testcase.output
        }))
        
        if(submissions.length === 0){
            return res.status(400).send("Failed to create submissions array");
        }
        
        const submitResult=await submitBatch(submissions);
        if(!submitResult || !Array.isArray(submitResult)){
            return res.status(500).send("Problem is Related to the submitResult");
        }
        const resultToken=submitResult.map((value)=>value.token);
        let testResult=await submitToken(resultToken);
        return res.status(201).send(testResult);
        }catch(err){
            console.error("Error in runCode:", err);
            // Check if response has already been sent
            if (!res.headersSent) {
                return res.status(500).send("Error: " + err.message);
            }
        }

}
module.exports = {submitCode,runCode};