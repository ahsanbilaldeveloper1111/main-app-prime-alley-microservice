import type { Column } from "@components/CustomDataTable";
import type { FAQData } from "@utils/chat";
import { useMemo } from "react";
import { Button } from "react-bootstrap";
import { Edit, Eye, Trash2 } from "lucide-react";

type Row = FAQData & Record<string, unknown>;

type TenantHandlers = Readonly<{
  variant: "tenant";
  onEdit: (faq: FAQData) => void;
  onDelete: (faq: FAQData) => void;
}>;

type GlobalHandlers = Readonly<{
  variant: "global";
  onView: (faq: FAQData) => void;
  onEdit: (faq: FAQData) => void;
  onDelete: (faq: FAQData) => void;
}>;

export type AiFaqListColumnsParams = TenantHandlers | GlobalHandlers;

function answerPreviewCell(answer: string, maxLen: number) {
  if (answer.length > maxLen) {
    return <span>{answer.substring(0, maxLen)}...</span>;
  }
  return <span>{answer}</span>;
}

function FaqRowActions(props: Readonly<{
  row: Row;
  onView?: (faq: FAQData) => void;
  onEdit: (faq: FAQData) => void;
  onDelete: (faq: FAQData) => void;
}>) {
  const { row, onView, onEdit, onDelete } = props;
  return (
    <div className="d-flex gap-2">
      {onView ? (
        <Button
          variant="light"
          className="btn-action-style-2 p-1 text-primary"
          title="View"
          type="button"
          onClick={() => onView(row)}
        >
          <Eye size={16} />
        </Button>
      ) : null}
      <Button
        variant="light"
        className="btn-action-style-2 p-1 text-primary"
        title="Edit"
        type="button"
        onClick={() => onEdit(row)}
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="light"
        className="btn-action-style-2 p-1 text-danger"
        title="Delete"
        type="button"
        onClick={() => onDelete(row)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export function useAiFaqListColumns(params: AiFaqListColumnsParams): Column<Row>[] {
  const variant = params.variant;
  const isGlobal = variant === "global";
  const onView = isGlobal ? params.onView : undefined;
  const onEdit = params.onEdit;
  const onDelete = params.onDelete;

  return useMemo(() => {
    const base: Column<Row>[] = [
      {
        key: "question",
        name: "Question",
        selector: (row) => row.question,
        sortable: true,
        cell: (row) => (
          <div style={{ maxWidth: "400px" }}>
            <strong>{row.question}</strong>
          </div>
        ),
      },
      {
        key: "answer",
        name: "Answer",
        selector: (row) => row.answer,
        sortable: true,
        cell: (row) => (
          <div style={isGlobal ? undefined : { maxWidth: "500px" }}>
            {answerPreviewCell(row.answer, isGlobal ? 50 : 100)}
          </div>
        ),
      },
    ];

    if (variant === "tenant") {
      base.push({
        key: "created_at",
        name: "Created At",
        selector: (row) => row.created_at || "",
        sortable: true,
        cell: (row) => (
          <span>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}</span>
        ),
      });
    }

    base.push({
      key: "Action",
      name: "Actions",
      selector: (row) => row.id,
      sortable: false,
      cell: (row) => (
        <FaqRowActions row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      ),
    });

    return base;
  }, [variant, isGlobal, onView, onEdit, onDelete]);
}
