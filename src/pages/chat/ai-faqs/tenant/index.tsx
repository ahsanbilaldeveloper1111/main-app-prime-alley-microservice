import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getTenantFAQs,
  createTenantFAQ,
  deleteTenantFAQ,
  FAQData,
  FAQItem,
  CreateTenantFAQPayload,
} from "@utils/chat";
import { GetCompanies } from "@utils/users";
import Select from "react-select";
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
import { Edit, Trash2, Plus, X, ArrowLeft, Filter } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { useRouter } from 'next/router'



/** Company/tenant option from GetCompanies */
interface CompanyOption {
  identifier: string;
  name?: string;
  [key: string]: unknown;
}

const AIChatFAQsTenant = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Tenant/company selection (identifier used as value and in payload)
  const [tenantId, setTenantId] = useState<string>("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Filter: company dropdown + apply. By default no tenant applied so we don't fetch FAQs.
  const [selectedCompanyForFilter, setSelectedCompanyForFilter] = useState<string>("");
  const [filterTenantId, setFilterTenantId] = useState<string>("");

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

  // Selected tenant for Add / Update / Delete: modal choice, applied filter, or dropdown selection
  const getTenantId = (): string => {
    if (tenantId?.trim()) return tenantId.trim();
    if (filterTenantId?.trim()) return filterTenantId.trim();
    if (selectedCompanyForFilter?.trim()) return selectedCompanyForFilter.trim();
    if (session?.user && (session.user as any).tenant_id) {
      return (session.user as any).tenant_id;
    }
    return "";
  };

  // Load companies for tenant select
  React.useEffect(() => {
    let mounted = true;
    setCompaniesLoading(true);
    GetCompanies()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setCompanies(data as CompanyOption[]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setCompaniesLoading(false);
      });
    return () => { mounted = false; };
  }, []);


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
          <div style={{ maxWidth: "500px" }}>
            {props.answer.length > 100 ? (
              <span>
                {props.answer.substring(0, 100)}...
              </span>
            ) : (
              <span>{props.answer}</span>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: FAQData) => row.created_at || "",
        sortable: true,
        cell: (props: FAQData) => (
          <span>
            {props.created_at
              ? new Date(props.created_at).toLocaleDateString()
              : "N/A"}
          </span>
        ),
      },
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

  // Handle edit FAQ (use selected tenant from filter for update)
  const handleEditFAQ = (faq: FAQData) => {
    setSelectedFAQ(faq);
    setFaqItems([{ question: faq.question, answer: faq.answer }]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setTenantId(filterTenantId || selectedCompanyForFilter || tenantId || "");
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
      const tenantForPayload = getTenantId();
      if (!tenantForPayload) {
        toast.error("Please select a tenant (company) first");
        return;
      }

      // Convert FAQ items to JSON string
      const faqsJson = JSON.stringify(validFAQs);

      // For now, we'll handle file paths as strings
      // In a real implementation, you might need to upload files first and get their paths
      const filePaths: string[] = selectedFiles.map((file) => file.name);

      const payload: CreateTenantFAQPayload = {
        tenant_id: tenantForPayload,
        faqs: faqsJson,
        have_files: haveFiles && selectedFiles.length > 0 ? "true" : "false",
        files: filePaths.length > 0 ? filePaths : undefined,
      };

      await createTenantFAQ(payload);

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

  // Confirm delete (uses selected tenant from filter dropdown)
  const handleConfirmDelete = async () => {
    if (!selectedFAQ?.id) return;
    const tenantForDelete = getTenantId();
    if (!tenantForDelete) {
      toast.error("Please select a tenant (company) first");
      return;
    }
    try {
      await deleteTenantFAQ({
        tenant_id: tenantForDelete,
        faq_id: selectedFAQ.id,
      });

      setShowDeleteModal(false);
      setSelectedFAQ(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
      // Error is already handled in the API function
    }
  };

  // Fetch data only when a company is applied via Filter (by default don't fetch)
  const fetchData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!filterTenantId?.trim()) {
        return {
          data: [],
          total: 0,
          page: 1,
          per_page: perPage,
          last_page: 1,
        };
      }
      try {
        const allFAQs = await getTenantFAQs(filterTenantId.trim(), search || undefined);

        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginated = allFAQs.slice(start, end);

        return {
          data: paginated,
          total: allFAQs.length,
          page,
          per_page: perPage,
          last_page: Math.ceil(allFAQs.length / perPage),
        };
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        return {
          data: [],
          total: 0,
          page: 1,
          per_page: perPage,
          last_page: 1,
        };
      }
    },
    [filterTenantId]
  );

  const handleApplyFilter = () => {
    if (!selectedCompanyForFilter?.trim()) {
      toast.info("Please select a company first");
      return;
    }
    setFilterTenantId(selectedCompanyForFilter.trim());
    setRefreshKey((k) => k + 1);
  };

  // Stable filters object so GenericListPage doesn't refetch when modal form state changes (typing)
  const stableFilters = useMemo(() => ({}), []);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="" />

      <PageHeader title="" showSearch={false} buttons={
        <>
        <Button
          variant="primary"
          onClick={() => {
            setTenantId(filterTenantId || selectedCompanyForFilter || "");
            setShowAddModal(true);
          }}
        >
          <Plus size={16} className="me-2" />
          Add FAQs
        </Button>
        <Button variant="outline-secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} className="me-2" />
          Back
        </Button>
        </>
      }/>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div style={{ minWidth: "220px" }}>
          <Select
            isLoading={companiesLoading}
            options={companies.map((c) => ({
              value: c.identifier,
              label: (c.name ?? c.identifier) as string,
            }))}
            value={
              selectedCompanyForFilter
                ? {
                    value: selectedCompanyForFilter,
                    label:
                      (companies.find((c) => c.identifier === selectedCompanyForFilter)?.name ??
                        selectedCompanyForFilter) as string,
                  }
                : null
            }
            onChange={(opt) => setSelectedCompanyForFilter(opt?.value ?? "")}
            placeholder="Select company..."
            isClearable
          />
        </div>
        <Button variant="primary" onClick={handleApplyFilter}>
          <Filter size={16} className="me-2" />
          Filter
        </Button>
      </div>

      <GenericListPage
        columns={columns}
        fetchData={fetchData}
        title="Tenant FAQs"
        searchPlaceholder="Search FAQs..."
        defaultPageSize={15}
        filters={stableFilters}
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
          <Modal.Title>Add Tenant FAQs</Modal.Title>
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

              <Form.Group className="mb-4">
                <Form.Label>Tenant</Form.Label>
                <Select
                  isLoading={companiesLoading}
                  options={companies.map((c) => ({
                    value: c.identifier,
                    label: (c.name ?? c.identifier) as string,
                  }))}
                  value={
                    tenantId
                      ? {
                          value: tenantId,
                          label:
                            (companies.find((c) => c.identifier === tenantId)?.name ?? tenantId) as string,
                        }
                      : null
                  }
                  onChange={(opt) => {
                    if (opt) setTenantId(opt.value);
                  }}
                  placeholder="Select tenant..."
                  isClearable={false}
                />
              </Form.Group>

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
                  accept=".pdf,.txt,.doc,.docx"
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
          <Modal.Title>Edit Tenant FAQ</Modal.Title>
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
                  accept=".pdf,.txt,.doc,.docx"
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
    </React.Fragment>
  );
};

AIChatFAQsTenant.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQsTenant;
