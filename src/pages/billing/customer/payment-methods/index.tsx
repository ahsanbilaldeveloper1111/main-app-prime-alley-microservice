import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Row, Col, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { 
  CreditCard,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { useSession } from "next-auth/react";

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { setDefaultPaymentMethod, deletePaymentMethod, addPaymentMethod } from "@utils/accounting";
import { toast } from "react-toastify";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { getErrorMessage } from "@utils/errors";
import { useBillingStripePortalPaymentMethodsQuery } from "@page-modules/billing/customer/useBillingStripePortalPaymentMethodsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { billingCustomerKeys } from "../../../../query/keys";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentMethodRow {
  id: string | number;
  is_default?: boolean;
  isDefault?: boolean;
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: string | number;
    exp_year?: string | number;
  };
  billing_details?: { name?: string };
}

function isDefaultPaymentMethod(method: StripePaymentMethodRow): boolean {
  return Boolean(method.is_default ?? method.isDefault);
}

// Stripe Payment Element Form Component
const AddCardForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get the card element - we need CardElement for createToken()
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        setError('Card element not found. Please ensure card details are entered.');
        setIsProcessing(false);
        return;
      }

      // Create a token from the card element using Stripe's tokens API (https://api.stripe.com/v1/tokens)
      const { error: tokenError, token } = await stripe.createToken(cardElement, {
        name: cardholderName || undefined,
        address_country: 'US',
      });

      if (tokenError) {
        setError(tokenError.message || 'Failed to create card token');
        setIsProcessing(false);
        return;
      }

      if (!token) {
        setError('Failed to create card token');
        setIsProcessing(false);
        return;
      }

      // Send token ID and billing details to your API
      await addPaymentMethod({
        stripeToken: token.id,
        isDefault: isDefault,
        cardholderName: cardholderName,
      });

      toast.success('Payment method added successfully');
      setIsProcessing(false);
      onSuccess();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to add payment method"));
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label" htmlFor="card-element">Card Information *</label>
        <div className="p-3 border rounded bg-light bc-card-element-wrap" id="card-element">
          {/* Hide Stripe Link banner if it appears */}
          <style>{`
            #card-element [data-testid="link-authentication-element"],
            #card-element [class*="Link"],
            #card-element [id*="link"],
            #card-element iframe[title*="Link"],
            #card-element div[class*="LinkAuthenticationElement"] {
              display: none !important;
            }
          `}</style>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
        {error && (
          <div className="alert alert-danger mt-2 py-2">
            <small>{error}</small>
          </div>
        )}
        <small className="text-muted">
          Your card information is securely processed by Stripe
        </small>
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="cardholderName">Cardholder Name *</label>
        <input
          type="text"
          id="cardholderName"
          className="form-control"
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="isDefault">
            Set as default payment method
          </label>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || !cardholderName.trim() || isProcessing}
          className="flex-grow-1"
        >
          {isProcessing ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Adding Card...
            </>
          ) : (
            <>
              <CreditCard size={16} className="me-2" />
              Add Card
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const PaymentMethods = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const paymentMethodsQuery = useBillingStripePortalPaymentMethodsQuery();
  const paymentMethods = (paymentMethodsQuery.data ??
    []) as StripePaymentMethodRow[];

  const invalidatePaymentMethods = () => {
    void queryClient.invalidateQueries({
      queryKey: billingCustomerKeys.paymentMethods.stripePortal(),
    });
  };

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");

    // Load Stripe publishable key
    const loadStripePublishableKey = async () => {
      try {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
        setStripePublishableKey(key);
      } catch (error) {
        console.error("Error loading Stripe publishable key:", error);
      }
    };

    useEffect(() => {
      loadStripePublishableKey();
    }, []);

    

    const handleSetDefault = async (id: string | number) => {
      await setDefaultPaymentMethod(String(id));
      invalidatePaymentMethods();
    };

    const [deletePaymentMethodId, setDeletePaymentMethodId] = useState<string | null>(null);
    const [deletePaymentMethodConfirm, setDeletePaymentMethodConfirm] = useState(false);

    const handleDeleteCard = (id: string | number) => {
      setDeletePaymentMethodId(String(id));
      setDeletePaymentMethodConfirm(true);
    };
  
  const handleConfirmDelete = async () => {
    if (deletePaymentMethodId) {
      await deletePaymentMethod(String(deletePaymentMethodId));
      invalidatePaymentMethods();
      setDeletePaymentMethodConfirm(false);
      setDeletePaymentMethodId(null);
      toast.success("Payment method deleted successfully");
    }
  };

  const handleAddCardSuccess = () => {
    setShowAddCardModal(false);
    invalidatePaymentMethods();
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Payment Methods" />

      <PageHeader
        title=""
        description=""
        showSearch={false}
        buttons={
          <>
            {session?.user?.permissions?.includes('add-payment-method-billing') && (
            <Button variant="primary" onClick={() => setShowAddCardModal(true)}>
              <Plus size={16} className="me-2" />
              Add Card
            </Button>
            )}
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
                      <span className="fw-semibold">{method.card?.exp_month}/{method.card?.exp_year}</span>
                    </div>
                    <div className="d-flex gap-2">
                      {isDefaultPaymentMethod(method) ? (
                        <Button variant="outline-secondary" size="sm" className="w-100" disabled>
                          Default Payment
                        </Button>
                      ) : (
                        <>
                          {session?.user?.permissions?.includes('mark-payment-method-default-billing') && (
                            <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleSetDefault(method.id)}>Set Default</Button>
                          )}
                          {session?.user?.permissions?.includes('delete-payment-method-billing') && (
                            <Button variant="outline-secondary" size="sm" onClick={() => handleDeleteCard(method.id)}><Trash2 size={14} /></Button>
                          )}
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

          {stripePublishableKey && (
            <Modal
              show={showAddCardModal}
              onHide={() => setShowAddCardModal(false)}
              size="lg"
            >
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
                    mode: 'setup',
                    currency: 'usd',
                    appearance: {
                      variables: {
                        colorPrimary: '#0d6efd',
                      },
                    },
                    paymentMethodTypes: ['card'],
                  }}
                >
                  <AddCardForm
                    onSuccess={handleAddCardSuccess}
                    onCancel={() => setShowAddCardModal(false)}
                  />
                </Elements>
              </Modal.Body>
            </Modal>
          )}

      

    </React.Fragment>
  );
};

PaymentMethods.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PaymentMethods;
