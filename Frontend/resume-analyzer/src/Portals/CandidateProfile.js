import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, InputGroup, Badge } from "react-bootstrap";
import axios from "axios";
import { Document, Page } from "react-pdf";
import { useSelector } from "react-redux";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { WorkerMessageHandler } from 'pdfjs-dist/build/pdf.worker.mjs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Specify the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';


const CandidateProfile = ({ userData }) => {
  const candidate_data = useSelector((state) => state.auth.data);
  const [educationList, setEducationList] = useState([{ degree: "", institution: "", year: "" }]);
  const [experienceList, setExperienceList] = useState([{ role: "", company: "", years: "" }]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [resumeUrl, setResumeUrl] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (candidate_data) {
      try {
        // Parse JSON strings
        const parsedEducation = candidate_data.education
          ? JSON.parse(candidate_data.education)
          : [];
        const parsedSkills = candidate_data.skills
          ? JSON.parse(candidate_data.skills)
          : [];
        const parsedExperience = candidate_data.experience
          ? JSON.parse(candidate_data.experience)
          : [];
        // Set local state
        setEducationList(parsedEducation);
        setSkills(parsedSkills);
        setExperienceList(parsedExperience);
        setResumeFile(candidate_data.resume);
        setResumeUrl(candidate_data.resume);
      } catch (error) {
        console.error('Error parsing candidate data:', error);
        // Set default empty states on error
        setEducationList([]);
        setSkills([]);
        setExperienceList([]);
      }
    }
  }, [candidate_data]);

  const handleAddEducation = () => setEducationList([...educationList, { degree: "", institution: "", year: "" }]);
  const handleRemoveEducation = (idx) => setEducationList(educationList.filter((_, index) => index !== idx));
  const handleAddExperience = () => setExperienceList([...experienceList, { role: "", company: "", years: "" }]);
  const handleRemoveExperience = (idx) => setExperienceList(experienceList.filter((_, index) => index !== idx));

  const handleSkillAdd = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };
  const handleSkillRemove = (skill) => setSkills(skills.filter((s) => s !== skill));

  const handleUpdateProfile = async (e) => {
    const token = localStorage.getItem("jwtToken");
    const formData = new FormData();

    // Append profile data
    formData.append("educationList", JSON.stringify(educationList));
    formData.append("experienceList", JSON.stringify(experienceList));
    formData.append("skills", JSON.stringify(skills));

    // Append resume if exists
    if (resumeFile) {
      formData.append("resume", resumeFile);
    }

    try {
      await axios.post("http://localhost:5000/api/update-candidate-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Failed to update profile");
    }
  };

  const handleResumeUpload = (file) => {
    if (file && file.type === "application/pdf" || file.type === "application/docx") {
      setResumeFile(file);
      setResumeUrl(URL.createObjectURL(file));
      setResumeError(null);
    } else {
      setResumeError("Please upload a valid PDF file.");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleResumeUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleResumeUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card className="p-4 CardShadow">
      <h4>Candidate Profile</h4>

      {/* Education */}
      <h5>Education</h5>
      {educationList.map((edu, idx) => (
        <Row key={idx} className="mb-2">
          <Col>
            <InputGroup>
              <Form.Control
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => {
                  const updated = [...educationList];
                  updated[idx].degree = e.target.value;
                  setEducationList(updated);
                }}
              />
              <Form.Control
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => {
                  const updated = [...educationList];
                  updated[idx].institution = e.target.value;
                  setEducationList(updated);
                }}
              />
              <Form.Control
                placeholder="Year"
                value={edu.year}
                onChange={(e) => {
                  const updated = [...educationList];
                  updated[idx].year = e.target.value;
                  setEducationList(updated);
                }}
              />
              <Button variant="danger" onClick={() => handleRemoveEducation(idx)}>X</Button>
            </InputGroup>
          </Col>
        </Row>
      ))}
      <Button variant="secondary" onClick={handleAddEducation}>+ Add Education</Button>

      {/* Experience */}
      <h5 className="mt-4">Experience</h5>
      {experienceList.map((exp, idx) => (
        <Row key={idx} className="mb-2">
          <Col>
            <InputGroup>
              <Form.Control
                placeholder="Role"
                value={exp.role}
                onChange={(e) => {
                  const updated = [...experienceList];
                  updated[idx].role = e.target.value;
                  setExperienceList(updated);
                }}
              />
              <Form.Control
                placeholder="Company"
                value={exp.company}
                onChange={(e) => {
                  const updated = [...experienceList];
                  updated[idx].company = e.target.value;
                  setExperienceList(updated);
                }}
              />
              <Form.Control
                placeholder="Years"
                value={exp.years}
                onChange={(e) => {
                  const updated = [...experienceList];
                  updated[idx].years = e.target.value;
                  setExperienceList(updated);
                }}
              />
              <Button variant="danger" onClick={() => handleRemoveExperience(idx)}>X</Button>
            </InputGroup>
          </Col>
        </Row>
      ))}
      <Button variant="secondary" onClick={handleAddExperience}>+ Add Experience</Button>

      {/* Skills */}
      <h5 className="mt-4">Skills</h5>
      <Form onSubmit={handleSkillAdd}>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Enter a skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
          />
          <Button type="submit" variant="info">Add</Button>
        </InputGroup>
      </Form>
      <div>
        {skills.map((skill, idx) => (
          <Badge key={idx} pill bg="primary" className="me-2 mb-2" style={{ cursor: "pointer" }} onClick={() => handleSkillRemove(skill)}>
            {skill} ✕
          </Badge>
        ))}
      </div>

      {/* Resume Upload */}
      <h5 className="mt-4">Resume</h5>
      <Row className="mb-3">
        <Col>
          {resumeUrl && (
            <Button variant="secondary" onClick={() => setShowResume(true)} className="mb-2">
              Preview Resume
            </Button>
          )}
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: isDragging ? "2px dashed #007bff" : "2px dashed #ccc",
              padding: "20px",
              textAlign: "center",
              backgroundColor: isDragging ? "#e3f2fd" : "#f8f9fa",
              borderRadius: "5px",
              cursor: "pointer"
            }}
            onClick={() => document.getElementById("resumeInput").click()}
          >
            <p>{isDragging ? "Drop your PDF here" : "Drag & drop your PDF resume here or click to select"}</p>
            <input
              type="file"
              id="resumeInput"
              accept="application/pdf"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            {resumeError && <p style={{ color: "red" }}>{resumeError}</p>}
            {resumeFile && <p>Selected: {resumeFile.name}</p>}
          </div>
        </Col>
      </Row>

      {/* Update Profile Button */}
      <Button variant="primary" className="mt-4" onClick={handleUpdateProfile}>
        Update Profile
      </Button>

      {showResume && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowResume(false)}
        >
          <div style={{ width: "80%", height: "90%", backgroundColor: "white", overflow: "auto" }}>
            <Row className="justify-content-center">
              <Col md={8}>
                <Document file={resumeUrl}>
                  <Page pageNumber={1} />
                </Document>
              </Col>
            </Row>

          </div>
        </div>
      )}
    </Card>
  );
};

export default CandidateProfile;