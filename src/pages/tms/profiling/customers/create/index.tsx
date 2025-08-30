import "@assets/scss/datatable-style.scss";
import "@assets/scss/wizard.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Form, Modal, Row, ProgressBar } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

import { ListCompanies,ListRoutePartitions,ListFacilitiesInfo,ListAppUsers } from "@utils/tms/tmsProfiling";
import {ListRecordingProfile,ListDeviePool} from "@utils/tms/tmsCisxoPbx";
import "@assets/scss/tms.scss";
import Link from "next/link";

interface SelectOption {
  value: number;
  label: string;
}

const CustomerProfilingWizard = () => {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [totalSteps] = useState<number>(6);

  // Form data states
  const [companies, setCompanies] = useState<any[]>([]);
  const [routePartitions, setRoutePartitions] = useState<any[]>([]);
  const [recordingProfiles, setRecordingProfiles] = useState<any[]>([]);
  const [devicePools, setDevicePools] = useState<any[]>([]);
  const [facilitiesInfo, setFacilitiesInfo] = useState<any[]>([]);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [user_id_prefix, setUserIdPrefix] = useState<string>("");
  const [mobile_users, setMobileUsers] = useState<boolean>(false);
  const [iccid, setIccid] = useState<any[]>([]);
  const [showIccid, setShowIccid] = useState<boolean>(false);
  const [allow_gsm, setAllowGsm] = useState<string>("No");
  const [max_users, setMaxUsers] = useState<number>(0);
  const [extensionRanges, setExtensionRanges] = useState<Array<{id: string, start: string, end: string}>>([]);
  const [simPorts, setSimPorts] = useState<any[]>([
    { id: "sim1", value: false, label: "Sim 1" },
    { id: "sim2", value: false, label: "Sim 2" },
    { id: "sim3", value: false, label: "Sim 3" },
    { id: "sim4", value: false, label: "Sim 4" }
  ]);
  const [isMobileUsers, setIsMobileUsers] = useState<boolean>(false);
  const [allowDncr, setAllowDncr] = useState<boolean>(false);
  const [allowFactInfoCallingAccess, setAllowFactInfoCallingAccess] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");

  // Wizard navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return true; // Always valid for first step
      case 2: // Extension Ranges
        return extensionRanges.length > 0;
      case 3: // SIM Ports
        return simPorts.some(port => port.value);
      case 4: // Mobile Users
        return true;
      case 5: // Calling Access
        return true;
      case 6: // Additional Info
        return true;
      default:
        return false;
    }
  };

  // Step titles
  const stepTitles = [
    "Basic Information",
    "Extension Ranges", 
    "SIM Ports",
    "Mobile Users",
    "Calling Access",
    "Additional Information"
  ];

  useEffect(() => {
    fetchCompanies();
    fetchRoutePartitions();
    fetchRecordingProfiles();
    fetchDevicePools();
    fetchFacilitiesInfo();
    fetchAppUsers();
  }, []);

  const fetchCompanies = useCallback(async () => {
    const response = await ListCompanies();
    if(response.length > 0){
      setCompanies(response);
    }
  }, []);

  const fetchRoutePartitions = useCallback(async () => {
    const response = await ListRoutePartitions();
    if(response.length > 0){
      setRoutePartitions(response);
    }
  }, []);

  const fetchRecordingProfiles = useCallback(async () => {
    const response = await ListRecordingProfile();
    if(response?.dataList?.length > 0){
      setRecordingProfiles(response?.dataList);
    }
  }, []);

  const fetchDevicePools = useCallback(async () => {
    const response = await ListDeviePool();
    if(response?.dataList?.length > 0){
      setDevicePools(response?.dataList);
    }
  }, []);

  const fetchFacilitiesInfo = useCallback(async () => {
    const response = await ListFacilitiesInfo();
    if(response?.length > 0){
      setFacilitiesInfo(response);
    }
  }, []);

  const fetchAppUsers = useCallback(async () => {
    const response = await ListAppUsers();
    if(response?.length > 0){
      setAppUsers(response);
    }
  }, []);

  const handleAllowGsmChange = (value: string) => {
    setAllowGsm(value);
    if(value === "Yes"){
      setShowIccid(true);
    }else{
      setShowIccid(false);
    }
  };

  const handleAddExtensionRange = () => {
    const newRange = {
      id: Date.now().toString(),
      start: '',
      end: ''
    };
    setExtensionRanges([...extensionRanges, newRange]);
  };

  const handleRemoveExtensionRange = (id: string) => {
    setExtensionRanges(extensionRanges.filter(range => range.id !== id));
  };

  const handleExtensionRangeChange = (id: string, field: 'start' | 'end', value: string) => {
    setExtensionRanges(extensionRanges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ));
  };

  const handleSimPortToggle = (id: string) => {
    setSimPorts(simPorts.map(simPort => 
      simPort.id === id ? { ...simPort, value: !simPort.value } : simPort
    ));
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', {
      companies, routePartitions, recordingProfiles, devicePools,
      facilitiesInfo, appUsers, user_id_prefix, max_users,
      extensionRanges, simPorts, isMobileUsers, allowDncr,
      allowFactInfoCallingAccess, additionalInfo
    });
    toast.success('Customer Profiling created successfully!');
  };

  const renderStepIndicator = () => (
    <div className="wizard-steps mb-4">
      <div className="d-flex justify-content-between align-items-center">
        {stepTitles.map((title, index) => (
          <div key={index} className="step-indicator">
            <div 
              className={`step-circle ${currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''}`}
              onClick={() => goToStep(index + 1)}
            >
              {currentStep > index + 1 ? '✓' : index + 1}
            </div>
            <div className="step-title">{title}</div>
          </div>
        ))}
      </div>
      <ProgressBar 
        now={(currentStep / totalSteps) * 100} 
        className="mt-3"
        variant="primary"
      />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="row ">
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Company</label>
                <Select
                  options={companies.map((company) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Route Partition</label>
                <Select
                  options={routePartitions.map((routePartition) => ({
                    value: routePartition.id,
                    label: routePartition.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Recording Profile</label>
                <Select
                  options={recordingProfiles.map((recordingProfile) => ({
                    value: recordingProfile.id,
                    label: recordingProfile.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Device Pool</label>
                <Select
                  options={devicePools.map((devicePool) => ({
                    value: devicePool.id,
                    label: devicePool.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Facility Info</label>
                <Select
                  options={facilitiesInfo.map((facilityInfo) => ({
                    value: facilityInfo.id,
                    label: facilityInfo.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>App User</label>
                <Select
                  options={appUsers.map((appUser) => ({
                    value: appUser.id,
                    label: appUser.name,
                  }))}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>User ID Prefix (3 characters max)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={user_id_prefix} 
                  onChange={(e:any) => setUserIdPrefix(e.target.value)} 
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label>Max Users</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={max_users} 
                  onChange={(e:any) => setMaxUsers(e.target.value)} 
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Form.Check 
                    type="switch" 
                    id="allow_gsm"
                    checked={allow_gsm === "Yes"}
                    onChange={(e:any) => handleAllowGsmChange(e.target.checked ? "Yes" : "No")}
                  />
                  <span className="text-muted">Allow GSM</span>
                </div>
              </div>
            </Col>
            {showIccid && (
              <Col md={6}>
                <div className="form-group mb-3">
                  <label>ICCID</label>
                  <Select
                    options={iccid.map((iccid) => ({
                      value: iccid.id,
                      label: iccid.name,
                    }))}
                  />
                </div>
              </Col>
            )}
          </div>
        );

      case 2:
        return (
          <div className="row">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <label>Extension Ranges</label>
                <Button size="sm" variant="outline-primary" onClick={handleAddExtensionRange}>
                  Add Range
                </Button>
              </div>
              <div className="extension-ranges-container">
                {extensionRanges.length === 0 && (
                  <div className="text-muted text-center py-3">
                    No extension ranges added yet. Click "Add Range" to add one.
                  </div>
                )}
                {extensionRanges.map((range) => (
                  <Row key={range.id} className="mb-3 align-items-center">
                    <Col md={5}>
                      <div className="form-group mb-3">
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Start" 
                          min={1}
                          value={range.start}
                          onChange={(e) => handleExtensionRangeChange(range.id, 'start', e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={5}>
                      <div className="form-group mb-3">
                        <input 
                          type="number" 
                          min={1}
                          className="form-control" 
                          placeholder="End" 
                          value={range.end}
                          onChange={(e) => handleExtensionRangeChange(range.id, 'end', e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={2}>
                      <div className="form-group mb-3">
                        <Button 
                          size="sm" 
                          variant="outline-danger" 
                          onClick={() => handleRemoveExtensionRange(range.id)}
                        >
                          <span className="fa fa-trash"></span>
                        </Button>
                      </div>
                    </Col>
                  </Row>
                ))}
              </div>
            </Col>
          </div>
        );

      case 3:
        return (
          <div className="row">
            <Col md={12}>
              <Row className="gap-2 align-items-center">
                {simPorts.map((simPort) => (
                  <Col 
                    md={2} 
                    key={simPort.id} 
                    className={`mb-3 p-3 border rounded ${simPort.value ? 'border-success bg-light-success' : 'border-light-secondary'}`}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <label className={`mb-0 text-uppercase ${simPort.value ? 'text-success fw-bold' : ''}`}>
                        {simPort.label}
                      </label>
                      <Form.Check 
                        type="switch" 
                        id={`sim-${simPort.id}`}
                        checked={simPort.value}
                        onChange={() => handleSimPortToggle(simPort.id)}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </div>
        );

      case 4:
        return (
          <div className="row">
            <Col md={12}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Form.Check 
                  type="switch" 
                  id="allow-mobile-users"
                  checked={isMobileUsers}
                  onChange={() => setIsMobileUsers(!isMobileUsers)}
                />
                <span className="text-muted">Allow Mobile Users</span>
              </div>
              {isMobileUsers && (
                <div className="row">
                  <Col md={6}>
                    <div className="form-group mb-3">
                      <label>Recording Profile Mobile</label>
                      <Select
                        options={recordingProfiles.map((recordingProfile) => ({
                          value: recordingProfile.id,
                          label: recordingProfile.name,
                        }))}
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-group mb-3">
                      <label>Device Pool Mobile</label>
                      <Select
                        options={devicePools.map((devicePool) => ({
                          value: devicePool.id,
                          label: devicePool.name,
                        }))}
                      />
                    </div>
                  </Col>
                </div>
              )}
            </Col>
          </div>
        );

      case 5:
        return (
          <div className="row">
            <Col md={12}>
              <div className="mb-4">
                <h6>Calling Access</h6>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Front End Calling Access</th>
                      <th>Back End Calling Access</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className="text-center">
                        No calling access entries found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                  <Form.Check 
                    type="switch" 
                    id="allow-dncr"
                    checked={allowDncr}
                    onChange={() => setAllowDncr(!allowDncr)}
                  />
                  <span className={`text-muted ${allowDncr ? 'min-width-100' : ''}`}>Allow DNCR</span>
                  </div>
                  {allowDncr && (
                    <div className="d-flex align-items-center gap-2">
                      <div className="input-group">
                      <input type="text" className="form-control" placeholder="Add Front End Calling Access"/>
                      <button className="btn btn-sm btn-primary" type="button">Add</button>
                    </div>
                    </div>
                  )}
                </div>
                {allowDncr && (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Front End Calling Access</th>
                        <th>Back End Calling Access</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="text-center">
                          No calling access entries found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                  <Form.Check 
                    type="switch" 
                    id="allow-fact-info-calling-access"
                    checked={allowFactInfoCallingAccess}
                    onChange={() => setAllowFactInfoCallingAccess(!allowFactInfoCallingAccess)}
                  />
                  <span className={`text-muted ${allowFactInfoCallingAccess ? 'min-width-100' : ''}`}>Allow Fact Info</span>
                  </div>
                  {allowFactInfoCallingAccess && (
                    <div className="d-flex align-items-center gap-2">
                      <div className="input-group">
                      <input type="text" className="form-control" placeholder="Add Front End Calling Access"/>
                      <button className="btn btn-sm btn-primary" type="button">Add</button>
                    </div>
                    </div>
                  )}
                </div>
                {allowFactInfoCallingAccess && (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Front End Calling Access</th>
                        <th>Back End Calling Access</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="text-center">
                          No calling access entries found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </Col>
          </div>
        );

      case 6:
        return (
          <div className="row">
            <Col md={12}>
              <div className="form-group mb-3">
                <label>Additional Information</label>
                <textarea 
                  className="form-control" 
                  rows={5}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Enter any additional information about this customer profiling..."
                />
              </div>
            </Col>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Create Customer Profiling"
        mainLink="/tms/profiling/create/wizard"
        subTitle="Customer Profiling Wizard"
      />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
              Create Customer Profiling
            </h2>
            <Link className="btn btn-sm btn-outline-primary ms-2" href="/tms/profiling/customers/create/simple">Simple Page</Link>
          </div>
        </Col>
      </Row>

      <Row className="profiling-create-form">
        <Col md={12}>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}</h4>
            </div>
            <div className="card-body">
              {renderStepIndicator()}
              {renderStepContent()}
            </div>
          </div>
        </Col>
      </Row>

      <Row className="profiling-create-form">
        <Col md={12}>
          <div className="d-flex justify-content-between gap-2 mb-5">
            <Button 
              variant="secondary" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="d-flex gap-2">
              {currentStep < totalSteps ? (
                <Button 
                  variant="primary" 
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  variant="success" 
                  onClick={handleSubmit}
                >
                  Create Profiling
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};

CustomerProfilingWizard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerProfilingWizard;
