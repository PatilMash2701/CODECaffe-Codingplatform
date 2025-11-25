const axios = require('axios');


const getLanguageById=(lang)=>{
    const language={
        "c++":54,
        "java":62,
        "javascript":63
    }
    const id = language[lang.toLowerCase()];
    if (id === undefined) {
        throw new Error(`Unsupported language: ${lang}`);
    }
    return id;
}
const submitBatch=async (submissions)=>{
    
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
          base64_encoded: 'false'//make it false (very Important to avoid the errors)
          //because we dont convert our input into base64 while perform request (we direct apply it in json format)(so due to false it automatically covert json in base64 format)
        },
        headers: {
          'x-rapidapi-key': '5285c13c53msh38ffbb6749a1f38p106b81jsn50a327a7bbd3',
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        timeout:30000,
        data: {
          submissions
        }
      };
      //token equals no of element present in batch is returned in option
      //we again pass that token to judge0 using axios.request to get final result in fetchData function
      async function fetchData() {
          try {
              const response = await axios.request(options);
              return response.data;
          } catch (error) {
              console.error(error);
          }
      }
      
     return await fetchData();
}

const waiting=async(timer)=>{
   return new Promise(resolve => setTimeout(resolve, timer));
}


const submitToken=async(resultToken)=>{

  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',//make it false (very Important to avoid the errors) 
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': '5285c13c53msh38ffbb6749a1f38p106b81jsn50a327a7bbd3',
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };
  
  async function fetchData() {
    try {
      const response = await axios.request(options);
      if(!response || !response.data ){
        res.send("Error is related to get-fetch");
      }
      return response.data;
    } catch(error) {
      res.send("Error is in fetdata2");
    }
  }
  try{
     while(true){
        const result= await fetchData();
        const IsResultObtained=result.submissions.every((r)=>r.status_id>2);

         if(IsResultObtained){
            return result.submissions;
           }
         //we just want to find result of token who status is in queue or waiting 
         //other wise status_id>2==  3->means->accepted ,4->means->Rejected
         await waiting(1000);
       }
    }catch(err){
        res.send("Error:in judge0utility",err);
    }

}


module.exports={getLanguageById,submitBatch,submitToken};