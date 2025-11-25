import React,{useState} from 'react';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {useDispatch,useSelector} from 'react-redux';
import {useNavigate} from 'react-router';
import {loginUser} from '../authSlice'
import {useEffect} from 'react';

const loginSchema=z.object({
    emailId:z.string().min(1,"atleast one char in email"),
    password:z.string().min(1,"atleast one element should be present")
})

function Login(){
    const dispatch=useDispatch();
    const navigate=useNavigate();

    const {isAuthenticated,loading,error}=useSelector((state)=>state.auth);

    const { register , handleSubmit ,formState:{errors}}=useForm({resolver:zodResolver(loginSchema)});

    useEffect(()=>{
        if(isAuthenticated){
            navigate('/');
        }

    },[isAuthenticated]);

    const onSubmit=(data)=>{
       console.log(data);
       dispatch(loginUser(data));
    }

    return (
        <>
        <div style={{margin:"0 40vw",backgroundColor:"lightgrey"}}>
            <h2 style={{margin:"0 28px"}}>Leetcode</h2>
            <h3>Login:</h3>
        <form onSubmit={handleSubmit(onSubmit)} style={{display:"flex",flexDirection:"column",gap:"5px"}}>
          
            <label htmlFor="emailId"> Email Id:</label>
            <input id="emailId" {...register("emailId")}/>
            {errors.emailId && <p>Invalid email Id</p>}

            <label htmlFor="password">Password:</label>
            <input  id="password" {...register("password")}/>
            <button type='submit' style={{backgroundColor:"lightgreen"}}>Submit</button>
        </form>
        </div>
        </>
    )
}
export default Login;