import React, { useEffect, useState } from "react";
import FormInput from "../../../../dokuly_components/formInput";
import SubmitButton from "../../../../dokuly_components/submitButton";
import {
  editOrg,
  sendRequestToComponentVault,
} from "../../../functions/queries";
import { toast } from "react-toastify";
import { Col, Container, Row } from "react-bootstrap";
import { useSpring, animated } from "react-spring";
import { basicFadeInSpring } from "../../../functions/helperFunctions";

const AddExistingKey = (props) => {
  const [apiKey, setApiKey] = useState("");
  const [inputCheck, setInputCheck] = useState(0);
  const spring = useSpring(basicFadeInSpring());
  const onChange = (e) => {
    setApiKey(e.target.value);
  };

  const apiKeyFeedback = () => {
    if (inputCheck === -1) {
      return "Please input the API key.";
    }
  };

  const apiKeyButtonClassName = () => {
    if (inputCheck === -1) {
      return "form-control is-invalid";
    } else if (inputCheck === 1) {
      return "form-control is-valid";
    }
    return "form-control";
  };

  const checkInputOnSubmit = () => {
    if (apiKey.length === 0) {
      setInputCheck(-1);
      return false;
    }
    setInputCheck(0);
    return true;
  };

  const submit = () => {
    if (checkInputOnSubmit()) {
      sendRequestToComponentVault({
        request: "api/admin/validateApiKey/",
        api_key: apiKey.trim(),
        method: "GET",
      })
        .then((res) => {
          if (res.status === 200) {
            toast.success("API key validated");
            editOrg(props.orgId, { component_vault_api_key: apiKey.trim() })
              .then((res) => {
                props?.setComponentVaultAPIKey(
                  res.data.component_vault_api_key,
                );
              })
              .catch((err) => {
                toast.error("Error validating api key");
              })
              .finally(() => {
                props.setRefresh(true);
              });
          }
        })
        .catch((err) => {
          if (err) {
            toast.error("Could not verify API key. Try again.");
          }
        });
    }
  };

  return (
    <Container>
      <animated.div
        className="card-body card rounded bg-white p-5 mt-2"
        style={spring}
      >
        <FormInput
          input={apiKey}
          onChange={onChange}
          feedback={apiKeyFeedback}
          buttonClassName={apiKeyButtonClassName}
          includeColSpacing={true}
          labelTitle={"Add Component Vault API key"}
          rowClassName={"mt-2"}
          type={"text"}
        />
        <Row>
          <Col />
          <button
            className="btn btn-danger mt-4  mr-4"
            type="button"
            onClick={() => {
              props.setAddExistingKey(false);
            }}
          >
            Cancel
          </button>
          <SubmitButton
            disabledTooltip={""}
            onClick={submit()}
            disabled={false}
            type="button"
            className="mt-4 btn dokuly-bg-primary"
            children={"Add API key"}
          />
          <Col />
        </Row>
      </animated.div>
    </Container>
  );
};

export default AddExistingKey;
