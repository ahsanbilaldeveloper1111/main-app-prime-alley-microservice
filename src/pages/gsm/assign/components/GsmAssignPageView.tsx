import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Button, Col, Modal, Row } from "react-bootstrap";
import Select from "@components/AppSelect";

import GsmCompanyFilter from "@components/filters/GsmCompanyFilter";
import GsmAssignmentModal from "@components/gsm/partials/GsmAssignmentModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import PortLinkUnlinkModal from "@components/gsm/partials/PortLinkUnlinkModal";
import type { GsmAssignPageContext } from "../useGsmAssignPage";

/**
 * Single `.find` for react-select `value` (avoids duplicate search + find-as-boolean smell).
 */
function selectOptionFromList<T>(
  list: T[],
  match: (item: T) => boolean,
  optionValue: unknown,
  toLabel: (item: T) => string,
): { value: unknown; label: string } | null {
  const found = list.find(match);
  if (found === undefined) {
    return null;
  }
  return { value: optionValue, label: toLabel(found) };
}

export function GsmAssignPageView({ ctx }: Readonly<{ ctx: GsmAssignPageContext }>) {
  const {
    session,
    columns,
    refreshKey,
    currentFilters,
    fetchGsmAssign,
    handleFiltersChange,
    handleExport,
    showAssignPortsModal,
    setShowAssignPortsModal,
    GsmUnassignedPorts,
    selectedUnassignedPorts,
    setSelectedUnassignedPorts,
    handleSubmitAssignPorts,
    showUnassignPortsModal,
    setShowUnassignPortsModal,
    GsmAssignedPorts,
    selectedAssignedToUnAssign,
    setSelectedAssignedToUnAssign,
    handleSubmitUnassignPorts,
    showEditLinkModal,
    setShowEditLinkModal,
    gsmList,
    companyList,
    selectedGsmEditLink,
    setSelectedGsmEditLink,
    selectedCompanyEditLink,
    setSelectedCompanyEditLink,
    handleSubmitEditLink,
    showCreateAssignementModal,
    setShowCreateAssignementModal,
    selectedGsmCreateAssignement,
    setSelectedGsmCreateAssignement,
    selectedCompanyCreateAssignement,
    setSelectedCompanyCreateAssignement,
    handleSubmitCreateAssignement,
    showAssignGsmModal,
    setShowAssignGsmModal,
    handleAssignGsm,
    handleAssignmentSuccess,
    successfulPortsModal,
    setSuccessfulPortsModal,
    gsmName,
    showAssignPortsModalNew,
    setShowAssignPortsModalNew,
    companyName,
    assignedPorts,
    unassignedPorts,
    gsmId,
    companyId,
    handlePortsSuccess,
    showDelinkCompanyModal,
    setShowDelinkCompanyModal,
    selectedDelinkGsmName,
    selectedDelinkCompanyName,
    handleSubmitDelinkCompany,
    showExportSuccessfulModal,
    setShowExportSuccessfulModal,
    showUssdModal,
    handleUssdModalClose,
    ussdGsmName,
    ussdPorts,
    selectedUssdPorts,
    setSelectedUssdPorts,
    ussdMessage,
    setUssdMessage,
    handleSubmitUssd,
    ussdLoading,
    showSmsModal,
    handleSmsModalClose,
    smsGsmName,
    smsPorts,
    selectedSmsPort,
    setSelectedSmsPort,
    smsMessage,
    setSmsMessage,
    smsMobileNumber,
    setSmsMobileNumber,
    handleSubmitSms,
    smsLoading,
  } = ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Telco Gateway Assign" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="align-items-center">
              <Col md={5}>
                <h2 className="mb-0 d-flex align-items-center">Telco Gateway Assign</h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">

{session?.user?.permissions?.includes("list-gsm-assignment") && (
                  <GsmCompanyFilter
                    onFiltersChange={handleFiltersChange}
                    onExport={handleExport}
                    showExport={false}
                  />
                  )}

{(session?.user?.permissions?.includes("company-link-gsm-assignment") || session?.user?.permissions?.includes("company-unlink-gsm-assignment")) && (
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
                value={selectOptionFromList(
                  gsmList,
                  (gsm: any) => gsm.id === selectedGsmEditLink,
                  selectedGsmEditLink,
                  (gsm: any) => gsm.name,
                )}
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
                value={selectOptionFromList(
                  companyList,
                  (company: any) => company?.identifier === selectedCompanyEditLink,
                  selectedCompanyEditLink,
                  (company: any) => company?.name ?? "",
                )}
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
        <SuccessfulModal
          show={successfulPortsModal}
          onHide={() => setSuccessfulPortsModal(false)}
          title="Ports Updated!"
          description={`The ports for **${gsmName}** have been successfully updated.`}
          confirmButtonText="OK"
        />
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
        <ConfirmModal
          show={showDelinkCompanyModal}
          onHide={() => setShowDelinkCompanyModal(false)}
          title="Delink Company"
          description={`Are you sure you want to delink **${selectedDelinkGsmName}** from **${selectedDelinkCompanyName}**? This action cannot be undone.`}
          targetName="this operation"
          confirmButtonText="Confirm Delink"
          onConfirm={(confirmationText) => handleSubmitDelinkCompany()}
        />
      )}

      {showExportSuccessfulModal && (
        <SuccessfulModal
          show={showExportSuccessfulModal}
          onHide={() => setShowExportSuccessfulModal(false)}
          title="Export Successful!"
          description="The GSM data has been successfully exported as a JSON file."
          confirmButtonText="OK"
        />
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
                 <output
                   className="d-inline-flex align-items-center m-0 p-0 border-0 bg-transparent"
                   style={{ font: "inherit", color: "inherit" }}
                   aria-live="polite"
                 >
                   <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                   {" "}
                   <span>Sending...</span>
                 </output>
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
                 <output
                   className="d-inline-flex align-items-center m-0 p-0 border-0 bg-transparent"
                   style={{ font: "inherit", color: "inherit" }}
                   aria-live="polite"
                 >
                   <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                   {" "}
                   <span>Sending...</span>
                 </output>
               ) : (
                 "Send SMS"
               )}
             </Button>
           </Modal.Footer>
         </Modal>
       )}
     </React.Fragment>
   );
}
