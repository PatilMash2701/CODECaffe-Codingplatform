const Problem=require('../models/problem');
const {getLanguageById,submitBatch,submitToken}=require("./judge0Utility");

const madeProblem=async (problemData)=>{
    const {title,description,difficulty,tags,visibleTestCases,hiddenTestCases,startCode,referenceSolution}=problemData;

    try{
        for(const {language,completeCode} of referenceSolution){
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
                    return res.status(400).send("you code not satify to testcase and their result");
                }
            }
            
        }
        return true;//req.result._id is used from adminmiddleware
    }catch(err){
        res.send("Error :",err);
    }
}
module.exports=madeProblem;