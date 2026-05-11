import type { FAQDraftItem } from "../faqDraftUtils";
import type { FAQItem } from "@utils/chat";
import { Button, Card, Form } from "react-bootstrap";
import { X } from "lucide-react";
import React from "react";

type Props = Readonly<{
  item: FAQDraftItem;
  index: number;
  totalCount: number;
  variant: "add" | "edit";
  onUpdate: (index: number, field: keyof FAQItem, value: string) => void;
  onRemoveItem: (index: number) => void;
}>;

export function FaqDraftItemCard({
  item,
  index,
  totalCount,
  variant,
  onUpdate,
  onRemoveItem,
}: Props) {
  return (
    <Card className="mb-3">
      <Card.Body>
        {variant === "add" ? (
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>FAQ #{index + 1}</strong>
            {totalCount > 1 ? (
              <Button
                variant="link"
                size="sm"
                className="text-danger p-0"
                onClick={() => onRemoveItem(index)}
                type="button"
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
            onChange={(e) => onUpdate(index, "question", e.target.value)}
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
            onChange={(e) => onUpdate(index, "answer", e.target.value)}
            placeholder="Enter answer"
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
}
