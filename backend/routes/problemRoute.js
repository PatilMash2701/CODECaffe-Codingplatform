const express=require('express');
const problemRouter=express.Router();
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem}=require('../functionForRoute/funForProblemRoute');
const adminMiddleware=require('../middleware/adminMiddleware');
const userMiddleware=require('../middleware/userMiddleware');

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
 problemRouter.get("/allproblemsolvedbyuser",userMiddleware,solvedAllProblembyUser);
 //getsubmission for perticular problem
 problemRouter.get("/submissions/:pid",userMiddleware,submittedProblem);

 problemRouter.get("/submissionbyuser",userMiddleware,submittedProblem);

module.exports=problemRouter;