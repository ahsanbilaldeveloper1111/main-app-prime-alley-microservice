import type {
  ExtensionsResponse,
  ManageExtensionsSelectOption,
} from "@hooks/aiml/useManageExtensions";
import { Edit } from "lucide-react";
import { useMemo } from "react";
import { Badge, Button, Table } from "react-bootstrap";

type TableData = NonNullable<ExtensionsResponse["data"]>;

export function ManageExtensionsResultTable({
  data,
  extensionOptions,
  onModify,
}: Readonly<{
  data: TableData;
  extensionOptions: ManageExtensionsSelectOption[];
  onModify: () => void;
}>) {
  const allExtensionsDisplay = useMemo(() => {
    const extNums = data.all_extensions ?? [];
    return extNums.map((num) => {
      const label =
        extensionOptions.find((o) => o.value === String(num))?.label ?? String(num);
      return (
        <Badge key={num} bg="primary" className="me-1 mb-1" style={{ fontSize: "0.8rem" }}>
          {label}
        </Badge>
      );
    });
  }, [data.all_extensions, extensionOptions]);

  return (
    <div className="table-responsive">
      <Table bordered hover className="mb-0">
      <thead>
        <tr>
          <th>Total Nodes</th>
          <th>Total Extensions</th>
          <th>All Extensions</th>
          <th>Nodes Used</th>
          <th style={{ width: 120 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-center" data-label="Total Nodes">{data.nodes_processed ?? "—"}</td>
          <td className="text-center" data-label="Total Extensions">{data.total_unique_extensions ?? "—"}</td>
          <td data-label="All Extensions">
            {allExtensionsDisplay.length ? (
              <span className="d-flex flex-wrap gap-1 align-items-center">
                {allExtensionsDisplay}
              </span>
            ) : (
              "—"
            )}
          </td>
          <td data-label="Nodes Used">
            {data.nodes_used?.length ? (
              <span className="d-flex flex-wrap gap-1 align-items-center">
                {data.nodes_used.map((node) => (
                  <Badge
                    key={node}
                    bg="secondary"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {node}
                  </Badge>
                ))}
              </span>
            ) : (
              "—"
            )}
          </td>
          <td data-label="Actions">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onModify}
              className="d-flex align-items-center gap-1"
            >
              <Edit size={16} />
              Modify
            </Button>
          </td>
        </tr>
      </tbody>
    </Table>
    </div>
  );
}
