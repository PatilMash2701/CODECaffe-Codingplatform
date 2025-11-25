import React,{useState} from 'react';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form'
import {useDispatch,useSelector} from 'react-redux';
import {useNavigate} from 'react-router';
import {registerUser} from '../authSlice';
import {useEffect} from 'react';

const signupSchema =z.object({
    firstName:z.string().min(1,{message: "First name is required"}),
    emailId:z.string().min(1,{message:"emailId is required"}),
    password:z.string().min(1,{message:"password is required"})
})

function Signup(){
    //we are using here useForm 
    const dispatch=useDispatch();
    const navigate=useNavigate();

    const {isAuthenticated,loading,error}=useSelector((state)=>state.auth);

    const {register ,handleSubmit ,formState:{errors}}=useForm({resolver:zodResolver(signupSchema)});

    useEffect(()=>{
        if(isAuthenticated){
            navigate('/');
        }
    },[isAuthenticated]);

    const onSubmit=(data)=>{
        console.log("Form data being sent:", data); // Debug log
        dispatch(registerUser(data));//dispatch is used to changed in store
        //createThunk function always called using dispatch as then connected to store and slice 
        //without dispatch they never work
    }

    return (
        <div style={{margin:"0 40vw",backgroundColor:"lightgrey"}}>
            <h2 style={{margin:"0 28px"}}>Leetcode</h2>
            <h3>Register:</h3>
        <form onSubmit={handleSubmit(onSubmit)} style={{display:"flex",flexDirection:"column",gap:"5px"}}>
            <label htmlFor="firstName">First Name:</label>
            <input id="firstName" {...register("firstName")}/>
            {errors.firstName  && <p>First name is required</p>}

            <label htmlFor="emailId"> Email Id:</label>
            <input id="emailId" {...register("emailId")}/>
            {errors.emailId && <p>Invalid email Id</p>}

            <label htmlFor="password">Password:</label>
            <input  id="password" {...register("password")}/>
            <button type='submit' style={{backgroundColor:"lightgreen"}}>Submit</button>
        </form>
        </div>
    )
}

export default Signup;