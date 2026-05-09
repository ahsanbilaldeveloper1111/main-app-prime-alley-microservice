import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, CreditCard, Plus, Trash2 } from "lucide-react";
import React from "react";
import { Badge, Button, Card, Col, Modal, Row } from "react-bootstrap";
import { isDefaultPaymentMethod } from "../paymentMethodsTypes";
import { usePaymentMethodsPage } from "../usePaymentMethodsPage";
import { PaymentMethodAddCardForm } from "./PaymentMethodAddCardForm";

export function PaymentMethodsPageView() {
  const {
    paymentMethods,
    showAddCardModal,
    setShowAddCardModal,
    stripePublishableKey,
    handleSetDefault,
    deletePaymentMethodConfirm,
    setDeletePaymentMethodConfirm,
    deletePaymentMethodId,
    handleDeleteCard,
    handleConfirmDelete,
    handleAddCardSuccess,
    canAddPaymentMethod,
    canMarkDefault,
    canDeletePaymentMethod,
  } = usePaymentMethodsPage();

  return (
    <>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Payment Methods" />

      <PageHeader
        title=""
        description=""
        showSearch={false}
        buttons={
          <>
            {canAddPaymentMethod ? (
              <Button variant="primary" onClick={() => setShowAddCardModal(true)}>
                <Plus size={16} className="me-2" />
                Add Card
              </Button>
            ) : null}
          </>
        }
      />

      <Row>
        {paymentMethods.map((method) => (
          <Col lg={4} md={6} key={method.id} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded p-2 me-2">
                      <CreditCard className="text-primary" size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0">{method.card?.brand}</h6>
                      <small className="text-muted">•••• {method.card?.last4}</small>
                    </div>
                  </div>
                  {isDefaultPaymentMethod(method) ? (
                    <Badge bg="success" className="bg-opacity-10 text-dark">
                      <Check size={12} /> Default
                    </Badge>
                  ) : null}
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Cardholder</small>
                  <span className="fw-semibold">{method.billing_details?.name}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Expires</small>
                  <span className="fw-semibold">
                    {method.card?.exp_month}/{method.card?.exp_year}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  {isDefaultPaymentMethod(method) ? (
                    <Button variant="outline-secondary" size="sm" className="w-100" disabled>
                      Default Payment
                    </Button>
                  ) : (
                    <>
                      {canMarkDefault ? (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => void handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      ) : null}
                      {canDeletePaymentMethod ? (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDeleteCard(method.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <ConfirmModal
        show={deletePaymentMethodConfirm}
        onHide={() => setDeletePaymentMethodConfirm(false)}
        title="Delete Payment Method"
        description="Are you sure you want to delete this payment method?"
        targetName={deletePaymentMethodId || ""}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePaymentMethodConfirm(false)}
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
        requireTextConfirmation={true}
        confirmationPlaceholder="Type the word DELETE to confirm"
      />

      {stripePublishableKey ? (
        <Modal show={showAddCardModal} onHide={() => setShowAddCardModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <div className="d-flex align-items-center">
                <CreditCard size={20} className="text-primary me-2" />
                Add Payment Method
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Elements
              stripe={loadStripe(stripePublishableKey)}
              options={{
                mode: "setup",
                currency: "usd",
                appearance: {
                  variables: {
                    colorPrimary: "#0d6efd",
                  },
                },
                paymentMethodTypes: ["card"],
              }}
            >
              <PaymentMethodAddCardForm
                onSuccess={() => void handleAddCardSuccess()}
                onCancel={() => setShowAddCardModal(false)}
              />
            </Elements>
          </Modal.Body>
        </Modal>
      ) : null}
    </>
  );
}
