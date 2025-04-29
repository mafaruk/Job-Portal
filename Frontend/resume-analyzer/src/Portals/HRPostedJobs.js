import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Accordion,
    Button,
    Card,
    Container,
    Modal,
    Pagination,
    Table,
    Form,
    Badge,
    Row,
    Col
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { Document, Page } from "react-pdf";
import { useNavigate } from "react-router-dom";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { WorkerMessageHandler } from 'pdfjs-dist/build/pdf.worker.mjs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import ResumeAnalyzer from "./ResumeAnalyzer";

// Specify the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

const HRPortal = () => {
    const token = useSelector((state) => state.auth.token);
    const username = useSelector((state) => state.auth.username);
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedJob, setSelectedJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [modalShow, setModalShow] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [showResume, setShowResume] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeError, setResumeError] = useState(null);
    const [selectedCandidate, setSelectedCandidates] = useState("");
    const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async (pageNum = 1) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/get-posted-jobs?page=${pageNum}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJobs(res.data.jobs);
        } catch (err) {
            console.error("Error fetching jobs:", err);
        }
    };

    const handleViewCandidates = async (job) => {
        setSelectedJob(job);
        setModalShow(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/hr/job/${job.id}/applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCandidates(res.data);
        } catch (err) {
            console.error("Error fetching applications:", err);
        }
    };

    useEffect(() => {
        return () => {
            if (resumeUrl) URL.revokeObjectURL(resumeUrl);
        };
    }, [resumeUrl]);

    const handleViewResume = async (candidate) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/hr/view-resume/${candidate.application_id}?candidate_username=${candidate.candidate_username}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob", // Important for handling PDF
                }
            );
            console.log("data", response);
            const file = new Blob([response.data], { type: "application/pdf" });
            const fileUrl = URL.createObjectURL(file);

            setResumeFile(file);
            setResumeUrl(fileUrl);  // Used by react-pdf <Document file={resumeUrl} />
            setShowResume(true);
            setSelectedCandidates(candidate.f_name.toString() + candidate.l_name.toString())
        } catch (err) {
            console.error("Error viewing resume:", err);
            setResumeError("Failed to load resume.");
        }
    };

    const handleStatusChange = async (applicationId, newStatus, candidate_username) => {
        try {
            await axios.put(
                `http://localhost:5000/api/hr/update-status`,
                {
                    status: newStatus,
                    candidate_username: candidate_username,
                    application_id: applicationId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedCandidates = candidates.map((c) =>
                c.application_id === applicationId ? { ...c, status: newStatus } : c
            );
            setCandidates(updatedCandidates);
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    return (
        <Row>
            <Container className="mt-4">
                <h3 className="mb-4">Jobs Posted by You</h3>
                <Accordion>
                    {jobs.length > 0 ? (
                        jobs.map((job, idx) => (
                            <Accordion.Item eventKey={idx.toString()} key={job.id}>
                                <Accordion.Header>
                                    <div>
                                        <strong>{job.job_title}</strong> - {job.org} - {job.required_exp} exp
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <p>{job.job_description}</p>
                                    <Button variant="info" onClick={() => handleViewCandidates(job)}>
                                        View Applications
                                    </Button>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))
                    ) : (
                        <p>No jobs found or still loading...</p>
                    )}
                </Accordion>

                <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev onClick={() => {
            setCurrentPage(currentPage - 1);
            fetchJobs(currentPage - 1);
          }} disabled={currentPage === 1} />
          <Pagination.Next onClick={() => {
            setCurrentPage(currentPage + 1);
            fetchJobs(currentPage + 1);
          }} disabled={jobs.length <= 0} />
        </Pagination>

                {/* Modal for candidates */}
                <Modal show={modalShow} onHide={() => setModalShow(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Applications for {selectedJob?.job_title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Appl. Id</th>
                                    <th>Name</th>
                                    <th>Resume</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((c) => (
                                    <tr key={c.application_id}>
                                        <td>{c.application_id}</td>
                                        <td>{c.f_name} {c.l_name}</td>

                                        <td>
                                            <Button bg='success'
                                                onClick={() => handleViewResume(c)}>
                                                View Resume
                                            </Button>
                                        </td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={c.status}
                                                onChange={(e) => handleStatusChange(c.application_id, e.target.value, c.candidate_username)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="accepted">Accepted</option>
                                                <option bg='success' value="job offered">Job Offered</option>
                                            </Form.Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Modal.Body>
                </Modal>
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
                            zIndex: 2000,
                        }}
                        onClick={() => setShowResume(false)}
                    >
                        <div
                            style={{
                                width: "80%",
                                height: "90%",
                                backgroundColor: "white",
                                overflow: "auto",
                                padding: "1rem",
                                position: "relative",

                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", justifyContent: "flex-end" }}>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = resumeUrl;
                                        link.download = selectedCandidate + ".pdf";
                                        link.click();
                                    }}
                                >
                                    Download Resume
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setResumeFile(resumeFile);
                                        setShowAnalyzerModal(true);
                                    }}
                                >
                                    Analyze Resume
                                </Button>
                            </div>
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
                {showAnalyzerModal && (
                    <Modal show={showAnalyzerModal} onHide={() => setShowAnalyzerModal(false)} size="lg" style={{ position: "absolute", top: 10, right: 10, zIndex: 3000 }}>
                        <Modal.Header closeButton>
                            <Modal.Title>Resume Analyzer</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <ResumeAnalyzer resume={resumeFile} />
                        </Modal.Body>
                    </Modal>
                )}
            </Container>
        </Row>
    );
};

export default HRPortal;
