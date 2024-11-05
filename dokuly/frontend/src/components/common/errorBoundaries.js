import React from "react";
import { Container, Row } from "react-bootstrap";
import { Navigate, redirect } from "react-router-dom";
import { getUser } from "./queries";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, redirToLogin: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    getUser()
      .then((res) => {
        if (res.status === 200) {
          this.setState({ redirToLogin: false });
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("token_created");
          this.setState({ redirToLogin: true });
          return redirect("/login");
        }
      });
  }

  render() {
    let resetPassCheck = false;
    if (window.location.href.includes("passwordRecovery")) {
      resetPassCheck = true;
    }
    if (this.state.redirToLogin && !resetPassCheck) {
      return <Navigate to="/login" />;
    }
    if (this.state.hasError) {
      return (
        <Container className="justify-content-center">
          <div className="row justify-content-center">
            <h1 style={{ marginTop: "1rem" }}>Oops. Something went wrong.</h1>
          </div>
          <Row className="justify-content-center mt-5">
            <img
              width="250rem"
              src="../../static/oops_robot.svg"
              alt="oops_robot"
            />
          </Row>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
