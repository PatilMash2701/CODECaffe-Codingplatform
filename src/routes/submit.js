const express=require('express');
const submitRouter=express.Router();
const userMiddleware=require('../middlewear/userMiddleware');
const {submitCode,runCode}=require('../functionForRoute/funForSubmitProblem');


submitRouter.post("/submit/:id",userMiddleware,submitCode);
submitRouter.post("/run/:id",userMiddleware,runCode);
    
module.exports=submitRouter;



