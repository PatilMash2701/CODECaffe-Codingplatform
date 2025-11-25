import React,{useEffect} from 'react';
import Signup from './components/signup';
import Login from './components/login';
import {BrowserRouter,Route,Routes} from 'react-router-dom';
import { Provider } from 'react-redux';
import Store from './store/store';
import {Navigate} from 'react-router';
import Homepage from './components/Homepage';
import {useDispatch,useSelector} from 'react-redux';
import { checkAuth } from './authSlice';
import AdminPanel from './components/AdminPanel';
import Edotor from './components/editorPage';
import IntoProblem from './components/IntoProblem';
import Profile from './components/profilePage';
import {UpdateProblem,UpdatePage} from './components/UpdateProblem';
import CreateProblem from './components/CreateProblem';
import DeleteProblem from './components/DeleteProblem';


function App() {
   const dispatch=useDispatch();
   const {isAuthenticated}=useSelector((state)=>state.auth);

   useEffect(()=>{
     dispatch(checkAuth());
   },[])
   return (
   <>
   <Routes>
    <Route path="/" element={isAuthenticated?<Homepage/>:<Navigate to='/login'/>}></Route>
    <Route path="/login" element={isAuthenticated?<Navigate to='/' />:<Login/>}></Route>
    <Route path="/signup" element={isAuthenticated?<Navigate to='/' />:<Signup/>}></Route>
    <Route path='/admin' element={<AdminPanel/>}></Route>
    <Route path='/admin/createproblem' element={<CreateProblem/>}></Route>
    <Route path='/admin/updateproblem' element={<UpdatePage/>}></Route>
    <Route path='/admin/updateproblem/:id' element={<UpdateProblem/>}></Route>
    <Route path='/admin/deleteproblem' element={<DeleteProblem/>}></Route>
    {/* <Route path='/admin/registerAdmin' element={<RegisterAdmin/>}></Route> */}
    <Route path='/editor' element={<Edotor></Edotor>}></Route>
    <Route path='/problem/:id' element={<IntoProblem/>}></Route>
    <Route path='/profile' element={<Profile/>}></Route>
   </Routes>
   </>
   )
}

export default App
