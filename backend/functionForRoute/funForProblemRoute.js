const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution
    } = req.body;

    try{
      // Validate required fields
      if(!title || !description || !difficulty) {
        return res.status(400).json({error: "Missing required fields: title, description, difficulty"});
      }

      if(!referenceSolution || !Array.isArray(referenceSolution) || referenceSolution.length === 0) {
        return res.status(400).json({error: "Reference solution is required and must be an array"});
      }

      if(!visibleTestCases || !Array.isArray(visibleTestCases) || visibleTestCases.length === 0) {
        return res.status(400).json({error: "At least one visible test case is required"});
      }

      // Validate test cases have required fields
      for(const tc of visibleTestCases) {
        if(!tc.input || !tc.output) {
          return res.status(400).json({error: "Each test case must have input and output"});
        }
      }

      // Validate reference solutions
      for(const sol of referenceSolution) {
        if(!sol.language || !sol.completeCode) {
          return res.status(400).json({error: "Each solution must have language and completeCode"});
        }
      }
       
      for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);


       console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).json({error: "One or more test cases failed validation"});
        }
       }

      }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).json({message: "Problem Saved Successfully", data: userProblem});
    }
    catch(err){
        console.error("Error in createProblem:", err);
        res.status(400).json({error: "Error: "+err.message});
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).json({error: "Missing ID Field"});
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).json({error: "ID is not present in server"});
    }
      
    for(const {language,completeCode} of referenceSolution){
         

      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).json({error: "One or more test cases failed validation"});
      }
     }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  return res.status(200).json({message: "Problem updated successfully", data: newProblem});
  }
  catch(err){
      return res.status(500).json({error: "Error: "+err.message});
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).json({error: "ID is Missing"});

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).json({error: "Problem is Missing"});


   return res.status(200).json({message: "Successfully Deleted", data: deletedProblem});
  }
  catch(err){
     
    return res.status(500).json({error: "Error: "+err.message});
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).json({error: "ID is Missing"});

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // video ka jo bhi url wagera le aao

   if(!getProblem)
    return res.status(404).json({error: "Problem is Missing"});

   const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).json({data: responseData});
   }
    
   return res.status(200).json({data: getProblem});

  }
  catch(err){
    return res.status(500).json({error: "Error: "+err.message});
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).json({message: "No problems found", data: []});


   return res.status(200).json({data: getProblem});
  }
  catch(err){
    return res.status(500).json({error: "Error: "+err.message});
  }
}


const solvedAllProblembyUser =  async(req,res)=>{

    try{

      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });

      if(!user) {
        return res.status(404).json({error: "User not found", data: []});
      }

      return res.status(200).json({data: user.problemSolved || []});

    }
    catch(err){
      console.error("Error in solvedAllProblembyUser:", err);
      return res.status(500).json({error: "Server Error", details: err.message});
    }
}

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    const filter = { userId };
    if (problemId) {
      filter.problemId = problemId;
    }

    const ans = await Submission.find(filter)
      .sort({ updatedAt: -1 })
      .populate('problemId', 'title difficulty');

    if (ans.length === 0) {
      return res.status(200).json({ message: 'No Submission is present', data: [] });
    }

    return res.status(200).json({ message: 'Submissions found', data: ans });
  } catch (err) {
    console.error('Error in submittedProblem:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


