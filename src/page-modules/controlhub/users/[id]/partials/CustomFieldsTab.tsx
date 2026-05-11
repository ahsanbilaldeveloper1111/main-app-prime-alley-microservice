import React, { useState } from "react";
import { Card, Col, Row, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import FormModal from "@components/page-partials/FormModal";
import {
  AddCustomFields,
  UpdateCustomFields,
  DeleteCustomFields,
} from "@utils/users";

interface CustomFieldsTabProps {
  customFields: any[];
  session: any;
  userId: string;
  onCustomFieldsUpdate: () => void;
  onSuccess: (title: string, description: string) => void;
}

const CustomFieldsTab: React.FC<CustomFieldsTabProps> = ({
  customFields,
  session,
  userId,
  onCustomFieldsUpdate,
  onSuccess,
}) => {
  const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false);
  const [showEditCustomFieldModal, setShowEditCustomFieldModal] = useState(false);
  const [addFieldName, setAddFieldName] = useState("");
  const [addFieldValue, setAddFieldValue] = useState("");
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldValue, setEditFieldValue] = useState("");
  const [editFieldId, setEditFieldId] = useState("");

  const handleCloseAddCustomFieldModal = () => {
    setShowAddCustomFieldModal(false);
    setAddFieldName("");
    setAddFieldValue("");
  };

  const handleSubmitAddCustomField = async () => {
    const response = await AddCustomFields(
      userId,
      addFieldName,
      addFieldValue,
    );
    if (response) {
      onCustomFieldsUpdate();
      toast.success("Custom field added successfully");
      onSuccess(
        "Custom Field Added",
        "The custom field has been added successfully",
      );
      setShowAddCustomFieldModal(false);
      setAddFieldName("");
      setAddFieldValue("");
    }
  };

  const handleDeleteCustomField = async (id: number) => {
    const response = await DeleteCustomFields(String(id));
    if (response) {
      onCustomFieldsUpdate();
      toast.success("Custom field deleted successfully");
    }
  };

  const handleCloseEditCustomFieldModal = () => {
    setShowEditCustomFieldModal(false);
    setEditFieldName("");
    setEditFieldValue("");
    setEditFieldId("");
  };

  const handleSubmitEditCustomField = async () => {
    const response = await UpdateCustomFields(
      editFieldId,
      editFieldName,
      editFieldValue,
    );
    if (response) {
      onCustomFieldsUpdate();
      toast.success("Custom field edited successfully");
      onSuccess(
        "Custom Field Edited",
        "The custom field has been edited successfully",
      );
      setShowEditCustomFieldModal(false);
      setEditFieldName("");
      setEditFieldValue("");
      setEditFieldId("");
    }
  };

  const handleEditCustomField = (field: any) => {
    setEditFieldId(field.id);
    setEditFieldName(field.field_name);
    setEditFieldValue(field.field_value);
    setShowEditCustomFieldModal(true);
  };

  return (
    <Row>
      <Col md={12}>
        <FormModal
          show={showAddCustomFieldModal}
          onHide={handleCloseAddCustomFieldModal}
          title="Add Custom Field"
          desc="Please fill in the details below to add a custom field. It will show with users listing"
          formHtml={
            <>
              <div className="form-group mb-3">
                <label htmlFor="customFieldName" className="form-label">
                  Field Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customFieldName"
                  onChange={(e) => setAddFieldName(e.target.value)}
                  value={addFieldName}
                />
                <p className="text-muted mt-2 small">
                  Enter the name of the custom field you want to add.
                </p>
              </div>
              <div className="form-group mb-3">
                <label htmlFor="customFieldValue" className="form-label">
                  Field Value
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customFieldValue"
                  onChange={(e) => setAddFieldValue(e.target.value)}
                  value={addFieldValue}
                />
                <p className="text-muted mt-2 small">
                  Enter the value of the custom field you want to add.
                </p>
              </div>
            </>
          }
          submitButtonText="Add Custom Field"
          cancelButtonText="Cancel"
          onSubmit={handleSubmitAddCustomField}
          onCancel={handleCloseAddCustomFieldModal}
        />

        <FormModal
          show={showEditCustomFieldModal}
          onHide={handleCloseEditCustomFieldModal}
          title="Edit Custom Field"
          desc="Please fill in the details below to edit a custom field. It will be updated for the selected user only."
          formHtml={
            <>
              <input
                type="hidden"
                className="form-control"
                id="customFieldId"
                value={editFieldId}
                onChange={(e) => setEditFieldId(e.target.value)}
              />

              <div className="form-group mb-3">
                <label htmlFor="customFieldName" className="form-label">
                  Field Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customFieldName"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                />
                <p className="text-muted mt-2 small">
                  Enter the name of the custom field you want to edit.
                </p>
              </div>
              <div className="form-group mb-3">
                <label htmlFor="customFieldValue" className="form-label">
                  Field Value
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customFieldValue"
                  value={editFieldValue}
                  onChange={(e) => setEditFieldValue(e.target.value)}
                />
                <p className="text-muted mt-2 small">
                  Enter the value of the custom field you want to edit.
                </p>
              </div>
            </>
          }
          submitButtonText="Edit Custom Field"
          cancelButtonText="Cancel"
          onSubmit={handleSubmitEditCustomField}
          onCancel={handleCloseEditCustomFieldModal}
        />

        <Card>
          <Card.Body>
            <h5 className="d-flex justify-content-between">
              Custom Fields
              {session?.user?.permissions?.includes(
                "add-custom-field-users",
              ) && (
                <Button
                  size="sm"
                  variant="primary"
                  className="app-button"
                  onClick={() => {
                    setShowAddCustomFieldModal(true);
                  }}
                >
                  Add Custom Field
                </Button>
              )}
            </h5>

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Field Value</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {customFields && customFields.length > 0 ? (
                  customFields.map((field) => (
                    <tr key={field.id}>
                      <td>{field.field_name}</td>
                      <td>{field.field_value}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          {session?.user?.permissions?.includes(
                            "delete-custom-field-users",
                          ) && (
                            <Button
                              size="sm"
                              variant="danger"
                              className="app-button"
                              onClick={() => {
                                handleDeleteCustomField(field.id);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                          {session?.user?.permissions?.includes(
                            "edit-custom-field-users",
                          ) && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="app-button"
                              onClick={() => {
                                handleEditCustomField(field);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center">
                      No custom fields found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default CustomFieldsTab;
