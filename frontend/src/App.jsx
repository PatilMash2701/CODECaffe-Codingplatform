import React,{useEffect} from 'react';
import Signup from './components/signup';
import Login from './components/login';
import {Route,Routes} from 'react-router-dom';
import {Navigate} from 'react-router';
import Homepage from './components/Homepage';
import {useDispatch,useSelector} from 'react-redux';
import { checkAuth } from './authSlice';
import AdminPanel from './components/AdminPanel';
import Edotor from './components/editorPage';
import IntoProblem from './components/IntoProblem';
import Profile from './components/profilePage';
import UserProfilePage from './components/UserProfilePage';
import FriendsPage from './components/FriendsPage';
import {UpdateProblem,UpdatePage} from './components/UpdateProblem';
import CreateProblem from './components/CreateProblem';
import DeleteProblem from './components/DeleteProblem';
import MainLayout from './components/MainLayout';
import ISmart from './components/iSmart';


function App() {
   const dispatch=useDispatch();
   const {isAuthenticated}=useSelector((state)=>state.auth);

   useEffect(()=>{
     dispatch(checkAuth());
   },[])
   return (
   <>
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={isAuthenticated?<Homepage/>:<Navigate to='/login'/>}></Route>
      <Route path='/admin' element={isAuthenticated?<AdminPanel/>:<Navigate to='/login'/>}></Route>
      <Route path='/admin/createproblem' element={isAuthenticated?<CreateProblem/>:<Navigate to='/login'/>}></Route>
      <Route path='/admin/updateproblem' element={isAuthenticated?<UpdatePage/>:<Navigate to='/login'/>}></Route>
      <Route path='/admin/updateproblem/:id' element={isAuthenticated?<UpdateProblem/>:<Navigate to='/login'/>}></Route>
      <Route path='/admin/deleteproblem' element={isAuthenticated?<DeleteProblem/>:<Navigate to='/login'/>}></Route>
      <Route path='/editor' element={isAuthenticated?<Edotor></Edotor>:<Navigate to='/login'/>}></Route>
      <Route path='/problem/:id' element={isAuthenticated?<IntoProblem/>:<Navigate to='/login'/>}></Route>
      <Route path='/profile' element={isAuthenticated?<Profile/>:<Navigate to='/login'/>}></Route>
      <Route path='/user/:userId' element={isAuthenticated?<UserProfilePage/>:<Navigate to='/login'/>}></Route>
      <Route path='/friends' element={isAuthenticated?<FriendsPage/>:<Navigate to='/login'/>}></Route>
      <Route path='/ismart' element={isAuthenticated?<ISmart/>:<Navigate to='/login'/>}></Route>
    </Route>
    <Route path="/login" element={isAuthenticated?<Navigate to='/' />:<Login/>}></Route>
    <Route path="/signup" element={isAuthenticated?<Navigate to='/' />:<Signup/>}></Route>
  </Routes>
   </>
   )
}

export default App
