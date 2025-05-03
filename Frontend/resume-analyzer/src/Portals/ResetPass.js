// ResetPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [msg, setMsg] = useState('');
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const role = queryParams.get('role');  // now included
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);  // New state
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (newPassword === password) {
                const response = await axios.post('http://localhost:5000/reset-password', {
                    token,
                    new_password: newPassword,
                    role
                });
                setMsg(response.data.message);
            } else {
                setMsg("Passwords dont match");
            }
            navigate("/"); // Default to home page or error page
        } catch (err) {
            setMsg(err.response.data.message);
        }
        setLoading(false);
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <Card className="p-4 shadow-lg CardHover" style={{ width: '100%', maxWidth: '500px' }}>

                {msg && <Alert variant="info">{msg}</Alert>}


                <Form onSubmit={(e) => { handleSubmit(e); }}>

                    <Form.Group className="mb-3" controlId="formBasicNewPassword">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                        <Form.Label>Confrim Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Re-enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>


                    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                        {loading ? "Resting Password..." : "Reset Password"}
                    </Button>
                </Form>


            </Card>
        </Container>
    );
};

export default ResetPassword;
