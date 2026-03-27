import React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { AllActivitiesModalContent, ACTIVITIES_MODAL_PER_PAGE_OPTIONS } from "@planner/taskActivityLogModalShared";
import type { AllActivitiesBrowserModalProps } from "@planner/useAllActivitiesBrowserModal";

const AllActivitiesBrowserModal: React.FC<AllActivitiesBrowserModalProps> = ({
  show,
  onHide,
  extensions,
  loadingAllActivities,
  allActivities,
  activitiesModalPage,
  setActivitiesModalPage,
  activityModalSearch,
  setActivityModalSearch,
  activityModalAction,
  handleActivityModalActionChange,
  activitiesModalPerPage,
  handleActivitiesModalPerPageChange,
  activityModalTotalPages,
  activityModalTotalItems,
}) => (
  <Modal
    show={show}
    style={{ zIndex: 9999999 }}
    onHide={onHide}
    size="xl"
    centered
  >
    <Modal.Header closeButton>
      <Modal.Title>All Activities</Modal.Title>
    </Modal.Header>
    <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>
      <Row className="g-2 mb-3 align-items-end">
        <Col xs={12} md={4}>
          <Form.Label className="small text-muted mb-1">Search</Form.Label>
          <Form.Control
            type="search"
            placeholder="Search activities..."
            value={activityModalSearch}
            onChange={(e) => setActivityModalSearch(e.target.value)}
            className="form-control"
            disabled={loadingAllActivities}
          />
        </Col>
        <Col xs={12} md={4}>
          <Form.Label className="small text-muted mb-1">Action</Form.Label>
          <Form.Select
            className="form-select"
            value={activityModalAction}
            onChange={handleActivityModalActionChange}
            disabled={loadingAllActivities}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="assigned">Assigned</option>
            <option value="status_changed">Status Changed</option>
            <option value="label_changed">Label Changed</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Reopened</option>
            <option value="deleted">Deleted</option>
          </Form.Select>
        </Col>
        <Col xs={12} md={4}>
          <Form.Label className="small text-muted mb-1">Per page</Form.Label>
          <Form.Select
            className="form-select"
            value={String(activitiesModalPerPage)}
            onChange={handleActivitiesModalPerPageChange}
            disabled={loadingAllActivities}
          >
            {ACTIVITIES_MODAL_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      <AllActivitiesModalContent
        loadingAllActivities={loadingAllActivities}
        pageActivities={allActivities as any[]}
        extensions={extensions}
        currentPage={activitiesModalPage}
        totalPages={activityModalTotalPages}
        totalItems={activityModalTotalItems}
        pageSize={activitiesModalPerPage}
        onPageChange={setActivitiesModalPage}
      />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

export default AllActivitiesBrowserModal;
