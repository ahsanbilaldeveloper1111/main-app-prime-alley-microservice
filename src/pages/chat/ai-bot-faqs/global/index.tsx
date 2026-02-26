import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getGlobalFAQs,
  createGlobalFAQ,
  deleteGlobalFAQ,
  FAQData,
  FAQItem,
  CreateTenantFAQPayload,
} from "@utils/chat";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Form,
  Card,
  Modal,
} from "react-bootstrap";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { Edit, Trash2, Plus, X, Eye, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { useRouter } from 'next/router'

const AIChatFAQsGlobal = () => {
    const router = useRouter();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [cachedFAQs, setCachedFAQs] = useState<FAQData[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  // Form states
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    { question: "", answer: "" },
  ]);
  const [haveFiles, setHaveFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Columns for table
  const columns: Column[] = useMemo(
    () => [
      {
        key: "question",
        name: "Question",
        selector: (row: FAQData) => row.question,
        sortable: true,
        cell: (props: FAQData) => (
          <div style={{ maxWidth: "400px" }}>
            <strong>{props.question}</strong>
          </div>
        ),
      },
      {
        key: "answer",
        name: "Answer",
        selector: (row: FAQData) => row.answer,
        sortable: true,
        cell: (props: FAQData) => (
          <div>
            {props.answer.length > 50 ? (
              <span>
                {props.answer.substring(0, 50)}...
              </span>
            ) : (
              <span>{props.answer}</span>
            )}
          </div>
        ),
      },
    //   {
    //     key: "created_at",
    //     name: "Created At",
    //     selector: (row: FAQData) => row.created_at,
    //     sortable: true,
    //     cell: (props: FAQData) => (
    //       <span>
    //         {props.created_at ? formatDateTimeToLocal(props.created_at, undefined, GlobalDateFormat) : "-"}
    //       </span>
    //     ),
    //   },
      {
        key: "Action",
        name: "Actions",
        selector: (row: FAQData) => row.id,
        sortable: false,
        cell: (props: FAQData) => (
          <div className="d-flex gap-2">
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-primary"
              title="View"
              onClick={() => handleViewFAQ(props)}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-primary"
              title="Edit"
              onClick={() => handleEditFAQ(props)}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-danger"
              title="Delete"
              onClick={() => handleDeleteFAQ(props)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // Handle edit FAQ
  const handleEditFAQ = (faq: FAQData) => {
    setSelectedFAQ(faq);
    setFaqItems([{ question: faq.question, answer: faq.answer }]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setShowEditModal(true);
  };

  // Handle delete FAQ
  const handleDeleteFAQ = (faq: FAQData) => {
    setSelectedFAQ(faq);
    setShowDeleteModal(true);
  };

  // Add new FAQ item row
  const handleAddFAQItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  // Remove FAQ item row
  const handleRemoveFAQItem = (index: number) => {
    if (faqItems.length > 1) {
      setFaqItems(faqItems.filter((_, i) => i !== index));
    }
  };

  // Update FAQ item
  const handleUpdateFAQItem = (index: number, field: keyof FAQItem, value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    setFaqItems(updated);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setHaveFiles(files.length > 0);
    }
  };

  // Remove file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setHaveFiles(false);
    }
  };

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewFAQ, setViewFAQ] = useState<FAQData | null>(null);
  // Handle view FAQ
  const handleViewFAQ = (faq: FAQData) => {
    setViewFAQ(faq);
    setShowViewModal(true);
  };

  // Submit create/update
  const handleSubmit = async (isEdit: boolean = false) => {
    // Validate FAQ items
    const validFAQs = faqItems.filter(
      (item) => item.question.trim() && item.answer.trim()
    );

    if (validFAQs.length === 0) {
      toast.error("Please add at least one FAQ with both question and answer");
      return;
    }

    try {
      // Convert FAQ items to JSON string
      const faqsJson = JSON.stringify(validFAQs);

      // For now, we'll handle file paths as strings
      // In a real implementation, you might need to upload files first and get their paths
      const filePaths: string[] = selectedFiles.map((file) => file.name);

      const payload: Omit<CreateTenantFAQPayload, 'tenant_id'> = {
        faqs: faqsJson,
        have_files: haveFiles && selectedFiles.length > 0 ? "true" : "false",
        files: filePaths.length > 0 ? filePaths : undefined,
      };

      await createGlobalFAQ(payload);

      // Reset form
      setFaqItems([{ question: "", answer: "" }]);
      setHaveFiles(false);
      setSelectedFiles([]);
      setFileInputKey((prev) => prev + 1);
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedFAQ(null);

      // Refresh list
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to save FAQs:", error);
      // Error is already handled in the API function
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedFAQ?.id) return;

    try {
      await deleteGlobalFAQ(selectedFAQ.id);

      setShowDeleteModal(false);
      setSelectedFAQ(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
      // Error is already handled in the API function
    }
  };

  // Fetch FAQs from API (only called on mount and when refreshKey changes)
  const fetchFAQsFromAPI = useCallback(async () => {
    try {
      const allFAQs = await getGlobalFAQs();
      setCachedFAQs(allFAQs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setCachedFAQs([]);
    }
  }, []);

  // Fetch FAQs on mount and when refreshKey changes
  useEffect(() => {
    fetchFAQsFromAPI();
  }, [refreshKey, fetchFAQsFromAPI]);

  // Fetch data for GenericListPage (uses cached data, no API call on search)
  const fetchData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      // Use cached FAQs instead of calling API
      let filtered = cachedFAQs;
      
      // Client-side filtering
      if (search) {
        filtered = cachedFAQs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(search.toLowerCase()) ||
            faq.answer.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Client-side pagination
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = filtered.slice(start, end);

      return {
        data: paginated,
        total: filtered.length,
        page,
        per_page: perPage,
        last_page: Math.ceil(filtered.length / perPage),
      };
    },
    [cachedFAQs]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Global FAQs" />

      <PageHeader title="Global FAQs" showSearch={false} buttons={
        <>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="me-2" />
          Add FAQs
        </Button>
        <Button variant="outline-secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} className="me-2" />
          Back
        </Button>
        </>
      }/>

      <GenericListPage
        columns={columns}
        fetchData={fetchData}
        title="Global FAQs"
        searchPlaceholder="Search FAQs..."
        defaultPageSize={15}
        filters={{}}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Add FAQ Modal */}
      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setFaqItems([{ question: "", answer: "" }]);
          setHaveFiles(false);
          setSelectedFiles([]);
          setFileInputKey((prev) => prev + 1);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Global FAQs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* FAQ Items */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>FAQ Items</h6>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddFAQItem}
                >
                  <Plus size={14} className="me-1" />
                  Add FAQ
                </Button>
              </div>

              {faqItems.map((item, index) => (
                <Card key={index} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>FAQ #{index + 1}</strong>
                      {faqItems.length > 1 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveFAQItem(index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Question <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={item.question}
                        onChange={(e) =>
                          handleUpdateFAQItem(index, "question", e.target.value)
                        }
                        placeholder="Enter question"
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>
                        Answer <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={item.answer}
                        onChange={(e) =>
                          handleUpdateFAQItem(index, "answer", e.target.value)
                        }
                        placeholder="Enter answer"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Files Section */}
            {/* <div className="mb-3">
              <Form.Check
                type="checkbox"
                label="Have Files"
                checked={haveFiles}
                onChange={(e) => {
                  setHaveFiles(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedFiles([]);
                    setFileInputKey((prev) => prev + 1);
                  }
                }}
              />
            </div> */}

            {haveFiles && (
              <div className="mb-3">
                <Form.Label>Files</Form.Label>
                <Form.Control
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-1"
                      >
                        <span className="small">{file.name}</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              setFaqItems([{ question: "", answer: "" }]);
              setHaveFiles(false);
              setSelectedFiles([]);
              setFileInputKey((prev) => prev + 1);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit(false)}>
            Create FAQs
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit FAQ Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedFAQ(null);
          setFaqItems([{ question: "", answer: "" }]);
          setHaveFiles(false);
          setSelectedFiles([]);
          setFileInputKey((prev) => prev + 1);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Global FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* FAQ Items */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>FAQ Item</h6>
              </div>

              {faqItems.map((item, index) => (
                <Card key={index} className="mb-3">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Question <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={item.question}
                        onChange={(e) =>
                          handleUpdateFAQItem(index, "question", e.target.value)
                        }
                        placeholder="Enter question"
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>
                        Answer <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={item.answer}
                        onChange={(e) =>
                          handleUpdateFAQItem(index, "answer", e.target.value)
                        }
                        placeholder="Enter answer"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Files Section */}
            {/* <div className="mb-3">
              <Form.Check
                type="checkbox"
                label="Have Files"
                checked={haveFiles}
                onChange={(e) => {
                  setHaveFiles(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedFiles([]);
                    setFileInputKey((prev) => prev + 1);
                  }
                }}
              />
            </div> */}

            {haveFiles && (
              <div className="mb-3">
                <Form.Label>Files</Form.Label>
                <Form.Control
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-1"
                      >
                        <span className="small">{file.name}</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setSelectedFAQ(null);
              setFaqItems([{ question: "", answer: "" }]);
              setHaveFiles(false);
              setSelectedFiles([]);
              setFileInputKey((prev) => prev + 1);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit(true)}>
            Update FAQ
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setSelectedFAQ(null);
          }}
          title="Delete FAQ?"
          description="Are you sure you want to delete this FAQ? This action cannot be undone."
          targetName={selectedFAQ?.question || ""}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFAQ(null);
          }}
        />
      )}


      {/* View FAQ Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>View FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Question:</strong> {viewFAQ?.question}
            <br />
            <strong>Answer:</strong> {viewFAQ?.answer}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

AIChatFAQsGlobal.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQsGlobal;
