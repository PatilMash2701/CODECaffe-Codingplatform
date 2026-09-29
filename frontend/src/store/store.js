import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../authSlice';

//this is a actual store....
export const Store=configureStore({
    reducer:{
        auth:authReducer
    }
})
export default Store;