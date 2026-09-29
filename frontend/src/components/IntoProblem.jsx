import './IntoProblem.css';
import { useParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import React,{useState,useEffect,useRef} from 'react';
import Editor ,{DiffEditor ,useMonaco ,loader} from '@monaco-editor/react';
import ChatAi from './iSmart';

function IntoProblem(){

    const {id}=useParams();
    const [problem,setProblem]=useState({});
    const [executionResult,setExecutionResult]=useState(null);
    const [resultMode,setResultMode]=useState(null);
    const [isRunning,setIsRunning]=useState(false);
    const [isSubmitting,setIsSubmitting]=useState(false);
    const [left,setLeft]=useState('description');
    const [right,setRight]=useState('code');
    const [lang,setLang]=useState('cpp');
    const [solution,setSolution]=useState([]);
    const [totalStartCode,setTotalStartCode]=useState([]);
    const [startCode,setStartCode]=useState("Code here ");
    const [code,setCode]=useState('code here');
    const [totalSubmissions,setSubmissions]=useState([]);
    const [showCodeMap,setShowCodeMap]=useState({});
    const editorRef=useRef(null);

    function handleEditorDidMount(editor,monaco){
        editorRef.current=editor;
    }

    const getCurrentCode = () => {
        if (editorRef.current) {
            return editorRef.current.getValue();
        }
        return code || '';
    };
    
    const getEditorCode = () => {
        if (editorRef.current) {
            return editorRef.current.getValue();
        }
        return code || '';
    };

    const submitProblem = async () => {
        try {
            const editorCode = getEditorCode();
            if (!editorCode.trim()) {
                alert('Please write some code before submitting');
                return;
            }

            setIsSubmitting(true);
            const result = await axiosClient.post(`submission/submit/${id}`, {
                code: editorCode,
                language: lang,
            });
            setExecutionResult(result.data);
            setResultMode('submit');
            setRight('result');
        } catch (error) {
            console.error('Error submitting problem:', error.response?.data || error.message);
            alert(`Submit failed: ${error.response?.data?.error || error.response?.data?.details || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const runProblem = async () => {
        try {
            const editorCode = getEditorCode();
            if (!editorCode.trim()) {
                alert('Please write some code before running');
                return;
            }

            setIsRunning(true);
            const result = await axiosClient.post(`submission/run/${id}`, {
                code: editorCode,
                language: lang,
            });
            setExecutionResult(result.data);
            setResultMode('run');
            setRight('result');
        } catch (error) {
            console.error('Error running problem:', error.response?.data || error.message);
            alert(`Run failed: ${error.response?.data?.error || error.response?.data?.details || error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(()=>{
        const fetchProblem=async()=>{
            try{
                const data = await axiosClient.get(`/problem/problembyid/${id}`);
                console.log('Problem data:', data);
                
                // Handle response structure - could be data.data or data
                const problemData = data.data?.data || data.data;
                
                if(problemData) {
                    setProblem(problemData);
                    setSolution(Array.isArray(problemData.referenceSolution) ? problemData.referenceSolution : []);
                    setTotalStartCode(Array.isArray(problemData.startCode) ? problemData.startCode : []);
                }

            }catch(error){
                console.error('Problem fetch failed:', error);
            }
        }
        fetchProblem();
    },[]);

    useEffect(()=>{
        const submiss=async()=>{
            try{
                const submissions= await axiosClient.get(`/problem/submissions/${id}`);
                console.log('Submissions data:', submissions);
                setSubmissions(submissions.data.data || []);
            }catch(error){
                console.error('Error fetching submissions:', error);
                setSubmissions([]);
            }
        }
        submiss();
    },[executionResult])

    return (
        <>
        <div className="into-problem-container">
        <div className="leftside">
        <div className="leftbtn">
            <button onClick={()=>setLeft('description')} className={left=='description'?'specialbtn':'navbtn'}>Description</button>
            <button onClick={()=>setLeft('editorial')} className={left=='editorial'?'specialbtn':'navbtn'}>Editorial</button>
            <button onClick={()=>setLeft('solutions')} className={left=='solutions'?'specialbtn':'navbtn'}>Solutions</button>
            <button onClick={()=>setLeft('submissions')} className={left=='submissions'?'specialbtn':'navbtn'}>Submissions</button>
            <button onClick={()=>setLeft('ismart')} className={left=='ismart'?'specialbtn':'navbtn'}>iSmart AI</button>
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
                {Array.isArray(solution) && solution.length > 0 ? (
                    solution.map((sol,index)=>(
                        <div key={index*4} className="solution-box">
                        <h3>{sol.language}</h3>
                        <pre><code>{sol.completeCode}</code></pre>
                        </div>
                    ))
                ) : (
                    <p>No solutions available</p>
                )}
            </div>
        )}
        {left==='ismart' && (
            <div className="ismart-section">
                <ChatAi
                    problem={problem}
                    getCurrentCode={getCurrentCode}
                    language={lang}
                />
            </div>
        )}
        {left==='submissions' && (
            <div className="submissions-section">
                <table className="submissions-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Language</th>
                            <th>Runtime</th>
                            <th>Memory</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(totalSubmissions) && totalSubmissions.length > 0 ? (
                            [...totalSubmissions].reverse().map((sub, index) => (
                                <React.Fragment key={sub._id || index}>
                                    <tr>
                                        <td>
                                            <span className={`status-badge ${sub.status === 'accepted' ? 'status-accepted' : 
                                                sub.status === 'pending' ? 'status-pending' : 'status-error'}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td>{new Date(sub.updatedAt).toLocaleString()}</td>
                                        <td>{sub.language}</td>
                                        <td>{sub.status === 'accepted' ? `${sub.runtime} ms` : 'N/A'}</td>
                                        <td>{sub.status === 'accepted' ? `${sub.memory} MB` : 'N/A'}</td>
                                        <td>
                                            <button 
                                                className="view-btn" 
                                                onClick={() => setShowCodeMap(prev => ({
                                                    ...prev,
                                                    [sub._id]: !prev[sub._id]
                                                }))}
                                            >
                                                {showCodeMap[sub._id] ? 'Hide Code' : 'View Code'}
                                            </button>
                                        </td>
                                    </tr>
                                    {showCodeMap[sub._id] && (
                                        <tr>
                                            <td colSpan="6" className="submission-details-cell">
                                                <div className="submission-details">
                                                    <div className="submission-stats">
                                                        <span className="stat-item">Test Cases Passed: {sub.testCasesPassed || 0} / {sub.testCasesTotal || 0}</span>
                                                        <span className="stat-item">Runtime: {sub.runtime || 'N/A'} ms</span>
                                                        <span className="stat-item">Memory: {sub.memory || 'N/A'} KB</span>
                                                    </div>
                                                    <div className="submission-code">
                                                        <pre>
                                                            <code>{sub.code}</code>
                                                        </pre>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-submissions">
                                    No submissions yet. Submit your code to see results here.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
                <button className="run-btn" onClick={runProblem} disabled={isRunning || isSubmitting}>
                  {isRunning ? 'Running…' : 'Run'}
                </button>
                <button className="submit-btn" onClick={submitProblem} disabled={isRunning || isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
        )}

        {right==='testCases' && (
              <div className="testcase-section">
                {problem.visibleTestCases?.length > 0 ? (
                  problem.visibleTestCases.map((testCase, index) => (
                    <div key={index} className="testcase-card">
                      <h4 className="testcase-card-title">Test Case {index + 1}</h4>
                      <div className="testcase-field">
                        <span className="testcase-label">Input</span>
                        <pre className="testcase-value">{testCase.input}</pre>
                      </div>
                      <div className="testcase-field">
                        <span className="testcase-label">Output</span>
                        <pre className="testcase-value">{testCase.output}</pre>
                      </div>
                      {testCase.explanation && (
                        <div className="testcase-field">
                          <span className="testcase-label">Explanation</span>
                          <p className="testcase-explanation">{testCase.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="testcase-empty">No visible test cases for this problem.</p>
                )}
              </div>
        )}
        {right==='result' && (
            <div className="result-section">
                {!executionResult ? (
                    <p className="result-placeholder">Run your code against visible test cases, or Submit to judge all hidden tests.</p>
                ) : (
                    <>
                <p className="result-mode-badge">
                    {resultMode === 'run' ? 'Run — visible test cases' : 'Submit — all test cases'}
                </p>
                <h3>Status: {executionResult.accepted ? 'Accepted' : 'Rejected'}</h3>
                <h3>Passed: {executionResult.passedTestCases ?? 0} / {executionResult.totalTestCases ?? '—'}</h3>
                <h3>Runtime: {executionResult.runtime ?? 0} ms</h3>
                <h3>Memory: {executionResult.memory ?? 0} KB</h3>
                {executionResult.errorMessage && (
                    <pre className="result-error">{executionResult.errorMessage}</pre>
                )}
                {executionResult.testResults?.length > 0 && (
                    <div className="result-tests-list">
                        <h3>Per test case</h3>
                        {executionResult.testResults.map((test, index) => (
                            <div
                                key={index}
                                className={`result-test-item ${test.status_id === 3 ? 'passed' : 'failed'}`}
                            >
                                <strong>Test {test.testIndex ?? index + 1}</strong>
                                {' — '}
                                {test.status_id === 3 ? 'Passed' : 'Failed'}
                                {test.input != null && (
                                    <p><span>Input:</span> {test.input}</p>
                                )}
                                {test.expected != null && (
                                    <p><span>Expected:</span> {test.expected}</p>
                                )}
                                {test.stdout && (
                                    <p><span>Your output:</span> {test.stdout.trim()}</p>
                                )}
                                {(test.stderr || test.compile_output) && (
                                    <pre className="result-stderr">{test.stderr || test.compile_output}</pre>
                                )}
                                <p className="result-meta">Time: {test.time} s · Memory: {test.memory} KB</p>
                            </div>
                        ))}
                    </div>
                )}
                    </>
                )}
            </div>
        )}
        </div>
        </div>
        </>
    )
}
export default IntoProblem;
