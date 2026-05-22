import type { FAQItem } from "@utils/chat";
import { Button, Card, Form } from "react-bootstrap";
import { Plus, X } from "lucide-react";
import type { FAQItemDraft } from "../faqItemDraft";

export type AiFaqDraftItemCardsProps = Readonly<{
  faqItems: FAQItemDraft[];
  variant: "multi" | "single";
  onAddItem?: () => void;
  onRemoveItem: (clientKey: string) => void;
  onUpdateItem: (clientKey: string, field: keyof FAQItem, value: string) => void;
}>;

export function AiFaqDraftItemCards({
  faqItems,
  variant,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: AiFaqDraftItemCardsProps) {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>{variant === "single" ? "FAQ Item" : "FAQ Items"}</h6>
        {variant === "multi" && onAddItem ? (
          <Button variant="outline-primary" size="sm" type="button" onClick={onAddItem}>
            <Plus size={14} className="me-1" />
            Add FAQ
          </Button>
        ) : null}
      </div>

      {faqItems.map((item, index) => (
        <Card key={item.clientKey} className="mb-3">
          <Card.Body>
            {variant === "multi" ? (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>FAQ #{index + 1}</strong>
                {faqItems.length > 1 ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    type="button"
                    onClick={() => onRemoveItem(item.clientKey)}
                  >
                    <X size={16} />
                  </Button>
                ) : null}
              </div>
            ) : null}
            <Form.Group className="mb-3">
              <Form.Label>
                Question <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={item.question}
                onChange={(e) => onUpdateItem(item.clientKey, "question", e.target.value)}
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
                onChange={(e) => onUpdateItem(item.clientKey, "answer", e.target.value)}
                placeholder="Enter answer"
              />
            </Form.Group>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
