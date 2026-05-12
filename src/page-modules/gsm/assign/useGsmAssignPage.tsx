import { useSession } from "next-auth/react";
import { useState, useMemo, useCallback } from "react";
import { FiTrash2, FiEye, FiSend, FiMessageSquare } from "react-icons/fi";
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
import { toast } from "react-toastify";
import DatatableActionButton from "@components/DatatableActionButton";

export function useGsmAssignPage() {
  const { data: session } = useSession();

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

  const handleManagePorts = useCallback((props: any) => {
    setGsmName(props.gsm_name || "GSM Device");
    setCompanyName(props.company_name || "Company");
    setAssignedPorts(props.assigned_ports || "");
    setUnassignedPorts(props.unassigned_ports || []);
    setGsmId(props.gsm_id);
    setCompanyId(props.company_id);
    setShowAssignPortsModalNew(true);
  }, []);

  const [successfulPortsModal, setSuccessfulPortsModal] = useState(false);
  const handlePortsSuccess = () => {
    setRefreshKey((k) => k + 1);
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
        setRefreshKey((k) => k + 1);
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
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Unassign ports error:", error);
      toast.error("Unassign ports failed. Please try again.");
    }
  };

  const [showDelinkCompanyModal, setShowDelinkCompanyModal] = useState(false);
  const [selectedDelinkId, setSelectedDelinkId] = useState<string>("");
  const [selectedDelinkGsmName, setSelectedDelinkGsmName] =
    useState<string>("");
  const [selectedDelinkCompanyName, setSelectedDelinkCompanyName] =
    useState<string>("");

  const handleDelinkCompany = useCallback((props: any) => {
    setSelectedDelinkId(props.id);
    setSelectedDelinkGsmName(props.gsm_name);
    setSelectedDelinkCompanyName(props.company_name);
    setShowDelinkCompanyModal(true);
  }, []);

  const handleSubmitDelinkCompany = async () => {
    try {
      const response = await DelinkCompany(selectedDelinkId);
      if (response) {
        setRefreshKey((k) => k + 1);
        setShowDelinkCompanyModal(false);
        setSelectedDelinkId("");
        setSelectedDelinkGsmName("");
        setSelectedDelinkCompanyName("");
      }
    } catch (error) {
      console.error("Error delinking company:", error);
      toast.error("Could not delink company. Please try again.");
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
      setSelectedGsmEditLink(props.gsm_id ?? props.gsm_ip);
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
      setRefreshKey((k) => k + 1);
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
      setRefreshKey((k) => k + 1);
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
    setRefreshKey((k) => k + 1); // Refresh the list
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

  const handleSendUssd = useCallback(async (props: any) => {
    try {
      setUssdGsmId(props.gsm_id);
      setUssdGsmName(props.gsm_name);
      setUssdMessage("");
      setSelectedUssdPorts([]);

      // Fetch ports for this GSM
      const response = await ViewGsm(props.gsm_id, {
        company: props?.company_identifier,
      });
      if (response?.data) {
        setUssdPorts(response.data);
        setShowUssdModal(true);
      } else {
        toast.error("Failed to fetch ports for this GSM");
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to fetch GSM ports");
    }
  }, []);

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
      if (response?.code == 200) {
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

  const handleSendSms = useCallback(async (props: any) => {
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
      if (response?.data) {
        setSmsPorts(response.data);
        setShowSmsModal(true);
      } else {
        toast.error("Failed to fetch ports for this GSM");
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to fetch GSM ports");
    }
  }, []);

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
      if (response?.code == 200) {
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
  const columns: Column[] = useMemo(
    () => [
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
                ...(session?.user?.permissions?.includes("assign-port-gsm-assignment") ||
                session?.user?.permissions?.includes("unassign-port-gsm-assignment")
                  ? [
                      {
                        label: "Ports",
                        icon: <FiEye className="me-2" />,
                        onClick: () => handleManagePorts(props),
                        className: "action-view",
                      },
                    ]
                  : []),
                ...(session?.user?.permissions?.includes("send-ussd-gsm-assignment")
                  ? [
                      {
                        label: "Send USSD",
                        icon: <FiSend className="me-2" />,
                        onClick: () => handleSendUssd(props),
                        className: "action-send",
                      },
                    ]
                  : []),
                ...(session?.user?.permissions?.includes("send-sms-gsm-assignment")
                  ? [
                      {
                        label: "Send SMS",
                        icon: <FiMessageSquare className="me-2" />,
                        onClick: () => handleSendSms(props),
                        className: "action-sms",
                      },
                    ]
                  : []),
                ...(session?.user?.permissions?.includes("delete-gsm-assignment")
                  ? [
                      {
                        label: "Delete",
                        icon: <FiTrash2 className="me-2" />,
                        onClick: () => handleDelinkCompany(props),
                        className: "action-delete",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        ),
      },
    ],
    [session, handleManagePorts, handleDelinkCompany, handleSendUssd, handleSendSms],
  );

  return {
    session,
    columns,
    refreshKey,
    currentFilters,
    fetchGsmAssign,
    handleFiltersChange,
    handleExport,
    showAssignPortsModal,
    setShowAssignPortsModal,
    selectedPortAssignGsm,
    setSelectedPortAssignGsm,
    selectedGsmAssign,
    setSelectedGsmAssign,
    selectedCompanyAssignGsm,
    setSelectedCompanyAssignGsm,
    GsmUnassignedPorts,
    setGsmUnassignedPorts,
    selectedUnassignedPorts,
    setSelectedUnassignedPorts,
    handleAssignPorts,
    showAssignPortsModalNew,
    setShowAssignPortsModalNew,
    gsmName,
    companyName,
    assignedPorts,
    unassignedPorts,
    gsmId,
    companyId,
    handleManagePorts,
    successfulPortsModal,
    setSuccessfulPortsModal,
    handlePortsSuccess,
    handleSubmitAssignPorts,
    showUnassignPortsModal,
    setShowUnassignPortsModal,
    GsmAssignedPorts,
    setGsmAssignedPorts,
    selectedGsmUnassign,
    setSelectedGsmUnassign,
    selectedCompanyUnassign,
    setSelectedCompanyUnassign,
    selectedAssignedToUnAssign,
    setSelectedAssignedToUnAssign,
    handleUnassignPorts,
    handleSubmitUnassignPorts,
    showDelinkCompanyModal,
    setShowDelinkCompanyModal,
    selectedDelinkId,
    setSelectedDelinkId,
    selectedDelinkGsmName,
    setSelectedDelinkGsmName,
    selectedDelinkCompanyName,
    setSelectedDelinkCompanyName,
    handleDelinkCompany,
    handleSubmitDelinkCompany,
    showEditLinkModal,
    setShowEditLinkModal,
    selectedGsmEditLink,
    setSelectedGsmEditLink,
    selectedCompanyEditLink,
    setSelectedCompanyEditLink,
    gsmList,
    setGsmList,
    companyList,
    setCompanyList,
    selectedEditAssign,
    setSelectedEditAssign,
    handleEditLink,
    handleSubmitEditLink,
    showCreateAssignementModal,
    setShowCreateAssignementModal,
    selectedGsmCreateAssignement,
    setSelectedGsmCreateAssignement,
    selectedCompanyCreateAssignement,
    setSelectedCompanyCreateAssignement,
    handleCreateAssignement,
    handleSubmitCreateAssignement,
    showAssignGsmModal,
    setShowAssignGsmModal,
    handleAssignGsm,
    handleAssignmentSuccess,
    showExportSuccessfulModal,
    setShowExportSuccessfulModal,
    handleExportSuccessful,
    showUssdModal,
    setShowUssdModal,
    ussdPorts,
    setUssdPorts,
    selectedUssdPorts,
    setSelectedUssdPorts,
    ussdMessage,
    setUssdMessage,
    ussdGsmId,
    setUssdGsmId,
    ussdGsmName,
    setUssdGsmName,
    ussdLoading,
    setUssdLoading,
    handleSendUssd,
    handleSubmitUssd,
    handleUssdModalClose,
    showSmsModal,
    setShowSmsModal,
    smsPorts,
    setSmsPorts,
    selectedSmsPort,
    setSelectedSmsPort,
    smsMessage,
    setSmsMessage,
    smsMobileNumber,
    setSmsMobileNumber,
    smsGsmId,
    setSmsGsmId,
    smsGsmName,
    setSmsGsmName,
    smsLoading,
    setSmsLoading,
    handleSendSms,
    handleSubmitSms,
    handleSmsModalClose,
  };
}

export type GsmAssignPageContext = ReturnType<typeof useGsmAssignPage>;
