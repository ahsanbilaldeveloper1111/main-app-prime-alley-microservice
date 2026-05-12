import ThemeSelect from "@components/ThemeSelect";
import type { ManageExtensionsSelectOption } from "@hooks/aiml/useManageExtensions";
import { RefreshCw } from "lucide-react";
import { Button, Form, Spinner } from "react-bootstrap";
import type { Dispatch, SetStateAction } from "react";

export function ManageExtensionsFilters({
  hierarchyLoading,
  selectedImagicles,
  setSelectedImagicles,
  selectedExtensions,
  setSelectedExtensions,
  imagiclesList,
  imagicleOptions,
  extensionOptions,
  loading,
  onFetch,
}: Readonly<{
  hierarchyLoading: boolean;
  selectedImagicles: ManageExtensionsSelectOption[];
  setSelectedImagicles: Dispatch<
    SetStateAction<ManageExtensionsSelectOption[]>
  >;
  selectedExtensions: ManageExtensionsSelectOption[];
  setSelectedExtensions: Dispatch<
    SetStateAction<ManageExtensionsSelectOption[]>
  >;
  imagiclesList: string[];
  imagicleOptions: ManageExtensionsSelectOption[];
  extensionOptions: ManageExtensionsSelectOption[];
  loading: boolean;
  onFetch: () => Promise<void>;
}>) {
  return (
    <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
      <Form.Group className="mb-0" style={{ minWidth: 200, flex: "1 1 200px" }}>
        <Form.Label className="small mb-1">Select Imagicle nodes</Form.Label>
        <ThemeSelect
          placeholder="Select nodes..."
          isMulti
          value={selectedImagicles}
          onChange={(opts) =>
            setSelectedImagicles((opts as ManageExtensionsSelectOption[]) ?? [])
          }
          options={imagicleOptions}
        />
      </Form.Group>
      <Form.Group className="mb-0" style={{ minWidth: 200, flex: "1 1 200px" }}>
        <Form.Label className="small mb-1">Select Extensions</Form.Label>
        <ThemeSelect
          placeholder={
            hierarchyLoading ? "Loading extensions..." : "Select extensions..."
          }
          isMulti
          isDisabled={hierarchyLoading}
          value={selectedExtensions}
          onChange={(opts) =>
            setSelectedExtensions((opts as ManageExtensionsSelectOption[]) ?? [])
          }
          options={extensionOptions}
        />
      </Form.Group>
      <div className="d-flex gap-2 flex-shrink-0">
        <Button
          variant="primary"
          onClick={() => {
            onFetch().catch(() => {});
          }}
          disabled={loading || !imagiclesList.length}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="me-2" />
              Fetch extensions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
