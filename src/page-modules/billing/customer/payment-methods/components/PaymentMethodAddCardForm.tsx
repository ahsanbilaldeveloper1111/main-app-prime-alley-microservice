import { addPaymentMethod } from "@utils/accounting";
import { getErrorMessage } from "@utils/errors";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";
import React, { useState, type FormEvent } from "react";
import { Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

type Props = Readonly<{
  onSuccess: () => void;
  onCancel: () => void;
}>;

export const PaymentMethodAddCardForm: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setError("Card element not found. Please ensure card details are entered.");
        setIsProcessing(false);
        return;
      }

      const { error: tokenError, token } = await stripe.createToken(cardElement, {
        name: cardholderName || undefined,
        address_country: "US",
      });

      if (tokenError) {
        setError(tokenError.message || "Failed to create card token");
        setIsProcessing(false);
        return;
      }

      if (!token) {
        setError("Failed to create card token");
        setIsProcessing(false);
        return;
      }

      await addPaymentMethod({
        stripeToken: token.id,
        isDefault: isDefault,
        cardholderName: cardholderName,
      });

      toast.success("Payment method added successfully");
      setIsProcessing(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to add payment method"));
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label" htmlFor="card-element">
          Card Information *
        </label>
        <div className="p-3 border rounded bg-light bc-card-element-wrap" id="card-element">
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
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
        {error ? (
          <div className="alert alert-danger mt-2 py-2">
            <small>{error}</small>
          </div>
        ) : null}
        <small className="text-muted">Your card information is securely processed by Stripe</small>
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="cardholderName">
          Cardholder Name *
        </label>
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
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
