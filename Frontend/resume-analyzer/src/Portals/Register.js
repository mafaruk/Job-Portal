import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import axios from 'axios';  // Assuming you have axios installed
import {useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verify, 3: Full Registration
  const [email, setEmail] = useState('');
  const [lname, setLName] = useState('');
  const [fname, setFName] = useState('');
  const [role, setRole] = useState('candidate');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);  // New state
  const [org, setOrg] = useState('');
  const navigate = useNavigate(); 
  const sendOtp = async () => {
    const isValidEmail = (email) => {
      return /\S+@\S+\.\S+/.test(email);
    };

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true); // Start loader
      const response = await axios.post('http://localhost:5000/api/send-otp', { email, role });  // backend endpoint
      console.error('response', response);
      setMessage(response.data.message);
      setServerOtp(response.data.otp);  // Normally OTP should be sent via email, but storing here temporarily for demo
      setStep(2);
    } catch (error) {
      setMessage(error.response.data.message);
      console.error('Failed to send OTP.', error);
    }
    finally {
      setLoading(false); // Always stop loader
    }
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    if (otp === serverOtp) {
      setStep(3);
      setMessage('OTP verified! Please complete your registration.');
    } else {
      setMessage('Invalid OTP. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/register', { username, email, password, role, org, fname, lname });
      alert('Account created successfully!');
     navigate('/'); // Redirect after success
    } catch (error) {
      setMessage('Registration failed.');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <Card className="p-4 shadow-lg CardHover" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Create an Account</h2>

        {message && <Alert variant="info">{message}</Alert>}

        {step === 1 && (
          <Form onSubmit={(e) => { e.preventDefault(); sendOtp(); }}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter first name"
                value={fname}
                onChange={(e) => setFName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter last or remaining name"
                value={lname}
                onChange={(e) => setLName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formRole">
              <Form.Label>Select Role</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="candidate">Candidate</option>
                <option value="hr">HR</option>
              </Form.Select>
            </Form.Group>
            {role === 'hr' && (
              <Form.Group className="mb-4" controlId="formOrg">
                <Form.Label>Organization</Form.Label>
                <Form.Control
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="Enter organization"
                />
              </Form.Group>
            )}
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </Form>
        )}

        {step === 2 && (
          <Form onSubmit={verifyOtp}>
            <Form.Group className="mb-3" controlId="formOtp">
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="success" type="submit" className="w-100">
              Verify OTP
            </Button>
          </Form>
        )}

        {step === 3 && (
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Register
            </Button>
          </Form>
        )}

        <div className="text-center mt-3">
          Already have an account? <a href="/">Login</a>
        </div>
      </Card>
    </Container>
  );
};

export default RegisterPage;
