import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useMemo, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  ListGsmAssign,
  AssignPorts,
  UnassignPorts,
  DelinkCompany,
  EditAssign,
  NewAssignement,
  ViewGsm,
  SendGsmUssd,
  SendSms,
} from "@utils/GsmAssign";
import { getGsmData } from "@utils/GsmManagement";

import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import Select from "@components/AppSelect";
import "@assets/scss/common.scss";

import GsmCompanyFilter from "@components/filters/GsmCompanyFilter";
import AnimatedNumber from "@components/AnimatedNumber";
import imgStatus1 from "@assets/images/widget/img-status-1.svg";
import imgStatus2 from "@assets/images/widget/img-status-2.svg";
import imgStatus3 from "@assets/images/widget/img-status-3.svg";
import imgStatus4 from "@assets/images/widget/img-status-4.svg";
import { FiEdit, FiTrash2, FiEye, FiSend, FiMessageSquare } from "react-icons/fi";
import DatatableActionButton from "@components/DatatableActionButton";
import GsmAssignmentModal from "@pages/gsm/partial/GsmAssignmentModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import PortLinkUnlinkModal from "../partial/PortLinkUnlinkModal";

const GsmAssign = () => {
  const { data: session, status } = useSession();

  const columns: Column[] = useMemo(() => [
    {
      key: "gsm_name",
      name: "GSM Name",
      selector: (row: any) => row.gsm_name,
      sortable: true,
    },
    {
      key: "gsm_ip",
      name: "GSM IP",
      selector: (row: any) => row.gsm_ip,
      sortable: true,
    },
    {
      key: "company_name",
      name: "Company",
      selector: (row: any) => row.company_name,
      sortable: true,
    },
    {
      key: "assigned_ports",
      name: "Ports",
      selector: (row: any) => row.assigned_ports,
      sortable: true,
    },

    {
      key: "Action",
      name: "ACTION",
      selector: (row: any) => row.id,
      sortable: false,
      cell: (props: any) => (
        <div className="action-buttons-container">
          

          <DatatableActionButton
            actions={[
              
              ...(session?.user?.permissions?.includes('assign-port-gsm-assignment') 
              || session?.user?.permissions?.includes('unassign-port-gsm-assignment') ? [
              {
                label: "Ports",
                icon: <FiEye className="me-2" />,
                onClick: () => handleManagePorts(props),
                className: "action-view",
              },
              ] : []),

              ...(session?.user?.permissions?.includes('send-ussd-gsm-assignment') ? [
              {
                label: "Send USSD",
                icon: <FiSend className="me-2" />,
                onClick: () => handleSendUssd(props),
                className: "action-send",
              },
              ] : []),

              ...(session?.user?.permissions?.includes('send-sms-gsm-assignment') ? [
              {
                label: "Send SMS",
                icon: <FiMessageSquare className="me-2" />,
                onClick: () => handleSendSms(props),
                className: "action-sms",
              },
              ] : []),

              ...(session?.user?.permissions?.includes('delete-gsm-assignment') ? [
              {
                label: "Delete",
                icon: <FiTrash2 className="me-2" />,
                onClick: () => handleDelinkCompany(props),
                className: "action-delete",
              },
              ] : []),

            ]}
          />
        </div>
      ),
    },
  ], []);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const fetchGsmAssign = useCallback(async (page = 1, perPage = 15, search = "") => {
    return await ListGsmAssign({
      page,
      perPage,
      search,
      filters: currentFilters,
    });
  }, [currentFilters]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const handleExport = async (
    exportType: string,
    filters: Record<string, any>
  ) => {
    setShowExportSuccessfulModal(true);
    // try {
    //     const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
    //     console.log(response);
    // } catch (error) {
    //     console.error('Export error:', error);
    //     toast.error('Export failed. Please try again.');
    // }
  };

  const [showAssignPortsModal, setShowAssignPortsModal] = useState(false);
  const [selectedPortAssignGsm, setSelectedPortAssignGsm] = useState<any>(null);
  const [selectedGsmAssign, setSelectedGsmAssign] = useState<any>(null);
  const [selectedCompanyAssignGsm, setSelectedCompanyAssignGsm] =
    useState<any>(null);
  const [GsmUnassignedPorts, setGsmUnassignedPorts] = useState<any>([]);
  const [selectedUnassignedPorts, setSelectedUnassignedPorts] = useState<any>(
    []
  );

  const handleAssignPorts = (props: any) => {
    setSelectedPortAssignGsm(props.assigned_ports);
    setSelectedCompanyAssignGsm(props.company_id);
    setSelectedGsmAssign(props.gsm_id);
    setGsmUnassignedPorts(props.unassigned_ports);
    setSelectedUnassignedPorts([]);
    setShowAssignPortsModal(true);
  };

  const [showAssignPortsModalNew, setShowAssignPortsModalNew] = useState(false);
  const [gsmName, setGsmName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [assignedPorts, setAssignedPorts] = useState("");
  const [unassignedPorts, setUnassignedPorts] = useState<any[]>([]);
  const [gsmId, setGsmId] = useState("");
  const [companyId, setCompanyId] = useState("");

  const handleManagePorts = (props: any) => {
    setGsmName(props.gsm_name || "GSM Device");
    setCompanyName(props.company_name || "Company");
    setAssignedPorts(props.assigned_ports || "");
    setUnassignedPorts(props.unassigned_ports || []);
    setGsmId(props.gsm_id);
    setCompanyId(props.company_id);
    setShowAssignPortsModalNew(true);
  };

  const [successfulPortsModal, setSuccessfulPortsModal] = useState(false);
  const handlePortsSuccess = () => {
    setRefreshKey(refreshKey + 1);
    setShowAssignPortsModalNew(false);
    setSuccessfulPortsModal(true);
  };

  const handleSubmitAssignPorts = async () => {
    try {
      const response = await AssignPorts(
        selectedGsmAssign,
        selectedCompanyAssignGsm,
        selectedUnassignedPorts
      );
      if (response) {
        setSelectedUnassignedPorts([]);
        setSelectedCompanyAssignGsm(null);
        setSelectedPortAssignGsm(null);
        setSelectedGsmAssign(null);
        setGsmUnassignedPorts([]);
        setShowAssignPortsModal(false);
        setRefreshKey(refreshKey + 1);
      }
    } catch (error) {
      console.error("Assign ports error:", error);
      toast.error("Assign ports failed. Please try again.");
    }
  };

  const [showUnassignPortsModal, setShowUnassignPortsModal] = useState(false);
  const [GsmAssignedPorts, setGsmAssignedPorts] = useState<any>([]);
  const [selectedGsmUnassign, setSelectedGsmUnassign] = useState<any>(null);
  const [selectedCompanyUnassign, setSelectedCompanyUnassign] =
    useState<any>(null);
  const [selectedAssignedToUnAssign, setSelectedAssignedToUnAssign] =
    useState<any>([]);

  const handleUnassignPorts = (props: any) => {
    console.log(props);
    if (props.assigned_ports.length > 0) {
      // Convert assigned_ports string to array of objects for Select component
      const portsArray = props.assigned_ports
        .split(",")
        .map((portNumber: string) => ({
          id: portNumber.trim(),
          port_number: portNumber.trim(),
        }));
      setGsmAssignedPorts(portsArray);
    }

    setSelectedGsmUnassign(props.gsm_id);
    setSelectedCompanyUnassign(props.company_id);
    // setSelectedAssignedToUnAssign(props.assigned_to);
    setShowUnassignPortsModal(true);
  };

  const handleSubmitUnassignPorts = async () => {
    try {
      console.log(selectedAssignedToUnAssign);
      const selectedUnAssignPorts = selectedAssignedToUnAssign.map(
        (port: any) => port.port_number
      );
      console.log(selectedUnAssignPorts);
      if (selectedUnAssignPorts.length == 0) {
        toast.error("Please select at least one port to unassign");
        return;
      }
      const response = await UnassignPorts(
        selectedGsmUnassign,
        selectedCompanyUnassign,
        selectedUnAssignPorts
      );
      if (response) {
        setShowUnassignPortsModal(false);
        setSelectedAssignedToUnAssign([]);
        setSelectedGsmUnassign(null);
        setSelectedCompanyUnassign(null);
        setGsmAssignedPorts([]);
        setRefreshKey(refreshKey + 1);
      }
    } catch (error) {}
  };

  const [showDelinkCompanyModal, setShowDelinkCompanyModal] = useState(false);
  const [selectedDelinkId, setSelectedDelinkId] = useState<string>("");
  const [selectedDelinkGsmName, setSelectedDelinkGsmName] =
    useState<string>("");
  const [selectedDelinkCompanyName, setSelectedDelinkCompanyName] =
    useState<string>("");

  const handleDelinkCompany = async (props: any) => {
    setSelectedDelinkId(props.id);
    setSelectedDelinkGsmName(props.gsm_name);
    setSelectedDelinkCompanyName(props.company_name);
    setShowDelinkCompanyModal(true);
  };

  const handleSubmitDelinkCompany = async () => {
    try {
      const response = await DelinkCompany(selectedDelinkId);
      if (response) {
        setRefreshKey(refreshKey + 1);
        setShowDelinkCompanyModal(false);
        setSelectedDelinkId("");
        setSelectedDelinkGsmName("");
        setSelectedDelinkCompanyName("");
      }
    } catch (error) {
      console.error("Error delinking company:", error);
    }
  };

  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [selectedGsmEditLink, setSelectedGsmEditLink] = useState<any>(null);
  const [selectedCompanyEditLink, setSelectedCompanyEditLink] =
    useState<any>(null);

  const [gsmList, setGsmList] = useState<any>([]);
  const [companyList, setCompanyList] = useState<any>([]);

  const [selectedEditAssign, setSelectedEditAssign] = useState<any>(null);

  const handleEditLink = async (props: any) => {
    const response = await getGsmData();
    console.log(response);
    console.log(props);
    if (response) {
      setGsmList(response?.gsm);
      setCompanyList(response?.company);
      setSelectedGsmEditLink(props.gsm_ip);
      setSelectedCompanyEditLink(props.company_identifier);
      setSelectedEditAssign(props.id);
      setShowEditLinkModal(true);
    }
  };

  const handleSubmitEditLink = async () => {
    console.log(
      selectedEditAssign,
      selectedGsmEditLink,
      selectedCompanyEditLink
    );
    const response = await EditAssign(
      selectedEditAssign,
      selectedGsmEditLink,
      selectedCompanyEditLink
    );
    if (response) {
      setShowEditLinkModal(false);
      setRefreshKey(refreshKey + 1);
    }
  };

  const [showCreateAssignementModal, setShowCreateAssignementModal] =
    useState(false);
  const [selectedGsmCreateAssignement, setSelectedGsmCreateAssignement] =
    useState<any>(null);
  const [
    selectedCompanyCreateAssignement,
    setSelectedCompanyCreateAssignement,
  ] = useState<any>(null);

  const handleCreateAssignement = async () => {
    const response = await getGsmData();
    console.log(response);
    if (response) {
      setGsmList(response?.gsm);
      setCompanyList(response?.company);
      setShowCreateAssignementModal(true);
    }
  };
  const handleSubmitCreateAssignement = async () => {
    const response = await NewAssignement(
      selectedGsmCreateAssignement,
      selectedCompanyCreateAssignement
    );
    if (response) {
      setShowCreateAssignementModal(false);
      setRefreshKey(refreshKey + 1);
    }
  };

  const [showAssignGsmModal, setShowAssignGsmModal] = useState(false);

  const handleAssignGsm = async () => {
    setShowAssignGsmModal(true);
  };

  const handleAssignmentSuccess = (assignment: {
    selectedGsm: string;
    selectedCompany: string;
  }) => {
    console.log("Assignment successful:", assignment);
    // Add any additional logic here if needed
    setRefreshKey(refreshKey + 1); // Refresh the list
  };

  const [showExportSuccessfulModal, setShowExportSuccessfulModal] =
    useState(false);

  const handleExportSuccessful = async () => {
    setShowExportSuccessfulModal(true);
  };

  // USSD Modal states
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [ussdPorts, setUssdPorts] = useState<any[]>([]);
  const [selectedUssdPorts, setSelectedUssdPorts] = useState<any[]>([]);
  const [ussdMessage, setUssdMessage] = useState("");
  const [ussdGsmId, setUssdGsmId] = useState("");
  const [ussdGsmName, setUssdGsmName] = useState("");
  const [ussdLoading, setUssdLoading] = useState(false);

  // SMS Modal states
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsPorts, setSmsPorts] = useState<any[]>([]);
  const [selectedSmsPort, setSelectedSmsPort] = useState<any>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsMobileNumber, setSmsMobileNumber] = useState("");
  const [smsGsmId, setSmsGsmId] = useState("");
  const [smsGsmName, setSmsGsmName] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);

  const handleSendUssd = async (props: any) => {
    try {
      setUssdGsmId(props.gsm_id);
      setUssdGsmName(props.gsm_name);
      setUssdMessage("");
      setSelectedUssdPorts([]);

      // Fetch ports for this GSM
      const response = await ViewGsm(props.gsm_id, {
        company: props?.company_identifier,
      });
      if (response && response.data) {
        setUssdPorts(response.data);
        setShowUssdModal(true);
      } else {
        toast.error("Failed to fetch ports for this GSM");
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to fetch GSM ports");
    }
  };

  const handleSubmitUssd = async () => {
    try {
      if (selectedUssdPorts.length === 0) {
        toast.error("Please select at least one port");
        return;
      }
      if (!ussdMessage.trim()) {
        toast.error("Please enter a message");
        return;
      }

      setUssdLoading(true);

      const portIds = selectedUssdPorts.map((port) => port.id);
      const payload = {
        port: portIds,
        text: ussdMessage,
        command: "send",
        gsm_id: ussdGsmId,
      };

      const response: any = await SendGsmUssd(payload);
      console.log("ZE RES", response);
      if (response && response.code == 200) {
        setShowUssdModal(false);
        setUssdMessage("");
        setSelectedUssdPorts([]);
        setUssdPorts([]);
        toast.success("USSD command sent successfully");
      } else {
        toast.error("Sending failed");
      }
    } catch (error) {
      console.error("Error sending USSD:", error);
      toast.error("Sending failed");
    } finally {
      setUssdLoading(false);
    }
  };

  const handleUssdModalClose = () => {
    setShowUssdModal(false);
    setUssdMessage("");
    setSelectedUssdPorts([]);
    setUssdPorts([]);
    setUssdLoading(false);
  };

  const handleSendSms = async (props: any) => {
    try {
      setSmsGsmId(props.gsm_id);
      setSmsGsmName(props.gsm_name);
      setSmsMessage("");
      setSmsMobileNumber("");
      setSelectedSmsPort(null);

      // Fetch ports for this GSM
      const response = await ViewGsm(props.gsm_id, {
        company: props?.company_identifier,
      });
      if (response && response.data) {
        setSmsPorts(response.data);
        setShowSmsModal(true);
      } else {
        toast.error("Failed to fetch ports for this GSM");
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to fetch GSM ports");
    }
  };

  const handleSubmitSms = async () => {
    try {
      if (!selectedSmsPort) {
        toast.error("Please select a port");
        return;
      }
      if (!smsMessage.trim()) {
        toast.error("Please enter a message");
        return;
      }
      if (!smsMobileNumber.trim()) {
        toast.error("Please enter a mobile number");
        return;
      }

      setSmsLoading(true);

      const payload = {
        message: smsMessage,
        port: selectedSmsPort.id,
        gsm_id: smsGsmId,
        mobileNumber: smsMobileNumber,
      };

      const response: any = await SendSms(payload);
      console.log("ZE RES", response);
      if (response && response.code == 200) {
        setShowSmsModal(false);
        setSmsMessage("");
        setSmsMobileNumber("");
        setSelectedSmsPort(null);
        setSmsPorts([]);
        toast.success("SMS sent successfully");
      } else {
        toast.error("Sending failed");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Sending failed");
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSmsModalClose = () => {
    setShowSmsModal(false);
    setSmsMessage("");
    setSmsMobileNumber("");
    setSelectedSmsPort(null);
    setSmsPorts([]);
    setSmsLoading(false);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Telco Gateway Assign" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="align-items-center">
              <Col md={5}>
                <h2 className="mb-0 d-flex align-items-center">
                  {/* Telco Gateway Assign */}
                  {/* {session?.user?.permissions?.includes('company-link-gsm-assignment') && (
                          <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => handleCreateAssignement()}>New Assign</Button>
                      )} */}
                </h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search GSM, Company..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}

{session?.user?.permissions?.includes("list-gsm-assignment") && (
                  <GsmCompanyFilter
                    onFiltersChange={handleFiltersChange}
                    onExport={handleExport}
                    showExport={false}
                  />
                  )}

{session?.user?.permissions?.includes('company-link-gsm-assignment') || session?.user?.permissions?.includes('company-unlink-gsm-assignment') && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAssignGsm()}
                  >
                    <i className="fas fa-plus"></i> New Assign
                  </button>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {session?.user?.permissions?.includes("list-gsm-assignment") && (
        <GenericListPage
          columns={columns}
          fetchData={fetchGsmAssign}
          title="GSM Companies List"
          searchPlaceholder="Search ..."
          defaultPageSize={15}
          filters={currentFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      )}

      {showAssignPortsModal && (
        <Modal
          show={showAssignPortsModal}
          onHide={() => setShowAssignPortsModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Assign Ports
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="company_id">Ports</label>

              <Select
                options={GsmUnassignedPorts.map((port: any) => ({
                  value: port.id,
                  label: `Port ${port.port_number}`,
                }))}
                value={selectedUnassignedPorts.map((portId: any) => {
                  const port = GsmUnassignedPorts.find(
                    (p: any) => p.id === portId
                  );
                  return { value: portId, label: `Port ${port?.port_number}` };
                })}
                onChange={(selectedOptions) => {
                  if (
                    selectedOptions &&
                    Array.isArray(selectedOptions) &&
                    selectedOptions.length > 0
                  ) {
                    // Extract only the IDs from selected options
                    const selectedPortIds = selectedOptions.map(
                      (option: any) => option.value
                    );
                    setSelectedUnassignedPorts(selectedPortIds);
                  } else {
                    setSelectedUnassignedPorts([]);
                  }
                }}
                isMulti
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAssignPortsModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleSubmitAssignPorts}>
              Assign
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showUnassignPortsModal && (
        <Modal
          show={showUnassignPortsModal}
          onHide={() => setShowUnassignPortsModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Unassign Ports
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="company_id">Ports</label>
              <Select
                options={GsmAssignedPorts.map((port: any) => ({
                  value: port.id,
                  label: `Port ${port.port_number}`,
                }))}
                value={selectedAssignedToUnAssign.map((port: any) => ({
                  value: port.id,
                  label: `Port ${port.port_number}`,
                }))}
                onChange={(selectedOptions) => {
                  if (
                    selectedOptions &&
                    Array.isArray(selectedOptions) &&
                    selectedOptions.length > 0
                  ) {
                    // Map the selected options back to the original port objects
                    const selectedPorts = selectedOptions
                      .map((option: any) => {
                        return GsmAssignedPorts.find(
                          (port: any) => port.id === option.value
                        );
                      })
                      .filter(Boolean);
                    setSelectedAssignedToUnAssign(selectedPorts);
                  } else {
                    setSelectedAssignedToUnAssign([]);
                  }
                }}
                isMulti
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowUnassignPortsModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleSubmitUnassignPorts}>
              Unassign
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showEditLinkModal && (
        <Modal
          show={showEditLinkModal}
          onHide={() => setShowEditLinkModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Edit Link
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="company_id">GSM</label>
              <Select
                options={gsmList.map((gsm: any) => ({
                  value: gsm.id,
                  label: gsm.name,
                }))}
                value={
                  gsmList.find((gsm: any) => gsm.id === selectedGsmEditLink)
                    ? {
                        value: selectedGsmEditLink,
                        label: gsmList.find(
                          (gsm: any) => gsm.id === selectedGsmEditLink
                        )?.name,
                      }
                    : null
                }
                onChange={(selectedOption) =>
                  setSelectedGsmEditLink(selectedOption?.value)
                }
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="company_id">Company</label>
              <Select
                options={companyList.map((company: any) => ({
                  value: company?.identifier,
                  label: company?.name,
                }))}
                value={
                  companyList.find(
                    (company: any) =>
                      company?.identifier === selectedCompanyEditLink
                  )
                    ? {
                        value: selectedCompanyEditLink,
                        label: companyList.find(
                          (company: any) =>
                            company?.identifier === selectedCompanyEditLink
                        )?.name,
                      }
                    : null
                }
                onChange={(selectedOption) =>
                  setSelectedCompanyEditLink(selectedOption?.value)
                }
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditLinkModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleSubmitEditLink}>
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showCreateAssignementModal && (
        <Modal
          show={showCreateAssignementModal}
          onHide={() => setShowCreateAssignementModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              New Assign
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="company_id">GSM</label>
              <Select
                options={gsmList.map((gsm: any) => ({
                  value: gsm?.id,
                  label: gsm.name,
                }))}
                value={
                  selectedGsmCreateAssignement
                    ? {
                        value: selectedGsmCreateAssignement,
                        label: gsmList.find(
                          (gsm: any) => gsm?.id === selectedGsmCreateAssignement
                        )?.name,
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  console.log("GSM selectedOption:", selectedOption);
                  setSelectedGsmCreateAssignement(
                    selectedOption?.value || null
                  );
                }}
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="company_id">Company</label>
              <Select
                options={companyList.map((company: any) => ({
                  value: company?.identifier,
                  label: company?.name,
                }))}
                value={
                  selectedCompanyCreateAssignement
                    ? {
                        value: selectedCompanyCreateAssignement,
                        label: companyList.find(
                          (company: any) =>
                            company?.identifier ===
                            selectedCompanyCreateAssignement
                        )?.name,
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  console.log("Company selectedOption:", selectedOption);
                  setSelectedCompanyCreateAssignement(
                    selectedOption?.value || null
                  );
                }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateAssignementModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleSubmitCreateAssignement}>
              Create
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <GsmAssignmentModal
        show={showAssignGsmModal}
        onHide={() => setShowAssignGsmModal(false)}
        onSuccess={handleAssignmentSuccess}
      />

      {successfulPortsModal && (
        <>
          <SuccessfulModal
            show={successfulPortsModal}
            onHide={() => setSuccessfulPortsModal(false)}
            title="Ports Updated!"
            description={`The ports for **${gsmName}** have been successfully updated.`}
            confirmButtonText="OK"
          />
        </>
      )}

      {showAssignPortsModalNew && (
        <PortLinkUnlinkModal
          show={showAssignPortsModalNew}
          onHide={() => setShowAssignPortsModalNew(false)}
          gsmName={gsmName}
          companyName={companyName}
          assignedPorts={assignedPorts}
          unassignedPorts={unassignedPorts}
          gsmId={gsmId}
          companyId={companyId}
          onSuccess={handlePortsSuccess}
        />
      )}

      {showDelinkCompanyModal && (
        <>
          <ConfirmModal
            show={showDelinkCompanyModal}
            onHide={() => setShowDelinkCompanyModal(false)}
            title="Delink Company"
            description={`Are you sure you want to delink **${selectedDelinkGsmName}** from **${selectedDelinkCompanyName}**? This action cannot be undone.`}
            targetName="this operation"
            confirmButtonText="Confirm Delink"
            onConfirm={(confirmationText) => handleSubmitDelinkCompany()}
          />
        </>
      )}

      {showExportSuccessfulModal && (
        <>
          <SuccessfulModal
            show={showExportSuccessfulModal}
            onHide={() => setShowExportSuccessfulModal(false)}
            title="Export Successful!"
            description="The GSM data has been successfully exported as a JSON file."
            confirmButtonText="OK"
          />
        </>
      )}

      {showUssdModal && (
        <Modal show={showUssdModal} onHide={handleUssdModalClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Send USSD Command - {ussdGsmName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="ussd-ports">Select Ports</label>
              <Select
                options={ussdPorts.map((port: any) => ({
                  value: port.id,
                  label: `Port ${port.port_number} - ${
                    port.mobile_number || "No Number"
                  } (${port.sim_status || "Unknown Status"})`,
                }))}
                value={selectedUssdPorts.map((port: any) => ({
                  value: port.id,
                  label: `Port ${port.port_number} - ${
                    port.mobile_number || "No Number"
                  } (${port.sim_status || "Unknown Status"})`,
                }))}
                onChange={(selectedOptions) => {
                  if (
                    selectedOptions &&
                    Array.isArray(selectedOptions) &&
                    selectedOptions.length > 0
                  ) {
                    const selectedPorts = selectedOptions
                      .map((option: any) => {
                        return ussdPorts.find(
                          (port: any) => port.id === option.value
                        );
                      })
                      .filter(Boolean);
                    setSelectedUssdPorts(selectedPorts);
                  } else {
                    setSelectedUssdPorts([]);
                  }
                }}
                isMulti
                placeholder="Select ports to send USSD command to..."
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="ussd-message">USSD Message</label>
              <textarea
                className="form-control"
                id="ussd-message"
                rows={3}
                value={ussdMessage}
                onChange={(e) => setUssdMessage(e.target.value)}
                placeholder="Enter USSD command (e.g., *123#)"
              />
            </div>

            <div className="alert alert-info">
              <strong>Note:</strong> The command will be automatically set to
              "send" and sent to the selected ports.
            </div>
          </Modal.Body>
           <Modal.Footer>
             <Button 
               variant="secondary" 
               onClick={handleUssdModalClose}
               disabled={ussdLoading}
             >
               Cancel
             </Button>
             <Button 
               variant="primary" 
               onClick={handleSubmitUssd}
               disabled={ussdLoading}
             >
               {ussdLoading ? (
                 <>
                   <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                   Sending...
                 </>
               ) : (
                 "Send USSD Command"
               )}
             </Button>
           </Modal.Footer>
         </Modal>
       )}

       {showSmsModal && (
         <Modal show={showSmsModal} onHide={handleSmsModalClose} size="lg">
           <Modal.Header closeButton>
             <Modal.Title>Send SMS - {smsGsmName}</Modal.Title>
           </Modal.Header>
           <Modal.Body>
             <div className="form-group mb-3">
               <label htmlFor="sms-ports">Select Port</label>
               <Select
                 options={smsPorts.map((port: any) => ({
                   value: port.id,
                   label: `Port ${port.port_number} - ${
                     port.mobile_number || "No Number"
                   } (${port.sim_status || "Unknown Status"})`,
                 }))}
                 value={
                   selectedSmsPort
                     ? {
                         value: selectedSmsPort.id,
                         label: `Port ${selectedSmsPort.port_number} - ${
                           selectedSmsPort.mobile_number || "No Number"
                         } (${selectedSmsPort.sim_status || "Unknown Status"})`,
                       }
                     : null
                 }
                 onChange={(selectedOption) => {
                   if (selectedOption) {
                     const selectedPort = smsPorts.find(
                       (port: any) => port.id === selectedOption.value
                     );
                     setSelectedSmsPort(selectedPort);
                   } else {
                     setSelectedSmsPort(null);
                   }
                 }}
                 placeholder="Select a port to send SMS from..."
               />
             </div>

             <div className="form-group mb-3">
               <label htmlFor="sms-mobile">Mobile Number</label>
               <input
                 type="text"
                 className="form-control"
                 id="sms-mobile"
                 value={smsMobileNumber}
                 onChange={(e) => setSmsMobileNumber(e.target.value)}
                 placeholder="Enter mobile number (e.g., +971501234567)"
               />
             </div>

             <div className="form-group mb-3">
               <label htmlFor="sms-message">SMS Message</label>
               <textarea
                 className="form-control"
                 id="sms-message"
                 rows={4}
                 value={smsMessage}
                 onChange={(e) => setSmsMessage(e.target.value)}
                 placeholder="Enter your SMS message..."
               />
             </div>

             <div className="alert alert-info">
               <strong>Note:</strong> The SMS will be sent from the selected port to the specified mobile number.
             </div>
           </Modal.Body>
           <Modal.Footer>
             <Button 
               variant="secondary" 
               onClick={handleSmsModalClose}
               disabled={smsLoading}
             >
               Cancel
             </Button>
             <Button 
               variant="primary" 
               onClick={handleSubmitSms}
               disabled={smsLoading}
             >
               {smsLoading ? (
                 <>
                   <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                   Sending...
                 </>
               ) : (
                 "Send SMS"
               )}
             </Button>
           </Modal.Footer>
         </Modal>
       )}
     </React.Fragment>
   );
};

GsmAssign.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmAssign;
