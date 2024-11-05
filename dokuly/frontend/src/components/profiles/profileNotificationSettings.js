import React, { useEffect, useState } from "react";
import DokulyCard from "../dokuly_components/dokulyCard";
import CardTitle from "../dokuly_components/cardTitle";
import { Col, Row } from "react-bootstrap";
import DokulyCheckFormGroup from "../dokuly_components/dokulyCheckFormGroup";
import SubmitButton from "../dokuly_components/submitButton";
import { updateUserProfile } from "../admin/functions/queries";

const ProfileNotificationSettings = ({ profile }) => {
  const [notifyOnIssueCreation, setNotifyOnIssueCreation] = useState(false);
  const [notifyOnIssueClose, setNotifyOnIssueClose] = useState(false);
  const [notifyOnItemNewRevision, setNotifyOnItemNewRevision] = useState(false);
  const [notifyOnItemPassedReview, setNotifyOnItemPassedReview] =
    useState(false);
  const [notifyOnItemReleased, setNotifyOnItemReleased] = useState(false);
  const [notifyOnBecomeProjectOwner, setNotifyOnBecomeProjectOwner] =
    useState(false);
  const [notifyOnAddedToProject, setNotifyOnAddedToProject] = useState(false);

  const [changesMade, setChangesMade] = useState(false);

  useEffect(() => {
    if (profile) {
      setNotifyOnIssueCreation(profile.notify_user_on_issue_creation);
      setNotifyOnIssueClose(profile.notify_user_on_issue_close);
      setNotifyOnItemNewRevision(profile.notify_user_on_item_new_revision);
      setNotifyOnItemPassedReview(profile.notify_user_on_item_passed_review);
      setNotifyOnItemReleased(profile.notify_user_on_item_released);
      setNotifyOnBecomeProjectOwner(
        profile.notify_user_on_became_project_owner
      );
      setNotifyOnAddedToProject(profile.notify_user_on_added_to_project);
    }
  }, [profile]);

  const updateNotificationSettings = () => {
    const data = {
      notify_user_on_issue_creation: notifyOnIssueCreation,
      notify_user_on_issue_close: notifyOnIssueClose,
      notify_user_on_item_new_revision: notifyOnItemNewRevision,
      notify_user_on_item_passed_review: notifyOnItemPassedReview,
      notify_user_on_item_released: notifyOnItemReleased,
      notify_user_on_became_project_owner: notifyOnBecomeProjectOwner,
      notify_user_on_added_to_project: notifyOnAddedToProject,
    };
    updateUserProfile(profile.user, data).then((res) => {});
    setChangesMade(false);
  };

  const checkChanges = () => {
    const hasChanges =
      notifyOnIssueCreation !== profile.notify_user_on_issue_creation ||
      notifyOnIssueClose !== profile.notify_user_on_issue_close ||
      notifyOnItemNewRevision !== profile.notify_user_on_item_new_revision ||
      notifyOnItemPassedReview !== profile.notify_user_on_item_passed_review ||
      notifyOnItemReleased !== profile.notify_user_on_item_released ||
      notifyOnBecomeProjectOwner !==
        profile.notify_user_on_became_project_owner ||
      notifyOnAddedToProject !== profile.notify_user_on_added_to_project;

    setChangesMade(hasChanges);
  };

  useEffect(() => {
    checkChanges();
  }, [
    notifyOnIssueCreation,
    notifyOnIssueClose,
    notifyOnItemNewRevision,
    notifyOnItemPassedReview,
    notifyOnItemReleased,
    notifyOnBecomeProjectOwner,
    notifyOnAddedToProject,
    profile, // Add `profile` here to ensure checkChanges runs when profile changes too
  ]);

  return (
    <DokulyCard>
      <CardTitle titleText="Notification Settings" />
      <Row>
        <Col>
          <DokulyCheckFormGroup
            label="Notify on issue creation"
            value={notifyOnIssueCreation}
            onChange={setNotifyOnIssueCreation}
          />
          <DokulyCheckFormGroup
            label="Notify on issue close"
            value={notifyOnIssueClose}
            onChange={setNotifyOnIssueClose}
          />
        </Col>
        <Col>
          <DokulyCheckFormGroup
            label="Notify on item new revision"
            value={notifyOnItemNewRevision}
            onChange={setNotifyOnItemNewRevision}
          />
          <DokulyCheckFormGroup
            label="Notify on item passed review"
            value={notifyOnItemPassedReview}
            onChange={setNotifyOnItemPassedReview}
          />
        </Col>
        <Col>
          <DokulyCheckFormGroup
            label="Notify on item released"
            value={notifyOnItemReleased}
            onChange={setNotifyOnItemReleased}
          />
          <DokulyCheckFormGroup
            label="Notify on became project owner"
            value={notifyOnBecomeProjectOwner}
            onChange={setNotifyOnBecomeProjectOwner}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <DokulyCheckFormGroup
            label="Notify on added to project"
            value={notifyOnAddedToProject}
            onChange={setNotifyOnAddedToProject}
          />
        </Col>
        <Col></Col>
      </Row>
      {changesMade && (
        <SubmitButton onClick={() => updateNotificationSettings()}>
          Save changes
        </SubmitButton>
      )}
    </DokulyCard>
  );
};

export default ProfileNotificationSettings;
