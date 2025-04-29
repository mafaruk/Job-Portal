import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { FaCamera } from "react-icons/fa";
import axios from "axios";
import defaultProfile from './static/default_profile.png';
import PostJob from "./PostJob.js";
import CandidateProfile from "./CandidateProfile.js";
import { useDispatch } from 'react-redux';
import useGetUser from "../hooks/GetUser.js";
import CandidateJobsApplied from "./CandidateAppliedJobs.js";
import HRPortal from "./HRPostedJobs.js";


const ProfilePage = () => {
  const [profilePic, setProfilePic] = useState(defaultProfile);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = useSelector((state) => state.auth.username);
  const role = useSelector((state) => state.auth.role);
  const token = useSelector((state) => state.auth.token);
  
  useGetUser(token);
  const data = useSelector((state) => state.auth.data);
  useEffect(() => {
    if (data) { // make sure data is available
      setUserData(data);
      setLoading(false);
      if (data.profilePictureUrl) {
        setProfilePic(data.profilePictureUrl);
      }
    }
  }, [data]);

  const handleProfilePicUpload = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profile_pic", file);
      const token = localStorage.getItem("jwtToken");

      try {
        const response = await axios.post("http://localhost:5000/api/update-profile-pic", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setProfilePic(URL.createObjectURL(file)); // Local preview
        alert("Profile picture updated!");
      } catch (error) {
        console.error("Error uploading profile picture", error);
        alert(error.response.data.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container>
      <Row>
        {/* Left Profile Card */}
        <Col md={4}>
          <Card className="text-center p-4 position-relative CardShadow">
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="position-relative">
                <img
                  src={profilePic}
                  alt="Profile Pic"
                  className="rounded-circle"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
                <label
                  htmlFor="profilePicUpload"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#007bff",
                    borderRadius: "50%",
                    padding: "8px",
                    cursor: "pointer",
                    border: "2px solid white",
                  }}
                >
                  <FaCamera color="white" />
                </label>
                <input
                  type="file"
                  id="profilePicUpload"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleProfilePicUpload}
                />
              </div>
              <h4 className="mt-3">{username}</h4>
              <p>{userData.f_name} {userData.l_name}</p>
              <p>Email: {userData.email}</p>
              <p>Role: {role}</p>
            </div>
          </Card>
        </Col>

        {/* Right Section */}
        <Col md={8}>
          {userData.role === "hr" ? (
            <>
            <HRPortal />
            <PostJob/>
            </>
          ) : (
            <CandidateProfile userData={userData} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
