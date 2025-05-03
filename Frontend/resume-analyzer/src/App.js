import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Header from "./Header.js";
import DropResume from "./Portals/DropResume.js";
import Login from "./Portals/Login.js";
import { Container } from "react-bootstrap";
import { Card, Button } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { FaPlus, FaSearch } from "react-icons/fa";
import RegisterPage from "./Portals/Register.js";
import ProfilePage from "./Portals/Profile.js";
import JobsPage from "./Portals/Jobs.js"; // New Jobs Page import
import { useSelector } from "react-redux";
import PostJob from "./Portals/PostJob.js";
import CandidateJobsApplied from "./Portals/CandidateAppliedJobs.js";
import HRPortal from "./Portals/HRPostedJobs.js";
import ResumeAnalyzer from "./Portals/ResumeAnalyzer.js";
import RequestReset from "./Portals/RequestReset.js";
import ResetPassword from "./Portals/ResetPass.js";

function App() {

  const username = useSelector((state) => state.auth.username);
  const role = useSelector((state) => state.auth.role);
  const l_name = useSelector((state) => state.auth.l_name);
  const f_name = useSelector((state) => state.auth.f_name);
  const isHR = role === 'hr'// Get username from Redux (or use your own state for logged-in status)
  const isLoggedIn = !!username; // Determine if the user is logged in (if username exists)
  const navigate = useNavigate(); // initialize


  return (

    <Container>
      <Header title="Resume Analyzer" />
      <Routes>
        <Route
          path="/"
          element={(
            <><Row xs={1} md={3} className="g-4">
              <Col>
                <Card className="h-100 CardHover">
                  <Card.Body className="d-flex flex-column">
                    <DropResume />
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card className="h-100 CardHover d-flex justify-content-center align-items-center">
                  <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                    <h4 className="text-center mb-4">Jobs</h4>

                    {/* Search Job Button */}
                    {isHR && username ? (
                      <>
                        <FaPlus className="mt-5" size={100} style={{ color: "#007bff", marginBottom: '50px' }} />
                        <Button
                          variant="primary"
                          className="mt-3 w-100"
                          onClick={() => navigate('/post-job')}
                        >
                          Post a Job
                        </Button>
                      </>) : (
                      <>
                        <FaSearch className="mt-5" size={100} style={{ color: "#007bff", marginBottom: '50px' }} />
                        <Button
                          variant="primary"
                          className="mt-2 w-100"
                          onClick={() => navigate('/jobs')}
                        >
                          Search Job
                        </Button>
                      </>
                    )}

                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card className="h-100 CardHover">
                  <Card.Body className="d-flex flex-column">
                    {!isLoggedIn ? (
                      <Login />
                    ) : (
                      <>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>Hi, {f_name} {l_name}!</p>

                        {isHR ? (
                          <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.6' }}>
                            <strong>Welcome to Resume Analyzer,</strong> we are excited to assist you in your search for the perfect candidate. Start exploring resumes and make hiring easier!
                          </p>
                        ) : (
                          <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.6' }}>
                            <strong>Welcome to Resume Analyzer,</strong> we're here to help you in your quest to find the perfect job. Browse job listings and take the next step in your career!
                          </p>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

            </Row><>
                {isHR && username ? (
                  <HRPortal />
                ) : !isHR && username ? (
                  <CandidateJobsApplied />
                ) : (
                  <JobsPage />
                )}
              </></>
          )}
        />

        {/* Define Routes for different pages */}
        <Route path="/drop-resume" element={<DropResume />} />
        <Route path="/login" element={(<Login />)} />
        <Route path="/create-account" element={(<RegisterPage />)} />
        <Route path="/profile" element={(<ProfilePage />)} />
        <Route path="/jobs" element={(<JobsPage />)} /> 
        <Route path="/post-job" element={(<PostJob />)} /> 
        <Route path="/applied-jobs" element={(<CandidateJobsApplied />)} /> 
        <Route path="/posted-jobs" element={(<HRPortal />)} /> 
        <Route path="/resume-analyze" element={(<ResumeAnalyzer />)} /> 
        <Route path="/reset-request" element={(<RequestReset />)} /> 
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Container>
  );
}

export default App;
