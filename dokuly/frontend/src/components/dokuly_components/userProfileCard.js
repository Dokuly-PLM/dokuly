import React from "react";
import { Card, Col, Image, Row } from "react-bootstrap";

const UserProfileCard = ({ profile }) => (
  <Card
    className="mt-2 dokuly-border-primary"
    style={{
      border: "2px solid",
    }}
  >
    <Card.Body>
      <Row className="align-items-center">
        <Col className="col-auto mx-2">
          {profile?.image ? (
            <Image
              src={profile.image}
              roundedCircle
              style={{ width: "50px", height: "50px" }}
            />
          ) : (
            <div
              className="dokuly-bg-primary"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontWeight: "bold",
                textDecoration: "none",
                border: "none",
              }}
            >
              {profile?.first_name?.[0]}
              {profile?.last_name?.[0]}
            </div>
          )}
        </Col>
        <Col className="col-auto">
          <a
            href={`/profiles/${profile?.id}`}
            style={{ textDecoration: "underline" }}
          >
            {profile?.first_name} {profile?.last_name}
          </a>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

export default UserProfileCard;
