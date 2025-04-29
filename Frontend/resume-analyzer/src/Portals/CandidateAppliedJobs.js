import React, { useEffect, useState } from "react";
import { Accordion, Card, Container, Spinner, Badge, Row, Pagination } from "react-bootstrap";
import axios from "axios";
import { useSelector } from "react-redux";

const CandidateJobsApplied = () => {
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const username = useSelector((state) => state.auth.username);
    const role = useSelector((state) => state.auth.role);
    const token = useSelector((state) => state.auth.token);

    useEffect(() => {
        fetchAppliedJobs();
    }, []);

    const fetchAppliedJobs = async (pageNum = 1) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/candidate/applied-jobs?page=${pageNum}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setAppliedJobs(response.data);
        } catch (error) {
            console.error("Error fetching applied jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-4"><Spinner animation="border" /></div>;

    return (
        <Row>
            <Container className="mt-4">
                <h4 className="text-center mb-4">Jobs You've Applied To</h4>
                {appliedJobs.length > 0 ? (
                <Accordion defaultActiveKey="0">
                    {appliedJobs.map((job, index) => (
                        <Accordion.Item eventKey={index.toString()} key={job.application_id}>
                            <Accordion.Header>
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                    <span><strong>{job.job_title}</strong></span>
                                    <span>
                                        <Badge bg="secondary" className="me-2">Organization : {job.org} | Location: {job.location}</Badge>
                                        <Badge bg="secondary" className="me-2">Posted By : {job.f_name} {job.l_name}</Badge>


                                        <Badge bg={
                                            job.status?.toLowerCase() === 'pending' ? 'warning' :
                                                job.status?.toLowerCase() === 'rejected' ? 'danger' :
                                                    ['shortlisted', 'job offered', 'accepted'].includes(job.status?.toLowerCase()) ? 'success' :
                                                        'primary'
                                        }>
                                            {job.status}
                                        </Badge>

                                    </span>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body>
                                <h5>{job.job_title}</h5>
                                <p>{job.job_description}</p>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>) : (
                    <div className="text-center mt-4">You have not applied to any more jobs yet.</div>
                )}
        <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev onClick={() => {
            setCurrentPage(currentPage - 1);
            fetchAppliedJobs(currentPage - 1);
          }} disabled={currentPage === 1} />
          <Pagination.Next onClick={() => {
            setCurrentPage(currentPage + 1);
            fetchAppliedJobs(currentPage + 1);
          }} disabled={appliedJobs.length <= 0} />
        </Pagination>
      
            </Container>
        </Row>
    );
};

export default CandidateJobsApplied;
