import React from "react";
import { Modal } from "react-bootstrap";
import { Edit3, HelpCircle } from "lucide-react";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckFormatGuideModalProps {
  show: boolean;
  onHide: () => void;
}

export function ApiNumberCheckFormatGuideModal(
  props: Readonly<ApiNumberCheckFormatGuideModalProps>,
): React.ReactElement {
  const { show, onHide } = props;
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="apiNumberCheck-modalTitle">
          <HelpCircle size={20} />
          Format Guide
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="apiNumberCheck-modalBody">
        <div className="apiNumberCheck-modalStack">
          <div>
            <h5 className="apiNumberCheck-guideBlockTitle">
              <Edit3 size={18} />
              Manual Input Format
            </h5>
            <div className="apiNumberCheck-guidePanel">
              <ul className="apiNumberCheck-guideList">
                <li>
                  Numbers must start with <strong>&quot;05&quot;</strong>
                </li>
                <li>
                  Each number must be exactly <strong>10 digits</strong> total
                </li>
                <li>
                  Enter <strong>one number</strong> per check
                </li>
                <li>
                  Non-digit characters (spaces, dashes) are automatically
                  removed during validation
                </li>
              </ul>
              <div className="apiNumberCheck-guideExample">
                <strong className="apiNumberCheck-guideExampleLabel">
                  Example:
                </strong>
                <code className="apiNumberCheck-guideCode">
                  0512345678
                </code>
              </div>
            </div>
          </div>

          <div className="apiNumberCheck-guideWarning">
            <h6 className="apiNumberCheck-guideWarningTitle">
              Validation Rules
            </h6>
            <p className="apiNumberCheck-guideWarningText">
              Invalid numbers will be highlighted in the status bar. Only valid
              numbers (starting with &quot;05&quot; and exactly 10 digits) can
              be checked.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onHide}
          className="apiNumberCheck-modalCloseBtn"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}
