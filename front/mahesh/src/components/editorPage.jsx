import Editor ,{DiffEditor ,useMonaco ,loader} from '@monaco-editor/react';
import React ,{useEffect,useRef} from 'react';


function Edotor(){
    

    return (
    <><Editor 
    height='50vh' 
    defaultLanguage='javascript' 
    defaultValue='code here'
    onMount={handleEditorDidMount}>
    </Editor >
    <button onClick={()=> console.log(editorRef.current.getValue())}>
        submit
    </button>
    </>)
}

export default Edotor;