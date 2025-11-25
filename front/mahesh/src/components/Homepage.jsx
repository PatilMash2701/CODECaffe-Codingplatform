import {useEffect ,useState} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {useDispatch,useSelector} from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import {jwtDecode} from 'jwt-decode';
import Cookie from 'js-cookie';

function Homepage(){
    const dispatch=useDispatch();
    const user=useSelector((state)=>state.auth);
    console.log(user);
    const [problems,setProblems]=useState([]);
    const [solvedProblems,setSolvedProblems]=useState([]);
    const [role,setRole]=useState(null);
    const navigate = useNavigate();
    //take filters as a object
    const [filters,setFilters]=useState({
        difficulty:'all',
        status:'all',
        tag:'all'
    })

    // Defensive: ensure problems is always an array
    const problemsArray = Array.isArray(problems) ? problems : [];
    const filteredProblems = problemsArray.filter(problem=>{
        const difficultyMatch=filters.difficulty==='all'||filters.difficulty===problem.difficulty;
        const tagMatch=filters.tag==='all'||filters.tag===problem.tag;
        const statusMatch=filters.status==='all'||solvedProblems.some(sp=>sp._id===problem._id);//problems id should match to the problem in solvedproblems for filter solved problem
        return difficultyMatch && tagMatch && statusMatch;
    });
    

    const getDifficultyBadgeColor=(difficulty)=>{
        switch(difficulty.toLowerCase()){
            case 'easy':return 'badge-success';
            case 'medium':return 'badge-warning';
            case 'hard':return 'badge-error';
            default:return 'badge-neutral';
        }
    }

    useEffect(()=>{
        const fetchProblems=async ()=>{
            try{
                const data=await axiosClient.get('/problem/getallproblem');
                console.log('Problems data:', data); // Add this line
                setProblems(data.data);
            }catch(error){
                console.error('Error fetching problems:',error);
            }
        }

        const fetchSolvedProblems = async ()=>{
            try{
                const data=await axiosClient.get('/problem/allproblemsolvedbyuser');
                console.log('Problems data:', data); // Add this line
                setSolvedProblems(data.data);
            }catch(error){
                 console.error('Error in fetching solved problems',error);
            }
        }

        fetchProblems();
        if(user){
            fetchSolvedProblems();
        }
    },[user]);

    useEffect(()=>{
       const fetchUserRole = async ()=>{
        try{
            const response=await axiosClient.get('/user/role');
            console.log('token');
            console.log(response.data.role);
            setRole(response.data.role);
        }catch(error){
            console.log('Error Fetching role:', error);
        }
       }
       if(user){
         fetchUserRole();
       }
    },[user])

    const handleLogout=()=>{
        dispatch(logoutUser()).unwrap();//waits for backend + redux state reset
        setSolvedProblems([]);//clear solved problem 
        navigate('/login');
    }

    return (
        <div className="min-h-screen bg-base-200">

        {/*Navigation Bar*/}
        <nav className='navbar bg-base-100 shadow-lg px-4'>
            <div className='flex-1'>
                <NavLink to='/' className='btn btn-ghost text-xl'>LeetCode</NavLink>
            </div>
            <div className='flex-none gap-4'>
                <div className='dropdown dropdown-end'>
                    <div tabIndex={0} className='btn btn-ghost'>
                        {user.user?.firstName}
                    </div>
                    <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                        <li><NavLink to={'/profile'}>Profile</NavLink></li>
                        {role==='admin' && <li><NavLink to={'/admin'}>Admin</NavLink></li>}
                        <li><button onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>
            </div>
        </nav>

        {/*Main Content*/}
        <div className='container mx-auto p-4'>
            {/*Filters*/}
            <div className='flex flex-wrap gap-4 mb-6'>

                <select className="select select-bordered" value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}>
                    <option value='all'>All Problems</option>
                    <option value='solved'>Solved Problems</option>
                </select>

                <select className="select select-bordered" value={filters.difficulty} onChange={(e)=>setFilters({...filters,difficulty:e.target.value})}>
                    <option value="all">All difficulties</option>
                    <option value='easy'>Easy</option>
                    <option value='medium'>Medium</option>
                    <option value='hard'>Hard</option>
                </select>

                <select className="select select-bordered" value={filters.tag} onChange={(e)=>setFilters({...filters,tag:e.target.value})}>
                    <option value='all'>All Tags</option>
                    <option value='array'>Array</option>
                    <option value='Linkedlist'>Linkedlist</option>
                    <option value='graph'>Graph</option>
                    <option value='dp'>DP</option>
                </select>
            </div>

            {/*Problem List*/}
            <div className='grid gap-4'>
                {filteredProblems.map(problem=>(
                    <div key={problem._id} className="card bg-base-100 shadow-xl">
                        <div className='card-body'>
                            <div className='flex items-center justify-between'>
                                <h2 className='card-title'>
                                    <NavLink to={`problem/${problem._id}`} className="hover:text-primary">{problem.title}</NavLink>
                                </h2>
                                {/*if this problem is solved mention solved tag in front of it*/}
                                {solvedProblems.some(sp=>sp._id===problem._id)&&(
                                    <div className='badge badge-success gap-2'>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Solved
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                                        {problem.difficulty}
                                    </div>
                                    <div className="badge badge-info">
                                        {problem.tags}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>   
                ))}
            </div>
            </div>
        </div>
    )
}
export default Homepage;