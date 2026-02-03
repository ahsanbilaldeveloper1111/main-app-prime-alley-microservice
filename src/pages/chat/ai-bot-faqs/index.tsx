import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { Card, Table, Button, Modal, Form, Spinner } from "react-bootstrap";
import { Plus, Pencil, Trash2, RefreshCw, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
    getFaqsInbound,
  postFaqsInbound,
  putFaqInbound,
  deleteFaqInbound,
  postVectorStore,
  getVectorStore,
  type FaqItemWithId,
  type GetVectorStoreResponse,
} from "@utils/aibot";

const AIBotFAQs = () => {
  const [faqs, setFaqs] = useState<FaqItemWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<GetVectorStoreResponse | null>(null);
  const [storeInfoLoading, setStoreInfoLoading] = useState(false);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getFaqsInbound();
      //const res: any = DUMMY_FAQS;
      console.log(res);
      if(res?.data?.status  === true) {
        const list = res?.data?.faqs;
        setFaqs(list ?? []);
      }
    } catch (err: unknown) {
      setFaqs([]);
      toast.error("Failed to load FAQs");
    } 
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormQuestion("");
    setFormAnswer("");
    setShowModal(true);
  };

  const openEdit = (faq: FaqItemWithId) => {
    setEditingId(faq.id ?? null);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormQuestion("");
    setFormAnswer("");
  };

  const handleSave = async () => {
    const q = formQuestion.trim();
    const a = formAnswer.trim();
    if (!q || !a) {
      toast.error("Question and answer are required.");
      return;
    }
    try {
      if (editingId != null) {
        await putFaqInbound(editingId, { question: q, answer: a });
        toast.success("FAQ updated.");
      } else {
        await postFaqsInbound([...faqs, { question: q, answer: a }]);
        toast.success("FAQ added.");
      }
      closeModal();
      loadFaqs();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Failed to save FAQ";
      toast.error(String(message));
    }
  };

  const openDeleteModal = (id: number | string) => {
    setFaqToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (faqToDelete == null) return;
    setDeleteLoading(true);
    try {
      await deleteFaqInbound(faqToDelete);
      toast.success("FAQ deleted.");
      setShowDeleteModal(false);
      setFaqToDelete(null);
      loadFaqs();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Failed to delete FAQ";
      toast.error(String(message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTrainData = async () => {
    setTrainLoading(true);
    try {
      const res = await postVectorStore(false);
      const status = res?.data?.status === true;
      if (status) {
        toast.success("Vector store training completed successfully.");
      } else {
        toast.warning("Vector store request completed but status was not true.");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Failed to train vector store";
      toast.error(String(message));
    } finally {
      setTrainLoading(false);
    }
  };

  const handleGetStoreInfo = async () => {
    setStoreInfoLoading(true);
    setStoreInfo(null);
    setShowStoreInfoModal(true);
    try {
      const res = await getVectorStore();
      setStoreInfo(res?.data ?? null);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load vector store info"
      );
      setStoreInfo(null);
    } finally {
      setStoreInfoLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="AI Bot FAQs" />

      <PageHeader
        title="AI Bot FAQs"
        description="Manage inbound FAQs for voicebot."
        showSearch={false}
        buttons={
         <>
          <Button variant="primary" onClick={openAdd} disabled={loading}>
            <Plus size={18} className="me-2" />
            Add FAQ
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleTrainData}
            disabled={trainLoading}
          >
            {trainLoading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <ArrowLeft size={16} className="me-2" />
            )}
            Train Data
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleGetStoreInfo}
            disabled={storeInfoLoading}
          >
            {storeInfoLoading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <RefreshCw size={16} className="me-2" />
            )}
            Store Info
          </Button>
         </>
        }
      />

      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-end mb-3">
            <Button variant="outline-primary" onClick={loadFaqs} disabled={loading} size="sm">
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <RefreshCw size={16} className="me-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}

          {loading && faqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Spinner animation="border" />
              <div className="mt-2">Loading FAQs...</div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <MessageCircle size={48} className="mb-2" />
              <p className="mb-0">No FAQs yet. Add one to get started.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq, index) => (
                  <tr key={faq.id ?? index}>
                    <td className="text-muted">{faq.id ?? index + 1}</td>
                    <td>{faq.question}</td>
                    <td className="text-muted" style={{ maxWidth: "320px" }}>
                      {faq.answer}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        onClick={() => openEdit(faq)}
                      >
                        <Pencil size={14} />
                      </Button>
                      {faq.id != null && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(faq.id!)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <DeleteConfirmationModal
        show={showDeleteModal && faqToDelete != null}
        onHide={() => {
          setShowDeleteModal(false);
          setFaqToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={faqToDelete != null ? faqs.find((f) => f.id === faqToDelete)?.question : undefined}
        itemType="FAQ"
        loading={deleteLoading}
      />

      <Modal show={showStoreInfoModal} onHide={() => setShowStoreInfoModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vector Store Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {storeInfoLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <div className="mt-2 text-muted">Loading store info...</div>
            </div>
          ) : storeInfo ? (
            <div className="small">
              <p className="mb-2">
                <strong>Status:</strong>{" "}
                <span className={storeInfo.status ? "text-success" : "text-warning"}>
                  {storeInfo.status ? "OK" : "Not OK"}
                </span>
              </p>
              <p className="mb-2">
                <strong>Client ID:</strong> {storeInfo.client_id}
              </p>
              {storeInfo.vector_store_info && (
                <>
                  <hr />
                  <p className="mb-1">
                    <strong>Exists:</strong> {storeInfo.vector_store_info.exists ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Total FAQs:</strong> {storeInfo.vector_store_info.total_faqs}
                  </p>
                  <p className="mb-1">
                    <strong>Vector dimension:</strong> {storeInfo.vector_store_info.vector_dimension}
                  </p>
                  <p className="mb-1">
                    <strong>Last update:</strong> {storeInfo.vector_store_info.last_update}
                  </p>
                  <p className="mb-1">
                    <strong>Directory:</strong> {storeInfo.vector_store_info.directory}
                  </p>
                  {storeInfo.vector_store_info.metadata && (
                    <>
                      <hr />
                      <p className="mb-1">
                        <strong>Model:</strong> {storeInfo.vector_store_info.metadata.model}
                      </p>
                      <p className="mb-1">
                        <strong>Version:</strong> {storeInfo.vector_store_info.metadata.version}
                      </p>
                      <p className="mb-1">
                        <strong>Created:</strong> {storeInfo.vector_store_info.metadata.created_at}
                      </p>
                      <p className="mb-0">
                        <strong>Last updated:</strong>{" "}
                        {storeInfo.vector_store_info.metadata.last_updated}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No store info available.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStoreInfoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId != null ? "Edit FAQ" : "Add FAQ"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Question</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder="e.g. What are your business hours?"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Answer</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formAnswer}
              onChange={(e) => setFormAnswer(e.target.value)}
              placeholder="e.g. Our business hours are Monday to Friday, 9 AM to 6 PM."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingId != null ? "Update" : "Add"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

AIBotFAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIBotFAQs;
