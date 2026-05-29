import type { FAQItem } from "@utils/chat";
import type { FAQItemDraft } from "../faqItemDraft";
import { Button, Card, Form } from "react-bootstrap";
import { Plus, X } from "lucide-react";
import React from "react";

export type AiFaqDraftItemsEditorProps = Readonly<{
  mode: "add" | "edit";
  faqItems: FAQItemDraft[];
  onAddItem?: () => void;
  onRemoveItem?: (clientKey: string) => void;
  onUpdateItem: (clientKey: string, field: keyof FAQItem, value: string) => void;
  childrenBeforeItems?: React.ReactNode;
}>;

export function AiFaqDraftItemsEditor({
  mode,
  faqItems,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  childrenBeforeItems,
}: AiFaqDraftItemsEditorProps) {
  const isAdd = mode === "add";

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6>{isAdd ? "FAQ Items" : "FAQ Item"}</h6>
        {isAdd && onAddItem ? (
          <Button variant="outline-primary" size="sm" type="button" onClick={onAddItem}>
            <Plus size={14} className="me-1" />
            Add FAQ
          </Button>
        ) : null}
      </div>

      {childrenBeforeItems}

      {faqItems.map((item, index) => (
        <Card key={item.clientKey} className="mb-3">
          <Card.Body>
            {isAdd ? (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>FAQ #{index + 1}</strong>
                {faqItems.length > 1 && onRemoveItem ? (
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
