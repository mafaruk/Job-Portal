import { FaUserCircle } from 'react-icons/fa';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import './App.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from './redux/authSlice';
import { useSelector } from "react-redux";
import { useState, useEffect} from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';


const Header = (props) => {
  const username = useSelector((state) => state.auth.username);
  const role = useSelector((state) => state.auth.role); // Fetch username from Redux store
  const [isDisabled, setIsDisabled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogOutClick = () => {
    dispatch(logout());
  };
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const navigateToProfile = () => {
    navigate('/profile');  // Navigate to the profile page
  };

  return (
    <div
      className="mb-2 px-0 "
      style={{
        backgroundColor: 'transparent',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        width: '100%', // Adjust width to be full width
        height: '100%', // Height might be too large, consider adjusting
      }}
    >
      <Container>
        <Row className="mr-5">
          <div
            style={{
              color: props.content,
              textAlign: 'center',  // Center the text
              padding: '1%',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              fontFamily: 'Roboto, sans-serif',
            }}
            className="App img-responsive py-5"
          >
            <Navbar bg="" expand="lg">
              <Container>
                {/* Title centered */}
                <Navbar.Brand
                  onClick={() => navigate('/')}
                  style={{
                    fontSize: '3rem', // Large font size
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#2c3e50', // Set a color that fits well with your design
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    flexGrow: 1,
                  }}
                >
                  {props.title}
                </Navbar.Brand>

                <div className="d-flex align-items-center">
                  {/* Conditionally render Profile Icon and Username */}
                  {username && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="link"
                          id="dropdown-user"
                          style={{ padding: 0, textDecoration: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <FaUserCircle
                              style={{ fontSize: '2rem', color: '#2c3e50', marginRight: 'eldercare: true', marginBottom: '10px' }}
                            />
                            <span style={{ fontSize: '1.25rem', color: '#2c3e50' }}>{role.toUpperCase().slice(0, 2) + " : " + username}</span>
                          </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={navigateToProfile}>View Profile</Dropdown.Item>
                          <Dropdown.Item onClick={handleLogOutClick}>Logout</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}
                </div>
              </Container>
            </Navbar>

            <p className="text-center">
              Unlock your career potential with our Resume Analyzer Portal!
              Seamlessly optimize your resume, discover tailored job opportunities,
              and empower HR professionals to find the perfect candidates with smart, AI-driven matching.
            </p>
          </div>
        </Row>
      </Container>
    </div>
  );
};

export default Header;
