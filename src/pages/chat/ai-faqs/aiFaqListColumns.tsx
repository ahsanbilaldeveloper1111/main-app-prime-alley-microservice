import type { Column } from "@components/CustomDataTable";
import type { FAQData } from "@utils/chat";

export function aiFaqQuestionColumn(): Column<FAQData & Record<string, unknown>> {
  return {
    key: "question",
    name: "Question",
    selector: (row: FAQData) => row.question,
    sortable: true,
    cell: (props: FAQData) => (
      <div style={{ maxWidth: "400px" }}>
        <strong>{props.question}</strong>
      </div>
    ),
  };
}

export type AiFaqAnswerPreviewOptions = Readonly<{
  previewLength: number;
  maxWidth?: string;
}>;

export function aiFaqAnswerPreviewColumn(
  opts: AiFaqAnswerPreviewOptions,
): Column<FAQData & Record<string, unknown>> {
  const { previewLength, maxWidth } = opts;
  const wrapStyle: { maxWidth?: string } | undefined = maxWidth ? { maxWidth } : undefined;

  return {
    key: "answer",
    name: "Answer",
    selector: (row: FAQData) => row.answer,
    sortable: true,
    cell: (props: FAQData) => (
      <div style={wrapStyle}>
        {props.answer.length > previewLength ? (
          <span>{props.answer.substring(0, previewLength)}...</span>
        ) : (
          <span>{props.answer}</span>
        )}
      </div>
    ),
  };
}
