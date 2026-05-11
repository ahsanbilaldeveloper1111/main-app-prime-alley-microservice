import ThemeSelect from "@components/ThemeSelect";
import type { ManageExtensionsSelectOption } from "@hooks/aiml/useManageExtensions";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import type { Dispatch, SetStateAction } from "react";

export function ModifyExtensionsModal({
  show,
  onHide,
  hierarchyLoading,
  modalSelectedImagicles,
  setModalSelectedImagicles,
  modalSelectedExtensions,
  setModalSelectedExtensions,
  imagicleOptions,
  modalExtensionOptions,
  updating,
  onSubmit,
}: Readonly<{
  show: boolean;
  onHide: () => void;
  hierarchyLoading: boolean;
  modalSelectedImagicles: ManageExtensionsSelectOption[];
  setModalSelectedImagicles: Dispatch<
    SetStateAction<ManageExtensionsSelectOption[]>
  >;
  modalSelectedExtensions: ManageExtensionsSelectOption[];
  setModalSelectedExtensions: Dispatch<
    SetStateAction<ManageExtensionsSelectOption[]>
  >;
  imagicleOptions: ManageExtensionsSelectOption[];
  modalExtensionOptions: ManageExtensionsSelectOption[];
  updating: boolean;
  onSubmit: () => void;
}>) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Modify extensions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="mb-2">Select Imagicle nodes</Form.Label>
          <ThemeSelect
            placeholder="Select imagicle nodes..."
            isMulti
            value={modalSelectedImagicles}
            onChange={(opts) =>
              setModalSelectedImagicles(
                (opts as ManageExtensionsSelectOption[]) ?? [],
              )
            }
            options={imagicleOptions}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="mb-2">Toggle extensions</Form.Label>
          <ThemeSelect
            placeholder="Select extensions..."
            isMulti
            value={modalSelectedExtensions}
            onChange={(opts) =>
              setModalSelectedExtensions(
                (opts as ManageExtensionsSelectOption[]) ?? [],
              )
            }
            options={modalExtensionOptions}
            isDisabled={hierarchyLoading}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSubmit()}
          disabled={updating}
        >
          {updating ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            "Submit update"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
