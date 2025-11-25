const express=require('express');
const problemRouter=express.Router();
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,allProblemSolvedByUser,getSubmissions,getSubmissionUser}=require('../functionForRoute/funForProblemRoute');
const adminMiddleware=require('../middlewear/adminMiddleware');
const userMiddleware=require('../middlewear/userMiddleware');

//create
problemRouter.post("/create",adminMiddleware,createProblem);
//update
 problemRouter.put("/update/:id",adminMiddleware,updateProblem);
// //delete
 problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);
// //fetch
 problemRouter.get("/problembyid/:id",userMiddleware,getProblemById);
 problemRouter.get("/getallproblem",userMiddleware,getAllProblem);//black always be written below as compared to filled slash(/);
// //userSolvedproblem
 problemRouter.get("/allproblemsolvedbyuser",userMiddleware,allProblemSolvedByUser);
 //getsubmission for perticular problem
 problemRouter.get("/submissions/:pid",userMiddleware,getSubmissions);

 problemRouter.get("/submissionbyuser",userMiddleware,getSubmissionUser);

module.exports=problemRouter;