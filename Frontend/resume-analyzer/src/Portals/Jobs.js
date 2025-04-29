import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Pagination, Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Upload } from "lucide-react";

const JobListingPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState([
    { id: 1, experience: '0-1 years' },
    { id: 2, experience: '1-3 years' },
    { id: 3, experience: '3-5 years' },
    { id: 4, experience: '5+ years' },
    { id: 5, experience: '5-8 years' },
    { id: 6, experience: '8+ years' },
    { id: 7, experience: '10 years' }
  ]);
  const username = useSelector((state) => state.auth.username);
  const role = useSelector((state) => state.auth.role);
  const token = useSelector((state) => state.auth.token);
  const [locationArray, setLocationArray] = useState([]);
  const jobsPerPage = 10; // you can change this

  useEffect(() => {
    fetchJobs();
    fetchLocations();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [searchQuery, selectedLocation, selectedExperience, jobs]);

  const fetchJobs = async (pageNum = 1) => {
    try {
      
      if(username && token){
   
        axios.get(`http://localhost:5000/api/get-jobs?page=${pageNum}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setJobs(response.data.jobs);
          setFilteredJobs(response.data.jobs);
        });
      } else {
        axios.get(`http://localhost:5000/api/public/jobs?page=${pageNum}`).then(response => {
          setJobs(response.data.jobs);
          setFilteredJobs(response.data.jobs);
        });
      }
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      axios
        .get("http://localhost:5000/api/get-locations")
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
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleFilter = () => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter((job) =>
        job.job_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter((job) => job.location_id == parseInt(selectedLocation));
    }

    if (selectedExperience) {
      filtered = filtered.filter((job) =>
        job.required_exp.toLowerCase().includes(selectedExperience.toLowerCase()));
    }

    setFilteredJobs(filtered);
  };

  // Pagination Logic
  const currentJobs = filteredJobs

  const [showModal, setShowModal] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleApplyClick = (job) => {
    setShowModal(true);
    setSelectedJob(job);
  };

  const handleClose = () => {
    setSelectedJob(null);
    setShowModal(false);
    setResumeFile(null);
  };

  const handleResumeUpload = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmitApplication = (job) => {
    if (!job) {
      alert("No job selected!");
      handleClose();
      return
    }

    try {
      const formData = new FormData();
      formData.append("hrUsername", job.hr_username);  // assuming HR username is inside job
      formData.append("jobID", job.id);             // assuming job ID is inside job
      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else {
        alert("Please Upload the resume");
        handleClose();
        return
      }


      const response =
        axios.post(
          "http://localhost:5000/api/apply-job",
          formData,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

      console.log("Application submitted successfully:", response.data);
      alert("Application submitted successfully!");
      setFilteredJobs((prevFiltered) => prevFiltered.filter((j) => j.id !== job.id));
      handleClose();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application.");
    }
  };
  if (loading) return <div>Loading...</div>;

  return (

    <Container className="mt-4">

      <h2 className="text-center">Available Jobs</h2>
      <Row className="mb-4">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Search job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">Filter by Location</option>
            {locationArray.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.location}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
          >
            <option value="">Filter by Experience</option>
            {experiences.map((exp) => (
              <option key={exp.id} value={exp.experience}>
                {exp.experience}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      {currentJobs.length > 0 ? (
        <>
          <Row>
            {currentJobs.map((job) => (
              <Col md={12} key={job.id} className="mb-4">
                <Card className="JobCardHover">
                  <Card.Body onClick={() => handleApplyClick(job)}>
                    <Card.Title>{job.job_title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {job.org} | {locationArray.find((loc) => loc.id == job.location_id)?.location}
                    </Card.Subtitle>
                    <Card.Text>{job.job_description.length > 255
                      ? job.job_description.substring(0, 255) + "..."
                      : job.job_description}</Card.Text>
                    <Card.Text>
                      <strong>Posted By:</strong> {job.f_name + " " + job.l_name}
                    </Card.Text>
                    <Card.Text>
                      <strong>Experience Required:</strong> {job.required_exp}
                    </Card.Text>
                    <div className="text-end">
                      {role == 'candidate' && (
                        <Button variant="primary" onClick={() => handleApplyClick(job)}>
                          Apply
                        </Button>
                      )}
                    </div>
                  </Card.Body>

                </Card>
              </Col>
            ))}
          </Row>
        </>
      ) : (

        <p>No jobs available</p>
      )}
      <Row className="justify-content-center">
        <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev onClick={() => {
            setCurrentPage(currentPage - 1);
            fetchJobs(currentPage - 1);
          }} disabled={currentPage === 1} />
          <Pagination.Next onClick={() => {
            setCurrentPage(currentPage + 1);
            fetchJobs(currentPage + 1);
          }} disabled={currentJobs <= 0} />
        </Pagination>
      </Row>
      {/* Modal for applying */}
      <Modal show={showModal} onHide={handleClose} centered>
        {selectedJob && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Apply for {selectedJob.job_title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5>{selectedJob.org}</h5>
              <p><strong>Location:</strong> {locationArray.find((loc) => loc.id == selectedJob.location_id)?.location}</p>
              <p><strong>Experience Required:</strong> {selectedJob.required_exp}</p>
              <p>{selectedJob.job_description}</p>
              {role == 'candidate' && (
              <Form.Group controlId="resumeUpload" className="mt-3">
                <Form.Label>Upload Resume</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                  <Upload size={20} />
                </div>
              </Form.Group>
              )}
            </Modal.Body>
            {role == 'candidate' && (
            <Modal.Footer>
              
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="success" onClick={() => handleSubmitApplication(selectedJob)}>
                Submit Application
              </Button>
            </Modal.Footer>
            )}
          </>
        )}
      </Modal>

    </Container>

  );
};

export default JobListingPage;
