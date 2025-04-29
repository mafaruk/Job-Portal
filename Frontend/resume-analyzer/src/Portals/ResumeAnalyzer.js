import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Spinner, Alert, Row, Col } from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useLocation } from 'react-router-dom';
import { useSelector,useDispatch } from "react-redux";
import { analyze_count } from "../redux/authSlice";

ChartJS.register(ArcElement, Tooltip, Legend);

const ResumeAnalyzer = (props) => {
    const location = useLocation();
    const file = location.state?.file || props.resume;
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState({});
    const [error, setError] = useState(null);
    const token = useSelector((state) => state.auth.token);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    useEffect(() => {
        const analyzeResume = async () => {
            if (!file || hasAnalyzed) return;

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await axios.post(
                    "http://localhost:5000/api/analyze-resume",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                setResult(res.data.analysis || {});
                console.log("analysis", res.data.analysis )
                setHasAnalyzed(true);
            } catch (err) {
                setError(err.response.data.error.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        analyzeResume();
    }, [hasAnalyzed]);

    const getAtsScore = () => {
        if ('ats_score' in result && typeof result.ats_score === 'number') {
            let newAts = result.ats_score;

            if (result.experience.length <= 3) {
                newAts -= 8;
            }
            if (result.skills.technical_skills?.length <= 15) {
                newAts -= 8;
            }
            if (result.skills.soft_skills?.length <= 5) {
                newAts -= 5;
            }
            if (result.education.length <= 2) {
                newAts -= 5;
            }
            newAts -= result.grammar_issues?.length || 0;
    
            return Math.max(newAts, 0); // ensure score doesn't go negative
        }
        if (typeof result.ats === "string") {
            const match = result.ats.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        }
        return 0;
    };

    if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    const atsScore = getAtsScore();

    return (
        <Container className="mt-2">
            <Row className="mb-4">
                <Col md={4} className="d-flex ">
                    <Card className="p-3 shadow-sm w-100 h-100 CardHover" style={{ minHeight: "300px" }}>
                        <h5>ATS Score</h5>
                        <Pie
                       
                            data={{
                                labels: ["Score", "Remaining"],
                                datasets: [
                                    {
                                        data: [atsScore, 100 - atsScore],
                                        backgroundColor: ["#198754", "#e0e0e0"],
                                        borderWidth: 1,
                                    },
                                ],
                            }}
                        />
                        <p className="mt-3">{atsScore}% match</p>
                    </Card>
                </Col>
                <Col md={4} className="d-flex ">
                    <Card className="p-3 shadow-sm mb-3 w-100 h-100 CardHover" style={{ minHeight: "300px" }}>
                        <h6>Work Experiences</h6>
                        {Array.isArray(result.experience) && result.experience.length > 0 ? (
                            result.experience.map((exp, idx) => (
                                <div key={idx} className="mb-2">
                                    <strong>{exp.title}</strong> at <strong>{exp.company}</strong><br />
                                    <small>{exp.location} | {exp.duration}</small>
                                    <ul>
                                        {exp.responsibilities?.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>Not found</p>
                        )}
                    </Card>
                </Col>
                
                <Col md={4} className="d-flex">
                    <Card className="p-3 shadow-sm mb-3 w-100 h-100 CardHover" style={{ minHeight: "300px" }}>
                        <h6>Skills</h6>
                        {result.skills && (result.skills.technical_skills?.length > 0 || result.skills.soft_skills?.length > 0) ? (
                            <>
                                {result.skills.technical_skills?.length > 0 && (
                                    <>
                                        <strong>Technical Skills:</strong>
                                        <p>{result.skills.technical_skills.join(", ")}</p>
                                    </>
                                )}
                                {result.skills.soft_skills?.length > 0 && (
                                    <>
                                        <strong>Soft Skills:</strong>
                                        <p>{result.skills.soft_skills.join(", ")}</p>
                                    </>
                                )}
                            </>
                        ) : (
                            <p>Not found</p>
                        )}
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={4} className="d-flex">
                    <Card className="p-3 shadow-sm mb-3 w-100 h-100 CardHover" style={{ minHeight: "300px" }}>
                        <h6>Education</h6>
                        {Array.isArray(result.education) && result.education.length > 0 ? (
                            result.education.map((edu, idx) => (
                                typeof edu === 'object' ? (
                                    <div key={idx} className="mb-2">
                                        <strong>{edu.degree}</strong><br />
                                        <small>{edu.university} | {edu.dates}</small>
                                    </div>
                                ) : (
                                    <p key={idx}>{edu}</p> // fallback for string-based education
                                )
                            ))
                        ) : (
                            <p>Not found</p>
                        )}
                    </Card>
                </Col>
                
                
                <Col md={4} className="d-flex flex-column">
                    <Card className="p-3 shadow-sm w-100 h-100 CardHover" style={{ minHeight: "300px" }}>
                        <h5>Grammatical Mistakes</h5>
                        {result.grammar_issues?.length > 0 ? (
                            <ul>
                                {result.grammar_issues.map((issue, index) => (
                                    <li key={index}>
                                        <strong>{issue.message}</strong>
                                        {issue.suggestions?.length > 0 && (
                                            <> – Suggestions: {issue.suggestions.join(", ")}</>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>None</p>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ResumeAnalyzer;
