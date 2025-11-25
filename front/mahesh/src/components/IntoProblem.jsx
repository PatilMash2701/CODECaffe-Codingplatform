import './IntoProblem.css';
import { useParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import React,{useState,useEffect,useRef} from 'react';
import Editor ,{DiffEditor ,useMonaco ,loader} from '@monaco-editor/react';

function IntoProblem(){

    const {id}=useParams();
    const [problem,setProblem]=useState({});
    const [submitResult,setSubmitResult]=useState('Code Not submit yet');
    const [runResult,setRunResult]=useState('Code Not run yet');
    const [left,setLeft]=useState('description');
    const [right,setRight]=useState('code');
    const [lang,setLang]=useState('cpp');
    const [solution,setSolution]=useState([]);
    const [totalStartCode,setTotalStartCode]=useState([]);
    const [startCode,setStartCode]=useState("Code here ");
    const [code,setCode]=useState('code here');
    const [totalSubmissions,setSubmissions]=useState([]);
    const [showCodeMap,setShowCodeMap]=useState({});
    const [testMap,setTestMap]=useState({});
    const editorRef=useRef(null);

    function handleEditorDidMount(editor,monaco){
        editorRef.current=editor;
    }
    
    const submitProblem=async (data)=>{
        try{
            const languageMap = {
                cpp: '54',
                java: '62',
                javascript: '63'
            };
            const monacoLang = editorRef.current.getModel().getLanguageId();
            const pass = {
                code: code,
                languageId: languageMap[monacoLang]
            };
            const result=await axiosClient.post(`submission/submit/${id}`,pass);
            setSubmitResult(result.data);
            setRight('result')
        }catch(error){
            console.log("error related to submission of the problem",error);
        }
    }
    const runProblem=async (data)=>{
        try{
            const languageMap = {
                cpp: '54',
                java: '62',
                javascript: '63'
            };
            const monacoLang = editorRef.current.getModel().getLanguageId();
            const pass = {
                code: editorRef.current.getValue(),
                languageId: languageMap[monacoLang]
            };
            const result=await axiosClient.post(`submission/run/${id}`,pass);
            setRunResult(result);
            setRight('result');
        }catch(error){
            console.log("error related to submission of the problem",error);
        }
    }

    useEffect(()=>{
        const fetchProblem=async()=>{
            try{
                const data = await axiosClient.get(`/problem/problembyid/${id}`);
                console.log(data.data);
                setProblem(data.data);
                setSolution(data.data.referenceSolution);
                setTotalStartCode(data.data.startCode);

            }catch(error){
                console.error('problem dont get fetched')
            }
        }
        fetchProblem();
    },[]);

    useEffect(()=>{
        const submiss=async()=>{
              const submissions= await axiosClient.get(`/problem/submissions/${id}`);
              setSubmissions(submissions);
        }
        submiss();
    },[submitResult])

    return (
        <>
        <div className="into-problem-container">
        <div className="leftside">
        <div className="leftbtn">
            <button onClick={()=>setLeft('description')} className={left=='description'?'specialbtn':'navbtn'}>Description</button>
            <button onClick={()=>setLeft('editorial')} className={left=='editorial'?'specialbtn':'navbtn'}>Editorial</button>
            <button onClick={()=>setLeft('solutions')} className={left=='solutions'?'specialbtn':'navbtn'}>Solutions</button>
            <button onClick={()=>setLeft('submissions')} className={left=='submissions'?'specialbtn':'navbtn'}>Submissions</button>
        </div>
        {left==='description' && (
        <div className="problem-description">
        <h1 className="problem-title">{problem.title}</h1>
        <h3 className="problem-statement">{problem.description}</h3>
        {problem.visibleTestCases && problem.visibleTestCases.map((testcase,index)=>(
            <div key={index*3} className="testcase-box">
                <h4>Input:</h4>
                <pre>{testcase.input}</pre>
                <h4>Output:</h4>
                <pre>{testcase.output}</pre>
                <h4>Explanation:</h4>
                <p>{testcase.explanation}</p>
            </div>
        ))}
        </div>
        )}
        {left==='editorial' && (
            <div className="editorial-section">
            <h2>Editorial coming soon...</h2>
            </div>
        )}
        {left==='solutions' && (
            <div className="solutions-section">
                {solution.map((sol,index)=>(
                    <div key={index*4} className="solution-box">
                    <h3>{sol.language}</h3>
                    <pre><code>{sol.completeCode}</code></pre>
                    </div>
                ))}
            </div>
        )}
        {left==='submissions' && (
            <div className="submissions-section">
                {totalSubmissions.data.map((sub,index)=>(
                        <div key={sub._id || index} className="submission-card">
                            <div className="submission-info">
                                <h3 className={sub.status=='accepted'?'status-accepted':'status-rejected'}>{sub.status}</h3>
                                <h5>{sub.updatedAt}</h5>
                                <p>{sub.language}</p>
                                <p>{sub.status!='accepted'?'N/A':sub.runtime} ms</p>
                                <p>{sub.status!='accepted'?'N/A':sub.memory} MB</p>
                                <button className="view-btn" onClick={()=>setShowCodeMap(prev => ({...prev,[sub._id]:!prev[sub._id]}))}>{showCodeMap[sub._id]==1?"Hide":"View"}</button>
                            </div>
                                <div>{showCodeMap[sub._id]?<div className="submission-code">
                                       <p>{`TestCase Passed:${sub.testCasesPassed}/${sub.testCasesTotal}`}</p>
                                       <pre>
                                            <code>{sub.code}</code>
                                       </pre>
                                       </div>:" "}
                                </div>
                        </div>
                ))}
            </div>
        )}
        </div>

        <div className="rightside">
        <div className="rightbtn">
            <button onClick={()=>setRight('code')} className={right=='code'?'specialbtn':'navbtn'}>Code</button>
            <button onClick={()=>setRight('testCases')} className={right=='testCases'?'specialbtn':'navbtn'}>TestCases</button>
            <button onClick={()=>setRight('result')} className={right=='result'?'specialbtn':'navbtn'}>Result</button>
        </div>
            
        {right==='code' && (
            <div className="code-editor-section">
              <div className="language-select">
                 <select value={lang} onChange={(e)=>setLang(e.target.value)}>
                    <option value='javascript'>Javascript</option>
                    <option value='java'>Java</option>
                    <option value='cpp'>C++</option>
                 </select>
              </div>
        
              <Editor 
                 height='70vh' 
                 defaultLanguage={lang} 
                 value={code}
                 defaultValue={code}
                 onChange={(value) => setCode(value)}
                 onMount={handleEditorDidMount}>
              </Editor >
              <div className="editor-actions">
                <button className="run-btn" onClick={()=>runProblem(editorRef.current)}>Run</button>
                <button className="submit-btn" onClick={()=>submitProblem(editorRef.current)}>Submit</button>
              </div>
            </div>
        )}

        {right==='testCases' && (
              <div className="testcase-section">
              {problem.visibleTestCases.map((testCase,index)=>(
                <div key={index} className="testcase-toggle">
                  <button onClick={() =>setTestMap((prev)=>({...prev,[index]:!prev[index]}))}>
                     {`TestCase ${index+1}`}
                  </button>
                  {testMap[(index)/2]==1 && (
                    <div className="testcase-content">
                      <p>{`Input : ${testCase.input}`}</p>
                      <p>{`Output : ${testCase.output}`}</p>
                    </div>
                  )}
                </div>
              ))}
              </div>
        )}
        {right==='result' && (
            <div className="result-section">
                <h3>Status : {submitResult.status}</h3>
                <h3>TestCase Passed: {submitResult.testCasesPassed}</h3>
                <h3>Total Testcases: {submitResult.testCasesTotal}</h3>
                <h3>Runtime: {submitResult.runtime}</h3>
                <h3>Memory: {submitResult.memory}</h3>
                {submitResult.errorMessage && (
                    <h2>Error: {submitResult.errorMessage}</h2>
                )}
            </div>
        )}
        </div>
        </div>
        </>
    )
}
export default IntoProblem;
