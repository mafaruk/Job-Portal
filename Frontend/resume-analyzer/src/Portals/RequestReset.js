// RequestReset.js
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';

const RequestReset = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);  // New state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
        const response  = await axios.post('http://localhost:5000/request-reset', { email, role });
      setMsg(response.data.message);
    } catch (err) {
      setMsg(err.response.data.message);
    }
    setLoading(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
    <Card className="p-4 shadow-lg CardHover" style={{ width: '100%', maxWidth: '500px' }}>

      {msg && <Alert variant="info">{msg}</Alert>}

      
        <Form onSubmit={(e) => {handleSubmit(e); }}>
         
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
         
          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? "Sending email..." : "Send Reset Link"}
          </Button>
        </Form>

      
    </Card>
  </Container>
  );
};

export default RequestReset;
