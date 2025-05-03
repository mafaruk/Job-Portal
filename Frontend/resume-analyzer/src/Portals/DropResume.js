import React, { useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom"; // better than window.location.href
import { useDropzone } from "react-dropzone";
import { Card, Button, ListGroup, Modal } from "react-bootstrap";
import { useSelector,useDispatch } from "react-redux";
import { analyze_count } from "../redux/authSlice";


const DropResume = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const username = useSelector((state) => state.auth.username);
  const count = useSelector((state) => state.auth.analyzeCount);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleResumeUpload = (file) => {
    console.log(count)
    if(token && username){
      
      if(count < 3){
        
        navigate('/resume-analyze', { state: { file} })
        dispatch(analyze_count(count + 1));
      } else {
        alert("Resume analysis limit exceeded. Further analyses are not available at this time.");
      }
    } else {
      setIsModalVisible(true); // Show the modal when the user is not logged in
      
    }
    
    
  };
  
  const handleFileDrop = (e) => {
   
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    console.log("File selected: ", file);
    handleResumeUpload(file);
  };

  const handleFileSelect = (e) => {
   
    const file = e.target.files[0];
    console.log("File selected: ", file);
    handleResumeUpload(file);
  };

  const handleDragOver = (e) => {
    
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };


  return (
    <div>
      <h4  className="text-center mb-5">Analyze Resume</h4>
      <Card>
        <Card.Body>
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
              cursor: "pointer",
              margin: "20px"
              
            }}
            onClick={() => document.getElementById("resumeInput").click()}
          >
            <p>{isDragging ? "Drop your PDF here" : "Drag & drop your PDF resume here or click to select"}</p>
            <input
              type="file"
              id="resumeInput"
              accept="application/pdf"
              onChange={handleFileSelect}
              style={{ display: "none"}}
            />
            {resumeError && <p style={{ color: "red" }}>{resumeError}</p>}
            {resumeFile && <p>Selected: {resumeFile.name}</p>}
          </div>
          
        </Card.Body>
      </Card>
      {isModalVisible && (<>
        <Modal show={isModalVisible} onHide={() => setIsModalVisible(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Login</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                Please log in to use the Resume Analyzer Service
                </Modal.Body>
            </Modal>
      </>)}
    </div>
  );
};

export default DropResume;
