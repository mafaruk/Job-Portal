// src/hooks/useFetchUser.js
import { useEffect } from "react";
import { useDispatch, useSelector  } from "react-redux";
import { useNavigate } from "react-router-dom"; // better than window.location.href
import axios from "axios";
import { candidate_data } from "../redux/authSlice"; // adjust path if needed

const useGetUser = (token) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.data);

  useEffect(() => {
    
    if (!token) {
      navigate("/"); // better practice than window.location.href
    } else if (!userData || !userData.username) {
      axios
        .get("http://localhost:5000/api/get-user", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          dispatch(candidate_data(response.data));
        })
        .catch(error => {
          console.error("Error fetching user data:", error);
        });
    }
  }, [token, dispatch, navigate]);
};

export default useGetUser;
