import React, { useState } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";
import { Link } from "react-router-dom";

const REGISTER_USER = gql`
  mutation register(
    $username: String!
    $email: String!
    $password: String!
    $confirmPassword: String!
  ) {
    register(
      username: $username
      email: $email
      password: $password
      confirmPassword: $confirmPassword
    ) {
      username
      email
      createdAt
    }
  }
`;

export default function Register(props) {
  const [variables, setVariables] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [registerUser, { loading }] = useMutation(REGISTER_USER, {
    update(_, result) {
      console.log(result);
      props.history.push("/");
    },
    onError(err) {
      console.log(err.graphQLErrors[0].extensions.errors);
      setErrors(err.graphQLErrors[0].extensions.errors);
    },
  });

  const onChange = (e) => {
    setVariables({ ...variables, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };
  const submitRegisterForm = (e) => {
    e.preventDefault();
    registerUser({ variables });
  };
  return (
    <Row className="bg-white py-5 justify-content-center">
      <Col sm={8} md={6} lg={4}>
        <h1 className="text-center">Register</h1>
        <Form onSubmit={submitRegisterForm}>
          <Form.Group>
            <Form.Label className={errors.email && "text-danger"}>
              {errors.email ?? "Email"}
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              className={errors.email && "is-invalid"}
              placeholder="Enter email"
              value={variables.email}
              onChange={onChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className={errors.username && "text-danger"}>
              {errors.username ?? "Username"}
            </Form.Label>
            <Form.Control
              type="text"
              name="username"
              className={errors.username && "is-invalid"}
              placeholder="Username"
              value={variables.username}
              onChange={onChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className={errors.password && "text-danger"}>
              {errors.password ?? "Password"}
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              className={errors.password && "is-invalid"}
              placeholder="Password"
              value={variables.password}
              onChange={onChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className={errors.confirmPassword && "text-danger"}>
              {errors.confirmPassword ?? "Confirm Password"}
            </Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              className={errors.confirmPassword && "is-invalid"}
              placeholder="Confirm password"
              value={variables.confirmPassword}
              onChange={onChange}
            />
          </Form.Group>

          <div className="text-center">
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Register"}
            </Button>
            <br />
            <small>
              Already have an account? <Link to="/login">Login</Link>
            </small>
          </div>
        </Form>
      </Col>
    </Row>
  );
}
