import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../redux/authSlice';
import { Line } from "react-chartjs-2";
import { Form, Button, Card, Container, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";

const Login = () => {
  
  const jwtToken = useSelector((state) => state.auth.token);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
      e.preventDefault(); // Prevents page refresh
      
      if (!username.trim() || !password.trim()) {
          alert("Username and password must not be empty");
          return;
      }
      try {
          const response = await axios.post('http://localhost:5000/api/login', {
              username: username,
              password: password
          });

          const token = response.data.token;
          const role = response.data.role; // Assuming your API returns the role of the user
          const fname = response.data.f_name;
          const lname = response.data.l_name;
          dispatch(loginSuccess({ token, username, role, fname, lname }));

          // Redirect user based on role
         
            navigate("/"); // Default to home page or error page
         

      } catch (error) {
        
        console.error('Login failed:', error);
        alert('Invalid credentials');
        navigate("/");
      }
  };
  return (
    <Container  className="justify-content-center align-items-center"  >
      {!jwtToken && (
        <Container className="justify-content-center align-items-center"  >
          <Row>
            <Col  className="justify-content-center align-items-center">
              <h4 className="text-center">Login</h4>
              <div className="text-center mt-2 mb-2">
                <small>
                  Don't have an account? <a style={{color:'blue', textDecoration: "underline" }} onClick={()=>{navigate('/create-account')}}>Create One</a>
                </small>
              </div>
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-2">
                  Login
                </Button>
              </Form>
            </Col>
            <div className="text-center mt-2 mb-2">
                <small>
                 Forgot Password? <a style={{color:'blue', textDecoration: "underline" }} onClick={()=>{navigate('/reset-request')}}>Click here to Reset</a>
                </small>
              </div>
          </Row>
        </Container>
      )}
    </Container>
  );
};

export default Login;
