import "@assets/scss/datatable-style.scss";
import "@assets/scss/stages-table.scss";
import "@assets/scss/stages-page.scss";
import React, {
  ReactElement,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn, ToolbarConfig } from "@components/GenericTable";
import CrmColorCell from "@components/crm/crmColorCell";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
} from "react-bootstrap";
import { FiEdit2 } from "react-icons/fi";
import {
  X,
  Plus,
  FileText,
  Layers,
  BarChart3,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import FormModal from "@components/page-partials/FormModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import { formatCrmPreviewDate } from "@utils/Helper";
import { useStagesManagement } from "@hooks/crm/useStagesManagement";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { CrmPageDisplayProps } from "@pages/crm/crmPageDisplayProps";
import {
  DEFAULT_STAGES_SELECTED_COLUMNS,
  getTypeBadgeColor,
  getTypeDisplayName,
  STAGES_TABLE_COLUMN_STORAGE_KEY,
  type StageFormState,
  type StageRow,
  type StageType,
} from "@pages/crm/stages/stagesPageModel";

const { PERMISSIONS } = HEADER_CONSTANTS;

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "StagesManagement" });
}

function scaffoldFormEvent(): React.FormEvent {
  return { preventDefault() {} } as React.FormEvent;
}

function parseSequenceInput(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardData> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
  onClick,
}) => {
  return (
    <Card
      className={`${onClick ? "h-100 " : ""}stages-kpi-card ${onClick ? "stages-kpi-card--clickable" : "stages-kpi-card--static"}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge
              bg={isPositive ? "success" : "danger"}
              className="bg-opacity-10"
            >
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

interface StageFormFieldsProps {
  formData: StageFormState;
  onChange: <K extends keyof StageFormState>(
    field: K,
    value: StageFormState[K],
  ) => void;
  singleColumn?: boolean;
}

const StageFormFields: React.FC<StageFormFieldsProps> = ({
  formData,
  onChange,
  singleColumn = false,
}) => {
  const fieldColumnWidth = singleColumn ? 12 : 6;

  return (
  <>
    <Row>
      <Col md={fieldColumnWidth}>
        <div className="stages-form-field contact-form-field">
          <label htmlFor="stage-name-input" className="stages-form-label">
            Stage Name <span className="stages-form-required">*</span>
          </label>
          <input
            id="stage-name-input"
            type="text"
            className="stages-form-input"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter stage name"
            required
          />
        </div>
      </Col>
      <Col md={fieldColumnWidth}>
        <div className="stages-form-field contact-form-field">
          <label htmlFor="stage-sequence-input" className="stages-form-label">
            Sequence <span className="stages-form-required">*</span>
          </label>
          <input
            id="stage-sequence-input"
            type="number"
            className="stages-form-input"
            value={formData.sequence}
            onChange={(e) =>
              onChange(
                "sequence",
                parseSequenceInput(e.target.value, formData.sequence),
              )
            }
            min="1"
            required
          />
        </div>
      </Col>
    </Row>

    <Row>
      <Col md={fieldColumnWidth}>
        <div className="stages-form-field contact-form-field">
          <label htmlFor="stage-type-select" className="stages-form-label">
            Type <span className="stages-form-required">*</span>
          </label>
          <select
            id="stage-type-select"
            className="stages-form-input"
            value={formData.type}
            onChange={(e) => onChange("type", e.target.value as StageType)}
            required
          >
            <option value="lead">Lead</option>
            <option value="deal">Deal</option>
            <option value="order">Order</option>
            <option value="lost_reason">Lost Reason</option>
          </select>
        </div>
      </Col>
      <Col md={2}>
        <div className="stages-form-field contact-form-field">
          <label htmlFor="stage-color-input" className="stages-form-label">
            Color
          </label>
          <input
            id="stage-color-input"
            type="color"
            className="stages-form-input stages-form-input--color"
            value={formData.color}
            onChange={(e) => onChange("color", e.target.value)}
          />
        </div>
      </Col>
    </Row>

    <Row>
      <Col md={fieldColumnWidth}>
        <div className="stages-form-field contact-form-field">
          <label htmlFor="stage-probability-input" className="stages-form-label">
            Probability
          </label>
          <input
            id="stage-probability-input"
            type="number"
            className="stages-form-input"
            value={formData.probability}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              onChange(
                "probability",
                Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n)),
              );
            }}
            min="0"
            max="100"
            disabled={formData.type === "lost_reason"}
          />
        </div>
      </Col>
    </Row>

    <div className="stages-form-field contact-form-field">
      <label htmlFor="stage-description-input" className="stages-form-label">
        Description
      </label>
      <textarea
        id="stage-description-input"
        className="stages-form-textarea"
        rows={3}
        value={formData.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Enter stage description (optional)"
      />
    </div>
  </>
  );
};

const StagesManagement = ({ hideBreadcrumb }: CrmPageDisplayProps = {}) => {
  const {
    session,
    showCreateModal,
    setShowCreateModal,
    showUpdateModal,
    showDeleteModal,
    setShowDeleteModal,
    showViewModal,
    setShowViewModal,
    showSuccessfulModal,
    submittingStageForm,
    deletingStage,
    successModalTitle,
    successModalDescription,
    stageToDelete,
    setStageToDelete,
    viewingStage,
    formData,
    stagesSearch,
    handleToolbarSearchChange,
    handleToolbarSearchSubmit,
    activeFilter,
    showStagesAnalytics,
    selectedStagesColumns,
    setSelectedStagesColumns,
    stagesPagination,
    handleStagesPaginationChange,
    handleStagesSort,
    loadingStages,
    showRestoreModal,
    setShowRestoreModal,
    stageToRestore,
    setStageToRestore,
    restoring,
    handleCloseSuccessfulModal,
    handleSubmit,
    handleCloseUpdateModal,
    handleUpdateStage,
    handleDeleteStage,
    handleConfirmRestore,
    openRestoreModal,
    openStageView,
    openStageEdit,
    openStageDelete,
    handleInputChange,
    filteredStages,
    paginatedStages,
    analyticsData,
    filterCounts,
    handleToolbarTabChange,
    toggleStagesAnalytics,
    openCreateStageModal,
  } = useStagesManagement();

  const stagesTableColumns = useMemo<TableColumn<StageRow>[]>(() => {
    const cols: TableColumn<StageRow>[] = [];

    if (selectedStagesColumns.includes("name")) {
      cols.push({
        key: "name",
        label: "Stage Name",
        sortable: true,
        type: "custom",
        render: (stage: StageRow) => (
          <div className="d-flex align-items-center gap-2">
            <div
              className="stages-table-name-dot"
              style={{ backgroundColor: stage.color }}
            />
            <span className="fw-semibold">{stage.name}</span>
          </div>
        ),
      });
    }

    if (selectedStagesColumns.includes("sequence")) {
      cols.push({
        key: "sequence",
        label: "Sequence",
        sortable: true,
        align: "center",
        type: "custom",
        width: "120px",
        render: (stage: StageRow) => <span className="fw-bold">{stage.sequence}</span>,
      });
    }

    if (selectedStagesColumns.includes("type")) {
      cols.push({
        key: "type",
        label: "Type",
        sortable: true,
        type: "custom",
        render: (stage: StageRow) => (
          <Badge
            bg={getTypeBadgeColor(stage.type)}
            className="bg-opacity-10 text-dark"
          >
            {getTypeDisplayName(stage.type)}
          </Badge>
        ),
      });
    }

    if (selectedStagesColumns.includes("description")) {
      cols.push({
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "360px",
        render: (stage: StageRow) => (
          <CrmTruncatedDescriptionCell
            text={stage.description}
            emptyDisplay="No description"
          />
        ),
      });
    }

    if (selectedStagesColumns.includes("color")) {
      cols.push({
        key: "color",
        label: "Color",
        sortable: false,
        type: "custom",
        render: (stage: StageRow) => <CrmColorCell color={stage.color} />,
      });
    }

    cols.push({
      key: "actions",
      label: "Actions",
      sortable: false,
      type: "custom",
      render: (stage: StageRow) => (
        <div className="d-flex gap-1">
          {activeFilter === "deleted" ? (
            <>
              <Button
                variant="link"
                size="sm"
                className="p-1"
                title="View"
                onClick={() => openStageView(stage)}
                aria-label={"View stage " + stage.name}
              >
                <Eye size={16} aria-hidden />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="p-1 text-success"
                title="Restore"
                onClick={() => openRestoreModal(stage)}
                aria-label={"Restore stage " + stage.name}
              >
                <RotateCcw size={16} aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="link"
                size="sm"
                className="p-1"
                title="View"
                onClick={() => openStageView(stage)}
                aria-label={"View stage " + stage.name}
              >
                <Eye size={16} aria-hidden />
              </Button>
              {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_STAGES) && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-1"
                  title="Edit Stage"
                  onClick={() => openStageEdit(stage)}
                  aria-label={"Edit stage " + stage.name}
                >
                  <Edit size={16} aria-hidden />
                </Button>
              )}
              {session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_STAGES) && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-1 text-danger"
                  title="Delete Stage"
                  onClick={() => openStageDelete(stage)}
                  aria-label={"Delete stage " + stage.name}
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    });

    return cols;
  }, [
    selectedStagesColumns,
    activeFilter,
    session?.user?.permissions,
    openStageView,
    openRestoreModal,
    openStageEdit,
    openStageDelete,
  ]);

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: stagesSearch,
      searchPlaceholder: "Search stages...",
      onSearchChange: handleToolbarSearchChange,
      onSearch: handleToolbarSearchSubmit,
      showTabs: true,
      tabs: [
        { id: "all", label: "All Types", count: filterCounts.all, removable: false },
        { id: "lead", label: "Lead", count: filterCounts.lead, removable: false },
        { id: "deal", label: "Deal", count: filterCounts.deal, removable: false },
        { id: "order", label: "Order", count: filterCounts.order, removable: false },
        { id: "lost_reason", label: "Lost Reason", count: filterCounts.lost_reason, removable: false },
        { id: "deleted", label: "Deleted", removable: false },
      ],
      activeTab: activeFilter,
      onTabChange: handleToolbarTabChange,
      rightActions: (
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`stages-toolbar-btn stages-toolbar-btn--analytics${showStagesAnalytics ? " is-active" : ""}`}
            onClick={toggleStagesAnalytics}
          >
            <BarChart3 size={15} aria-hidden />
            Analytics
          </button>
          {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_STAGES) && (
            <button
              type="button"
              className="stages-toolbar-btn stages-toolbar-btn--add"
              onClick={openCreateStageModal}
            >
              <Plus size={15} aria-hidden />
              Add Custom Stage
            </button>
          )}
        </div>
      ),
    }),
    [
      stagesSearch,
      activeFilter,
      filterCounts,
      showStagesAnalytics,
      session?.user?.permissions,
      handleToolbarSearchChange,
      handleToolbarSearchSubmit,
      handleToolbarTabChange,
      toggleStagesAnalytics,
      openCreateStageModal,
    ],
  );

  if (!session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_STAGES)) {
    return null;
  }

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Stages"
        />
      )}

      <div>
        {/* Analytics Section - Collapsible */}
        {showStagesAnalytics && (
          <>
            {/* Summary Stats */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Stages"
                  value={analyticsData.total.toString()}
                  icon={<Layers size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Lead Stages"
                  value={analyticsData.byType.lead.toString()}
                  icon={<Target size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Deal Stages"
                  value={analyticsData.byType.deal.toString()}
                  icon={<TrendingUp size={24} />}
                  color="warning"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Order Stages"
                  value={analyticsData.byType.order.toString()}
                  icon={<Layers size={24} />}
                  color="success"
                />
              </Col>
            </Row>

            {/* Analytics Charts */}
            {analyticsData.stagesByType.length > 0 && (
              <Row className="mb-4">
                <Col lg={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="mb-4 fw-bold">Stages by Type</h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analyticsData.stagesByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props) => {
                              const slice = props as unknown as {
                                type?: string;
                                count?: number;
                                payload?: { type?: string; count?: number };
                              };
                              const p = slice.payload ?? slice;
                              return `${p.type ?? ""}: ${p.count ?? 0}`;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.stagesByType.map((entry) => (
                              <Cell
                                key={`pie-slice-${entry.type}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}

        {/* Stages Table */}
        <div className="stages-table-wrapper mb-4">
          <GenericTable<StageRow>
            data={paginatedStages}
            columns={stagesTableColumns}
            actions={[]}
            showActions={false}
            sortable
            defaultSortBy={stagesPagination.sortBy}
            defaultSortOrder={stagesPagination.sortOrder}
            onSort={handleStagesSort}
            loading={loadingStages}
            emptyMessage="No stages found matching your criteria"
            pagination={{
              currentPage: stagesPagination.currentPage,
              rowsPerPage: stagesPagination.rowsPerPage,
              totalRows: filteredStages.length,
              pageSizeOptions: [10, 15, 25, 50, 100],
            }}
            onPaginationChange={handleStagesPaginationChange}
            customizableColumns
            selectedColumns={selectedStagesColumns}
            defaultSelectedColumns={DEFAULT_STAGES_SELECTED_COLUMNS}
            onColumnChange={setSelectedStagesColumns}
            columnStorageKey={STAGES_TABLE_COLUMN_STORAGE_KEY}
            showToolbar={true}
            toolbar={toolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
            onPreviewClick={(stage) => openStageView(stage)}
          />
        </div>
      </div>

      {showCreateModal && (
        <>
          <div className="stages-create-overlay contact-sidebar-overlay" aria-hidden="true" />

          <div className="stages-create-sidebar contact-sidebar-container">
            <div className="stages-create-header contact-sidebar-header">
              <h2 className="stages-create-title contact-sidebar-title">
                Create Stage
              </h2>
              <button
                type="button"
                className="stages-create-close contact-sidebar-close-btn"
                onClick={() => setShowCreateModal(false)}
                disabled={submittingStageForm}
                aria-label="Close create stage sidebar"
              >
                <X size={24} />
              </button>
            </div>

            <Form onSubmit={handleSubmit} className="stages-create-form">
              <div className="stages-create-content contact-sidebar-content">
                <p className="stages-create-intro">
                  Please fill in the details below to create a new stage.
                </p>
                <StageFormFields
                  formData={formData}
                  onChange={handleInputChange}
                  singleColumn
                />
              </div>

              <div className="stages-create-footer contact-sidebar-footer">
                <button
                  type="submit"
                  className="stages-create-submit"
                  disabled={submittingStageForm}
                >
                  {submittingStageForm ? "Creating Stage..." : "Create Stage"}
                </button>
                <button
                  type="button"
                  className="stages-create-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submittingStageForm}
                >
                  Cancel
                </button>
              </div>
            </Form>
          </div>
        </>
      )}

      {/* Update Stage Modal */}
      <FormModal
        show={showUpdateModal}
        onHide={handleCloseUpdateModal}
        title="Update Stage"
        desc="Please update the details below for this stage."
        size="lg"
        formHtml={
          <Form onSubmit={handleUpdateStage}>
            <StageFormFields formData={formData} onChange={handleInputChange} />
          </Form>
        }
        submitButtonText={submittingStageForm ? "Updating Stage..." : "Update Stage"}
        cancelButtonText="Cancel"
        onSubmit={() => {
          handleUpdateStage(scaffoldFormEvent()).catch((error: unknown) => {
            consumeHandledApiError(error, "StagesManagement.updateStageSubmit");
          });
        }}
        onCancel={handleCloseUpdateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        isSubmitting={submittingStageForm}
        isSubmitDisabled={submittingStageForm}
        useCrmDialogFooterStyle
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setStageToDelete(null);
        }}
        onConfirm={handleDeleteStage}
        itemName={stageToDelete?.name}
        itemType="stage"
        loading={deletingStage}
      />

      <Modal
        show={showRestoreModal}
        onHide={() => {
          if (restoring) return;
          setShowRestoreModal(false);
          setStageToRestore(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Restore stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stageToRestore && (
            <p className="mb-0">
              Restore <strong>{stageToRestore.name}</strong>? It will be available again in the pipeline.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <div className="w-100 d-flex justify-content-end stages-crm-dialog-footer">
            <button
              type="button"
              className="stages-crm-btn-primary"
              onClick={() => {
                handleConfirmRestore().catch((error: unknown) => {
                  consumeHandledApiError(error, "StagesManagement.restoreStageSubmit");
                });
              }}
              disabled={restoring}
            >
              {restoring ? "Restoring…" : "Restore"}
            </button>
            <button
              type="button"
              className="stages-crm-btn-secondary"
              onClick={() => {
                setShowRestoreModal(false);
                setStageToRestore(null);
              }}
              disabled={restoring}
            >
              Cancel
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Stage View Modal */}
      {viewingStage && (
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          size="xl"
          centered
        >
          {/* Custom Header */}
          <div className="stages-view-header">
            <button
              type="button"
              className="stages-view-close"
              aria-label="Close stage details"
              onClick={() => setShowViewModal(false)}
            >
              <X size={20} aria-hidden />
            </button>
            <h3 className="stages-view-title">
              {viewingStage.name}
            </h3>
            <p className="stages-view-subtitle">
              Stage Details
            </p>
          </div>

          <Modal.Body className="stages-view-body">
            {/* Stage Information Section */}
            <div className="stages-view-section-title">
              <Layers size={18} className="stages-view-section-icon" aria-hidden />
              Stage Information
            </div>
            <div className="stages-view-grid">
              <div className="stages-view-tile">
                <div className="stages-view-tile-label">
                  Stage Name
                </div>
                <div className="stages-view-tile-value">
                  {viewingStage.name}
                </div>
              </div>
              <div className="stages-view-tile">
                <div className="stages-view-tile-label">
                  Sequence
                </div>
                <div className="stages-view-tile-value">
                  {viewingStage.sequence}
                </div>
              </div>
              <div className="stages-view-tile">
                <div className="stages-view-tile-label">
                  Type
                </div>
                <div className="stages-view-tile-value">
                  <Badge bg={getTypeBadgeColor(viewingStage.type)}>
                    {getTypeDisplayName(viewingStage.type)}
                  </Badge>
                </div>
              </div>
              <div className="stages-view-tile">
                <div className="stages-view-tile-label">
                  Color
                </div>
                <div className="stages-view-tile-value stages-view-tile-value-row">
                  <div
                    className="stages-view-color-swatch"
                    aria-label={`Color ${viewingStage.color}`}
                    title={viewingStage.color}
                    style={{ backgroundColor: viewingStage.color }}
                  />
                </div>
              </div>
              <div className="stages-view-tile">
                <div className="stages-view-tile-label">
                  Created Date
                </div>
                <div className="stages-view-tile-value">
                  {formatCrmPreviewDate(viewingStage.created_at)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="stages-view-section-title">
              <FileText size={18} className="stages-view-section-icon" aria-hidden />
              Description
            </div>
            <CrmDescriptionDetailsBlock
              text={viewingStage.description}
              emptyDisplay="No description"
            />

            {/* Action Buttons */}
            <div className="stages-view-footer">
              {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_STAGES) && (
                <button
                  type="button"
                  className="stages-crm-btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    openStageEdit(viewingStage);
                  }}
                >
                  <FiEdit2 size={16} aria-hidden />
                  Edit Stage
                </button>
              )}
              <button
                type="button"
                className="stages-crm-btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={handleCloseSuccessfulModal}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

StagesManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StagesManagement;

