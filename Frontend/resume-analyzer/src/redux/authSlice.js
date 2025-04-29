import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('jwtToken') || null,
    username: localStorage.getItem('username') || null,
    role: localStorage.getItem('role') || null,
    data: localStorage.getItem('cadaidate_data')||null,
    f_name : localStorage.getItem('first_name')||null,
    l_name : localStorage.getItem('last_name')||null,
    analyzeCount : localStorage.getItem('analyze_count')||null,
    isAuthenticated: !!localStorage.getItem('jwtToken'),
  },
  reducers: {
    loginSuccess: (state, action) => {
        state.token = action.payload.token;
        state.username = action.payload.username;
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.f_name = action.payload.fname;
        state.l_name = action.payload.lname;
        localStorage.setItem('jwtToken', action.payload.token);
        localStorage.setItem('username', action.payload.username); 
        localStorage.setItem('role', action.payload.role); 
        localStorage.setItem('first_name', action.payload.fname); 
        localStorage.setItem('last_name', action.payload.lname); 
    },
    logout: (state) => {
        state.token = null;
        state.username = null;
        state.isAuthenticated = false;
        state.role = null;
        state.data = null;
        state.analyzeCount = null;
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username'); // <--- remove it too
        localStorage.removeItem('role'); 
        localStorage.removeItem('analyze_count'); 
        localStorage.removeItem('cadaidate_data');
        localStorage.removeItem('first_name'); 
        localStorage.removeItem('last_name'); 
    },
    candidate_data:(state, action)=>{
      state.data = action.payload;
      localStorage.setItem('cadaidate_data', action.payload);
    },
    analyze_count : (state, action)=>{
      state.analyzeCount = action.payload;
      localStorage.setItem('analyze_count', action.payload);
    },
  },
});

export const { loginSuccess, logout, candidate_data, analyze_count} = authSlice.actions;
export default authSlice.reducer;