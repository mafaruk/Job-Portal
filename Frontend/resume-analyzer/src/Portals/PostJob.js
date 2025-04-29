import React, { useEffect, useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import axios from "axios";
import { useSelector } from "react-redux";
import useGetUser from "../hooks/GetUser.js";


const PostJob = () => {
    const username = useSelector((state) => state.auth.username);
    const role = useSelector((state) => state.auth.role);
    const token = useSelector((state) => state.auth.token);
    useGetUser(token);
    const HR_data = useSelector((state) => state.auth.data);
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [selectedLocation, setSelectedLocation] = useState('');
    const [organization, setOrganization] = useState('');
    const [locationArray, setLocationArray] = useState([]);
    const experienceCategories = [
        { id: 1, experience: '0-1 years' },
        { id: 2, experience: '1-3 years' },
        { id: 3, experience: '3-5 years' },
        { id: 4, experience: '5+ years' },
        { id: 5, experience: '5-8 years' },
        { id: 6, experience: '8+ years' },
        { id: 7, experience: '10 years' }
    ];
    const [selectedExperience, setSelectedExperience] = useState("");

    useEffect(() => {
        if (HR_data && HR_data.organization) {
          setOrganization(HR_data.organization);
        }
      }, [HR_data]);
    
    useEffect(() => {

        if (!token) {
            window.location.href = "/";
        } else {
            axios
                .get("http://localhost:5000/api/get-locations", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => {
                   
                    const location = response.data && response.data ? response.data : [];
                    const locationArray = Object.entries(location).map(([id, name]) => ({
                        id,
                        location: name
                    }));
                    setLocationArray(locationArray)
                })
                .catch(error => {
                    console.error("Error fetching locations data:", error);

                });
        }
    }, [username, role]);

    const handlePostJob = async () => {
        const token = localStorage.getItem("jwtToken");
        try {
            await axios.post("http://localhost:5000/api/post-job", { username, organization, jobTitle, jobDescription, selectedLocation, selectedExperience }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Job posted successfully!");
            setJobTitle("");
            setJobDescription("");
            setSelectedLocation("");
            setSelectedExperience("e.target.value");
        } catch (error) {
            console.error("Error posting job", error);
            alert("Error posting job");
        }
    };

    const handleLocationChange = (e) => {
        setSelectedLocation(e.target.value);
    };

    
    const handleExperienceChange = (e) => {
        setSelectedExperience(e.target.value);
    };

    return (
        <Card className="p-4 CardShadow">
            <h4>Post a Job</h4>
            <Form.Group className="mt-3">
                <Form.Label>Organization Name</Form.Label>
                <Form.Control value={organization || ''} onChange={(e) => setOrganization(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
                <Form.Label>Job Title</Form.Label>
                <Form.Control value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
                <Form.Label>Job Description</Form.Label>
                <Form.Control as="textarea" rows={3} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
                <Form.Label>Location</Form.Label>
                <Form.Select
                    aria-label="Select location"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                >
                    <option value="">Select Location</option>
                    {locationArray.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                            {loc.location}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
                <Form.Label>Job Experience</Form.Label>
                <Form.Select
                    aria-label="Select job experience"
                    value={selectedExperience}
                    onChange={handleExperienceChange}
                >
                    <option value="">Select Experience</option>
                    {experienceCategories.map((exp) => (
                        <option key={exp.id} value={exp.experience}>
                            {exp.experience}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
            <Button variant="primary" className="mt-4" onClick={handlePostJob}>Post Job</Button>
        </Card>
    );
};

export default PostJob;
