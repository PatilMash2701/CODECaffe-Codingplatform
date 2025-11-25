const validator=require('validator');



const validate=(data)=>{
    const mandatoryField=['firstName','emailId','password'];
    const isAllowed=mandatoryField.every((k)=>Object.keys(data).includes(k));
    //const isAllowed=mandatoryField.every((key)=>key in data);
    if(!isAllowed){
          throw new Error("field missing");
    }
    if(!validator.isEmail(data.emailId)){
          throw new Error("Invalid Email");
    }
//     if(!validator.isStrongPassword(data.password)){
//           throw new Error("Weak Password");
//     }
}
module.exports=validate;