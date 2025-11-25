import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const registerUser=createAsyncThunk('auth/register',async (userData,{rejectWithValue})=>{
    try{
        console.log("Sending to API:", userData); // Debug log
        const response=await axiosClient.post('user/register',userData);
        console.log(response);
        return response.data.user;

    }catch(error){
        console.log("API Error:", error.response?.data); // Debug log
        return rejectWithValue(
            error.response?.data?.message||error.message||'Unknown error'
        )
    }
});

export const loginUser=createAsyncThunk(
    'auth/login',
    async (credential,{rejectWithValue})=>{
        try{
            const response=await axiosClient.post('user/login',credential);
            return response.data.user;

        }catch(error){
            if (error.response) {
                // The request was made and the server responded with a status code
                console.log('Status:', error.response.status);
                console.log('Error message:', error.response.data.error);
                // Show error to user
              } else {
                // Network error or no response
                console.log('Network error:', error.message);
              }
        }
    }
);

export const checkAuth=createAsyncThunk(
    'auth/check',
    async (_,{rejectWithValue})=>{
        try{
            const {data}=await axiosClient.get('user/check');
            return data.user;
        }catch(error){
            return rejectWithValue(
                error.response?.data?.message||error.message||'Unknown error'
            )
        }
    }
)

export const logoutUser= createAsyncThunk(
    'auth/logout',
    async (_,{rejectWithValue})=>{
        try{
            await axiosClient.post('/logout');
            return null;
        }catch(error){
            return rejectWithValue(
                error.response?.data?.message||error.message||'Unknown error'
            )
        }
    }
)
//this is a slice no 1
const authSlice=createSlice({
    name:"auth",
    initialState:{
       user:null,
       isAuthenticated:false,
       loading:false,
       error:null
    },
    reducers:{

    },
    extraReducers:(builder)=>{
        builder
        //matching useCases
        .addCase(registerUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(registerUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.isAuthenticated=!!action.payload;//if we got user infomation then and then only it is Authentiacated
            state.user=action.payload;
        })
        .addCase(registerUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload?.message||'something went wrong';
            state.isAuthenticated=false;
            state.user=null;
        })

        //Login User Cases
        .addCase(loginUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = !!action.payload;
            state.user = action.payload;
          })
          .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong';
            state.isAuthenticated = false;
            state.user = null;
          })
      
          // Check Auth Cases
          .addCase(checkAuth.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(checkAuth.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = !!action.payload;
            state.user = action.payload;
          })
          .addCase(checkAuth.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong';
            state.isAuthenticated = false;
            state.user = null;
          })
      
          // Logout User Cases
          .addCase(logoutUser.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(logoutUser.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
          })
          .addCase(logoutUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong';
            state.isAuthenticated = false;
            state.user = null;
          });
    }
})
export default authSlice.reducer;
