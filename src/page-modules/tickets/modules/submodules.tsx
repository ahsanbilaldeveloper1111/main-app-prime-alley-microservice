import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  ListSubmodules,
  CreateSubmodule,
  DeleteSubmodule,
  GetAllModules,
  ListSubmoduleChildren,
  CreateSubmoduleChild,
  DeleteSubmoduleChild,
} from "@utils/ticket-module";
import { Column } from "@components/CustomDataTable";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";

import DatatableActionButton from "@components/DatatableActionButton";
import { FiTrash2, FiEye } from "react-icons/fi";

interface Submodule extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  module_id: string;
  created_at: string;
  updated_at: string;
}

interface SubmoduleChild extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  submodule_id: string;
  created_at: string;
  updated_at: string;
}

interface Module extends Record<string, unknown> {
  id: string;
  name: string;
  color: string;
}

function SubmoduleModuleBadgeCell({
  moduleId,
  modules,
}: Readonly<{ moduleId: string; modules: Module[] }>) {
  const moduleItem = modules.find((m) => m.id === moduleId);
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: moduleItem?.color || "#6c757d",
        color: "white",
      }}
    >
      {moduleItem?.name || "Unknown"}
    </span>
  );
}

function SubmoduleCreatedAtCell({ createdAt }: Readonly<{ createdAt: string }>) {
  return <span className="text-muted">{new Date(createdAt).toLocaleDateString()}</span>;
}

function SubmoduleRowActions(
  props: Readonly<{
    row: Submodule;
    onManageChildren: (row: Submodule) => void;
    onRequestDelete: (id: string) => void;
  }>,
) {
  const { row, onManageChildren, onRequestDelete } = props;
  return (
    <DatatableActionButton
      actions={[
        {
          label: "Manage Children",
          icon: <FiEye />,
          onClick: () => onManageChildren(row),
          className: "gap-2",
        },
        {
          label: "Delete",
          icon: <FiTrash2 />,
          onClick: () => {
            onRequestDelete(row.id);
          },
          className: "text-danger gap-2",
        },
      ]}
    />
  );
}

function renderSubmoduleModuleBadgeCell(row: Submodule, modulesList: Module[]) {
  return React.createElement(SubmoduleModuleBadgeCell, {
    moduleId: row.module_id,
    modules: modulesList,
  });
}

function renderSubmoduleCreatedAtCell(row: Submodule) {
  return React.createElement(SubmoduleCreatedAtCell, {
    createdAt: row.created_at,
  });
}

function renderSubmoduleRowActionsCell(
  row: Submodule,
  onManageChildren: (submodule: Submodule) => void | Promise<void>,
  onRequestDelete: (id: string) => void,
) {
  return React.createElement(SubmoduleRowActions, {
    row,
    onManageChildren,
    onRequestDelete,
  });
}

function buildSubmoduleColumns(
  modulesList: Module[],
  onManageChildren: (submodule: Submodule) => void | Promise<void>,
  onRequestDelete: (id: string) => void,
): Column<Submodule>[] {
  return [
    {
      key: "name",
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      key: "description",
      name: "Description",
      selector: (row) => row.description || "No description",
      sortable: true,
    },
    {
      key: "module",
      name: "Module",
      selector: (row) => {
        const moduleItem = modulesList.find((m) => m.id === row.module_id);
        return moduleItem?.name || "Unknown";
      },
      sortable: true,
      cell(row: Submodule) {
        return renderSubmoduleModuleBadgeCell(row, modulesList);
      },
    },
    {
      key: "created_at",
      name: "Created At",
      selector: (row) => row.created_at,
      sortable: true,
      cell(row: Submodule) {
        return renderSubmoduleCreatedAtCell(row);
      },
    },
    {
      key: "actions",
      name: "Actions",
      selector: (row) => row.id,
      sortable: false,
      cell(row: Submodule) {
        return renderSubmoduleRowActionsCell(row, onManageChildren, onRequestDelete);
      },
    },
  ];
}

