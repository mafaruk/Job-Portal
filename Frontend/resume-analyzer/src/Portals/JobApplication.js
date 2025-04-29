import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const JobApplicationsPage = () => {
  const [jobApplications, setJobApplications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      window.location.href = "/login";
    } else {
      axios
        .get("http://localhost:5000/api/get-job-applications", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          setJobApplications(response.data.job_applications);
        })
        .catch(error => {
          console.error("Error fetching job applications:", error);
        });
    }
  }, []);

  return (
    <Container>
      <h2 className="text-center">Job Applications</h2>
      {jobApplications.length === 0 ? (
        <p>No job applications available.</p>
      ) : (
        jobApplications.map((job, index) => (
          <Card key={index} className="mb-4">
            <Card.Body>
              <h4>{job.job_title}</h4>
              {job.applications.length === 0 ? (
                <p>No applicants yet.</p>
              ) : (
                job.applications.map((applicant, index) => (
                  <Row key={index}>
                    <Col>
                      <p>Name: {applicant.name}</p>
                      <p>Email: {applicant.email}</p>
                      <Button
                        variant="info"
                        onClick={() => {
                          window.open(`data:application/pdf;base64,${applicant.resume}`, "_blank");
                        }}
                      >
                        View Resume
                      </Button>
                    </Col>
                  </Row>
                ))
              )}
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default JobApplicationsPage;
