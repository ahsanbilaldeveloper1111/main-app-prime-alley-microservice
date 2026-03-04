import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { getImagicleTriggerExtensions, updateImagicleTrigger } from "@utils/aiml";
import { toast } from "react-toastify";
import { Card, Form, Button, Spinner, Table, Modal, Badge } from "react-bootstrap";
import { RefreshCw, Save, Edit, Inbox } from "lucide-react";
import ThemeSelect from "@components/ThemeSelect";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";

interface ExtensionsResponse {
  success?: boolean;
  message?: string;
  data?: {
    nodes_processed?: number;
    total_unique_extensions?: number;
    all_extensions?: number[];
    imagicles?: string;
    nodes_used?: string[];
    nodes?: Record<
      string,
      {
        success?: boolean;
        extensions?: number[];
        extensions_count?: number;
        trigger_definition?: string;
        message?: string;
      }
    >;
  };
}

const DEFAULT_IMAGICLES = ["node1", "node2", "node3", "node4", "node5", "node6"];

type SelectOption = { value: string; label: string };

const ManageExtensions = () => {
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

  const [selectedImagicles, setSelectedImagicles] = useState<SelectOption[]>([]);
  const [selectedExtensions, setSelectedExtensions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [data, setData] = useState<ExtensionsResponse["data"] | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modalSelectedImagicles, setModalSelectedImagicles] = useState<SelectOption[]>([]);
  const [modalSelectedExtensions, setModalSelectedExtensions] = useState<SelectOption[]>([]);

  const imagiclesList = useMemo(() => selectedImagicles.map((o) => o.value).filter(Boolean), [selectedImagicles]);

  const imagicleOptions: SelectOption[] = useMemo(
    () => DEFAULT_IMAGICLES.map((n) => ({ value: n, label: n })),
    []
  );

  const extensionOptions: SelectOption[] = useMemo(() => {
    if (!hierarchyDataExtensions || !Array.isArray(hierarchyDataExtensions)) return [];
    return (hierarchyDataExtensions as { id?: string; extension_number?: string; name?: string; user?: { name?: string } }[]).map(
      (ext) => {
        const value = String(ext?.extension_number ?? ext?.id ?? "").trim();
        const label = (ext?.user?.name ?? ext?.name ?? value) || "—";
        return { value, label };
      }
    );
  }, [hierarchyDataExtensions]);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const res = (await getImagicleTriggerExtensions(imagiclesList)) as ExtensionsResponse;
      if (res?.data) {
        setData(res.data);
        const extNums = res.data.all_extensions ?? [];
        setSelectedExtensions(
          extNums.map((num) => {
            const opt = extensionOptions.find((o) => o.value === String(num));
            return opt ?? { value: String(num), label: String(num) };
          })
        );
        toast.success(res.message ?? "Extensions loaded");
      } else {
        toast.error(res?.message ?? "Failed to load extensions");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to fetch extensions";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [imagiclesList.join(","), extensionOptions]);

  useEffect(() => {
    //fetchExtensions();
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!imagiclesList.length) {
      toast.warning("Select at least one imagicle node");
      return;
    }
    const numbers = selectedExtensions
      .map((o) => Number.parseInt(o.value, 10))
      .filter((n) => !Number.isNaN(n));
    if (!numbers.length) {
      toast.warning("Select at least one extension");
      return;
    }
    setUpdating(true);
    try {
      const res = await updateImagicleTrigger({
        imagicles: imagiclesList,
        extension_numbers: numbers,
      });
      const payload = res as { success?: boolean; message?: string };
      if (payload?.success) {
        toast.success(payload.message ?? "Trigger updated successfully");
        await fetchExtensions();
      } else {
        toast.error((payload as { message?: string })?.message ?? "Failed to update trigger");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to update trigger";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  }, [imagiclesList, selectedExtensions, fetchExtensions]);

  const openModifyModal = useCallback(() => {
    setModalSelectedImagicles(imagiclesList.map((n) => ({ value: n, label: n })));
    const current = data?.all_extensions ?? [];
    const opts = current.map((num: number) => {
      const opt = extensionOptions.find((o) => o.value === String(num));
      return opt ?? { value: String(num), label: String(num) };
    });
    setModalSelectedExtensions(opts);
    setShowModifyModal(true);
  }, [imagiclesList, data?.all_extensions, extensionOptions]);

  const handleModalSubmit = useCallback(async () => {
    const numbers = modalSelectedExtensions
      .map((o) => Number.parseInt(o.value, 10))
      .filter((n) => !Number.isNaN(n));
    if (!numbers.length) {
      toast.warning("Select at least one extension");
      return;
    }
    const imagicles = modalSelectedImagicles.map((o) => o.value).filter(Boolean);
    if (!imagicles.length) {
      toast.warning("Select at least one imagicle node");
      return;
    }
    setUpdating(true);
    try {
      const res = await updateImagicleTrigger({
        imagicles,
        extension_numbers: numbers,
      });
      const payload = res as { success?: boolean; message?: string };
      if (payload?.success) {
        toast.success(payload.message ?? "Trigger updated successfully");
        setShowModifyModal(false);
        await fetchExtensions();
      } else {
        toast.error((payload as { message?: string })?.message ?? "Failed to update trigger");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to update trigger";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  }, [modalSelectedImagicles, modalSelectedExtensions, fetchExtensions]);

  const tableData = data;

  const modalExtensionOptions = useMemo(() => {
    const fromData = new Set((data?.all_extensions ?? []).map(String));
    const opts = extensionOptions.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label }));
    const combined = [...opts];
    fromData.forEach((v) => {
      if (!combined.some((o) => o.value === v)) combined.push({ value: v, label: v });
    });
    return combined.length ? combined : Array.from(fromData).map((v) => ({ value: v, label: v }));
  }, [extensionOptions, data?.all_extensions]);

  const allExtensionsDisplay = useMemo(() => {
    const extNums = tableData?.all_extensions ?? [];
    return extNums.map((num) => {
      const label = extensionOptions.find((o) => o.value === String(num))?.label ?? String(num);
      return (
        <Badge key={num} bg="primary" className="me-1 mb-1" style={{ fontSize: "0.8rem" }}>
          {label}
        </Badge>
      );
    });
  }, [tableData?.all_extensions, extensionOptions]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Manage Extensions" />

      {/* <PageHeader title="Manage Extensions" showSearch={false} /> */}

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Imagicle Trigger – Extensions</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
            <Form.Group className="mb-0" style={{ minWidth: 200, flex: "1 1 200px" }}>
              <Form.Label className="small mb-1">Select Imagicle nodes</Form.Label>
              <ThemeSelect
                placeholder="Select nodes..."
                isMulti
                value={selectedImagicles}
                onChange={(opts) => setSelectedImagicles((opts as SelectOption[]) ?? [])}
                options={imagicleOptions}
              />
            </Form.Group>
            <Form.Group className="mb-0" style={{ minWidth: 200, flex: "1 1 200px" }}>
              <Form.Label className="small mb-1">Select Extensions</Form.Label>
              <ThemeSelect
                placeholder={hierarchyLoading ? "Loading extensions..." : "Select extensions..."}
                isMulti
                isDisabled={hierarchyLoading}
                value={selectedExtensions}
                onChange={(opts) => setSelectedExtensions((opts as SelectOption[]) ?? [])}
                options={extensionOptions}
              />
            </Form.Group>
            <div className="d-flex gap-2 flex-shrink-0">
              <Button variant="primary" onClick={fetchExtensions} disabled={loading || !imagiclesList.length}>
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

          <h6 className="mb-3">Response data</h6>
          {tableData ? (
            <Table responsive bordered hover className="mb-0">
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
                  <td className="text-center">{tableData.nodes_processed ?? "—"}</td>
                  <td className="text-center">{tableData.total_unique_extensions ?? "—"}</td>
                  <td>
                    {allExtensionsDisplay.length ? (
                      <span className="d-flex flex-wrap gap-1 align-items-center">{allExtensionsDisplay}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {tableData.nodes_used?.length ? (
                      <span className="d-flex flex-wrap gap-1 align-items-center">
                        {tableData.nodes_used.map((node) => (
                          <Badge key={node} bg="secondary" className="me-1 mb-1" style={{ fontSize: "0.8rem" }}>
                            {node}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={openModifyModal} className="d-flex align-items-center gap-1">
                      <Edit size={16} />
                      Modify
                    </Button>
                  </td>
                </tr>
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5 px-4 rounded border" style={{ backgroundColor: "#f8fafc", minHeight: 200 }}>
              <Inbox size={48} className="text-secondary mb-3" style={{ opacity: 0.6 }} />
              <h6 className="text-dark mb-2 fw-semibold">No extension data yet</h6>
              <p className="text-muted small mb-0 mx-auto" style={{ maxWidth: 360 }}>
                Choose one or more imagicle nodes above, then click <strong>Fetch extensions</strong> to load and view extension data here.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModifyModal} onHide={() => setShowModifyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Modify extensions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="mb-2">Select Imagicle nodes</Form.Label>
            <ThemeSelect
              placeholder="Select imagicle nodes..."
              isMulti
              value={modalSelectedImagicles}
              onChange={(opts) => setModalSelectedImagicles((opts as SelectOption[]) ?? [])}
              options={imagicleOptions}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="mb-2">Toggle extensions</Form.Label>
            <ThemeSelect
              placeholder="Select extensions..."
              isMulti
              value={modalSelectedExtensions}
              onChange={(opts) => setModalSelectedExtensions((opts as SelectOption[]) ?? [])}
              options={modalExtensionOptions}
              isDisabled={hierarchyLoading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModifyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalSubmit} disabled={updating}>
            {updating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              "Submit update"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

ManageExtensions.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ManageExtensions;