const SubmodulesPage = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({ search: "" });
  const [modules, setModules] = useState<Module[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSubmoduleChildrenModal, setShowSubmoduleChildrenModal] =
    useState<boolean>(false);
  const [selectedSubmodule, setSelectedSubmodule] = useState<Submodule | null>(
    null,
  );

  // Form states
  const [newSubmoduleName, setNewSubmoduleName] = useState<string>("");
  const [newSubmoduleDescription, setNewSubmoduleDescription] =
    useState<string>("");
  const [newSubmoduleModuleId, setNewSubmoduleModuleId] = useState<string>("");
  const [newSubmoduleUserExtension, setNewSubmoduleUserExtension] = useState<
    string | null
  >(null);

  // Submodule children form states
  const [newChildName, setNewChildName] = useState<string>("");
  const [newChildDescription, setNewChildDescription] = useState<string>("");
  const [newChildUserExtension, setNewChildUserExtension] = useState<
    string | null
  >(null);
  const [submoduleChildren, setSubmoduleChildren] = useState<SubmoduleChild[]>(
    [],
  );
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(false);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  // Fetch modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        const modulesData: any = await GetAllModules();
        if (modulesData) {
          setModules(modulesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const fetchSubmodules = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListSubmodules({
        page,
        perPage,
        search: currentFilters.search || search,
        filters: memoizedFilters,
      });
    },
    [memoizedFilters, currentFilters],
  );

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const handleCreateSubmodule = useCallback(async () => {
    if (!newSubmoduleName.trim() || !newSubmoduleModuleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await CreateSubmodule(
        newSubmoduleName,
        newSubmoduleDescription,
        newSubmoduleModuleId,
        newSubmoduleUserExtension,
      );

      if (response) {
        setNewSubmoduleName("");
        setNewSubmoduleDescription("");
        setNewSubmoduleModuleId("");
        setNewSubmoduleUserExtension(null);
        setShowCreateModal(false);
        setRefreshKey((prev) => prev + 1);
        toast.success("Submodule created successfully");
      }
    } catch (error) {
      console.error("Error creating submodule:", error);
      toast.error("Failed to create submodule");
    }
  }, [
    newSubmoduleName,
    newSubmoduleDescription,
    newSubmoduleModuleId,
    newSubmoduleUserExtension,
  ]);

  const [selectedSubmoduleForDelete, setSelectedSubmoduleForDelete] = useState<
    string | null
  >(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] =
    useState<boolean>(false);

  const handleDeleteSubmodule = useCallback(async () => {
    console.log(selectedSubmoduleForDelete);
    const response = await DeleteSubmodule(
      selectedSubmoduleForDelete?.toString() || "",
    );
    if (response) {
      setRefreshKey((prev) => prev + 1);
      toast.success("Submodule deleted successfully");
    }
  }, []);

  const openSubmoduleChildrenModal = useCallback(
    async (submodule: Submodule) => {
      setSelectedSubmodule(submodule);
      setShowSubmoduleChildrenModal(true);
      await fetchSubmoduleChildren(submodule.id);
    },
    [],
  );

  const closeSubmoduleChildrenModal = useCallback(() => {
    setSelectedSubmodule(null);
    setShowSubmoduleChildrenModal(false);
    setSubmoduleChildren([]);
    setNewChildName("");
    setNewChildDescription("");
    setNewChildUserExtension(null);
  }, []);

  const fetchSubmoduleChildren = useCallback(async (submoduleId: string) => {
    try {
      setIsLoadingChildren(true);
      const response = await ListSubmoduleChildren({
        filters: { submodule_id: submoduleId },
        perPage: 100, // Get all children for this submodule
      });

      if (response?.data) {
        setSubmoduleChildren(response.data);
      } else {
        setSubmoduleChildren([]);
      }
    } catch (error) {
      console.error("Error fetching submodule children:", error);
      toast.error("Failed to fetch submodule children");
      setSubmoduleChildren([]);
    } finally {
      setIsLoadingChildren(false);
    }
  }, []);

  const handleCreateChild = useCallback(async () => {
    if (!newChildName.trim() || !selectedSubmodule) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await CreateSubmoduleChild(
        newChildName,
        newChildDescription,
        selectedSubmodule.module_id,
        selectedSubmodule.id,
        newChildUserExtension,
      );

      if (response) {
        setNewChildName("");
        setNewChildDescription("");
        setNewChildUserExtension(null);
        // Refresh the children list
        await fetchSubmoduleChildren(selectedSubmodule.id);
        toast.success("Submodule child created successfully");
      }
    } catch (error) {
      console.error("Error creating submodule child:", error);
      toast.error("Failed to create submodule child");
    }
  }, [
    newChildName,
    newChildDescription,
    newChildUserExtension,
    selectedSubmodule,
    fetchSubmoduleChildren,
  ]);

  const handleDeleteChild = useCallback(
    async (child: SubmoduleChild) => {
      const response = await DeleteSubmoduleChild(child.id);
      if (response && selectedSubmodule) {
        // Refresh the children list
        await fetchSubmoduleChildren(selectedSubmodule.id);
        toast.success("Submodule child deleted successfully");
      }
    },
    [selectedSubmodule, fetchSubmoduleChildren],
  );

  const columns = useMemo(
    () =>
      buildSubmoduleColumns(modules, openSubmoduleChildrenModal, (id) => {
        setSelectedSubmoduleForDelete(id);
        setShowSubmoduleDeleteModal(true);
      }),
    [modules, openSubmoduleChildrenModal],
  );

  let existingChildrenSection: ReactNode;
  if (isLoadingChildren) {
    existingChildrenSection = (
      <div className="text-center">
        <p className="text-muted">Loading children...</p>
      </div>
    );
  } else if (submoduleChildren.length === 0) {
    existingChildrenSection = (
      <div className="text-center">
        <p className="text-muted">No children created yet.</p>
      </div>
    );
  } else {
    existingChildrenSection = (
      <div
        className="submodule-children-list"
        style={{ maxHeight: "300px", overflowY: "auto" }}
      >
        {submoduleChildren.map((child: SubmoduleChild) => (
          <div key={child.id} className="card mb-2">
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">{child.name}</h6>
                  <p className="mb-1 text-muted small">
                    {child.description || "No description"}
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteChild(child)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Tickets"
        mainLink="/tickets/modules"
        subTitle="Submodules"
      />

      <PageHeader
        title="Sub-Categories"
        showSearch={true}
        searchPlaceholder="Search sub-categories..."
        searchValue={currentFilters.search || ""}
        onSearchChange={(value) =>
          handleFiltersChange({ ...currentFilters, search: value })
        }
        buttons={
          <>
            {session?.user?.permissions?.includes(
              "create-ticket-module-tickets",
            ) && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                New Submodule
              </Button>
            )}
          </>
        }
      />

      {session?.user?.permissions?.includes("ticket-modules-tickets") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchSubmodules}
          title="Submodules"
          searchPlaceholder="Search submodules..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      )}

      {/* Create Submodule Modal */}
      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create New Submodule"
        desc="Please fill in the details below to create a new submodule."
        submitButtonText="Create Submodule"
        cancelButtonText="Cancel"
        onSubmit={handleCreateSubmodule}
        onCancel={() => setShowCreateModal(false)}
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="submoduleName">Submodule Name *</label>
              <input
                type="text"
                className="form-control"
                id="submoduleName"
                value={newSubmoduleName}
                onChange={(e) => setNewSubmoduleName(e.target.value)}
                placeholder="Enter submodule name"
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="submoduleDescription">Description</label>
              <textarea
                className="form-control"
                id="submoduleDescription"
                value={newSubmoduleDescription}
                onChange={(e) => setNewSubmoduleDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="submoduleModule">Module *</label>
              <select
                className="form-control"
                id="submoduleModule"
                value={newSubmoduleModuleId}
                onChange={(e) => setNewSubmoduleModuleId(e.target.value)}
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {/* Submodule Children Modal */}
      <FormModal
        show={showSubmoduleChildrenModal}
        onHide={closeSubmoduleChildrenModal}
        title={`Manage Submodule Children - ${selectedSubmodule?.name}`}
        desc="Create new children and manage existing ones for this submodule."
        submitButtonText="Create Child"
        cancelButtonText="Close"
        onSubmit={handleCreateChild}
        onCancel={closeSubmoduleChildrenModal}
        formHtml={
          <div className="row">
            {/* Create New Child Section */}
            <div className="col-md-6">
              <h5>Create New Child</h5>
              <div className="form-group mb-3">
                <label htmlFor="childName">Child Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter child name"
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="childDescription">Description</label>
                <textarea
                  className="form-control"
                  id="childDescription"
                  value={newChildDescription}
                  onChange={(e) => setNewChildDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Existing Children Section */}
            <div className="col-md-6">
              <h5>Existing Children</h5>
              {existingChildrenSection}
            </div>
          </div>
        }
      />

      {/* Delete Submodule Confirmation Modal */}
      <ConfirmModal
        show={showSubmoduleDeleteModal}
        onHide={() => setShowSubmoduleDeleteModal(false)}
        title="Delete Submodule"
        description="Are you sure you want to delete this submodule? This action cannot be undone."
        targetName=""
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteSubmodule}
        onCancel={() => setShowSubmoduleDeleteModal(false)}
      />
    </React.Fragment>
  );
};

SubmodulesPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SubmodulesPage;
