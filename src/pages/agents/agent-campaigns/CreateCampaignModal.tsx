import React, { useState, useEffect, useCallback } from "react";
import { Modal, Row, Col, Button } from "react-bootstrap";
import { CreateCampaign, ListVoiceBots } from "@utils/aiml";
import { toast } from "react-toastify";
import parsePhoneNumber from "libphonenumber-js";
import { Upload } from "lucide-react";

interface CampaignData {
  campaignName: string;
  description: string;
  context: string;
  botProfile: string;
  clientId: string;
  dialerStrategy: string;
  transferCallsTo: string;
  transferFallbackTo: string;
  retries: number;
  dncCompliance: boolean;
  owner: string;
  clientWorkspace: string;
  scheduleStart: string;
  scheduleEnd: string;
  timezone: string;
  concurrency: number;
  recordingConsent: boolean;
  dncrCheck: boolean;
}

export interface CreateCampaignModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const defaultFormData: CampaignData = {
  campaignName: "",
  description: "",
  context: "",
  botProfile: "",
  clientId: "",
  dialerStrategy: "Progressive Dialing",
  transferCallsTo: "",
  transferFallbackTo: "",
  retries: 15,
  dncCompliance: true,
  owner: "",
  clientWorkspace: "",
  scheduleStart: "",
  scheduleEnd: "",
  timezone: "Pacific Time (GMT-7)",
  concurrency: 10,
  recordingConsent: true,
  dncrCheck: true,
};

const isValidE164 = (phoneNumber: string): boolean => {
  try {
    const cleaned = phoneNumber.trim().replace(/\s+/g, "");
    if (!cleaned.startsWith("+")) return false;
    const parsed = parsePhoneNumber(cleaned);
    return parsed?.isValid() ?? false;
  } catch {
    return false;
  }
};

const isMobileNumber = (phoneNumber: string): boolean => {
  try {
    const cleaned = phoneNumber.trim().replace(/\s+/g, "");
    const parsed = parsePhoneNumber(cleaned);
    if (parsed?.isValid()) {
      const numberType = parsed.getType();
      return numberType === "MOBILE" || numberType === "FIXED_LINE_OR_MOBILE";
    }
    return false;
  } catch {
    return false;
  }
};

const CreateCampaignModal = (props: CreateCampaignModalProps) => {
  const { show, onHide, onSuccess } = props;

  const [formData, setFormData] = useState<CampaignData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceBots, setVoiceBots] = useState<any[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);
  const [uploadedContacts, setUploadedContacts] = useState(0);
  const [validContacts, setValidContacts] = useState(0);
  const [mobileContacts, setMobileContacts] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualNumbers, setManualNumbers] = useState("");

  const handleInputChange = (field: keyof CampaignData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchVoiceBots = useCallback(async () => {
    setIsLoadingBots(true);
    try {
      const response = await ListVoiceBots();
      const botsData = response?.results?.data || response?.bots || response?.data || [];
      setVoiceBots(botsData);
      if (botsData.length > 0) {
        setFormData((prev) => (prev.botProfile ? prev : { ...prev, botProfile: String(botsData[0].id) }));
      }
    } catch (error) {
      console.error("Error fetching voice bots:", error);
    } finally {
      setIsLoadingBots(false);
    }
  }, []);

  useEffect(() => {
    if (show) fetchVoiceBots();
  }, [show, fetchVoiceBots]);

  useEffect(() => {
    if (manualNumbers.trim()) {
      const numbers = manualNumbers
        .split(/[,\n]/)
        .map((num) => num.trim())
        .filter((num) => num.length > 0);
      const totalCount = numbers.length;
      const validNumbers = numbers.filter(isValidE164);
      setUploadedContacts(totalCount);
      setValidContacts(validNumbers.length);
      setMobileContacts(validNumbers.filter(isMobileNumber).length);
    } else {
      setUploadedContacts(0);
      setValidContacts(0);
      setMobileContacts(0);
    }
  }, [manualNumbers]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFile(file);
      try {
        const text = await file.text();
        const numbers: string[] = [];
        const lines = text.split(/\r?\n/);
        lines.forEach((line) => {
          const values = line.split(",").map((val) => val.trim()).filter((val) => val.length > 0);
          numbers.push(...values);
        });
        const uniqueNumbers = Array.from(new Set(numbers.filter((num) => num.length > 0)));
        const validNumbers = uniqueNumbers.filter(isValidE164);
        setUploadedContacts(uniqueNumbers.length);
        setValidContacts(validNumbers.length);
        setMobileContacts(validNumbers.filter(isMobileNumber).length);
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Error reading file. Please check the file format.");
        setUploadedContacts(0);
        setValidContacts(0);
        setMobileContacts(0);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }
    if (!formData.botProfile) {
      toast.error("Please select a bot profile");
      return;
    }
    if (!uploadedFile && !manualNumbers && uploadedContacts === 0) {
      toast.error("Please upload a contacts file or enter phone numbers");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        voice_bot_id: Number.parseInt(formData.botProfile, 10),
        name: formData.campaignName,
        description: formData.description || "",
        context: formData.context || "",
        status: "active",
      };
      if (formData.clientId) payload.client_id = formData.clientId;
      if (formData.timezone) payload.timezone = formData.timezone;

      if (uploadedFile) {
        payload.numbers_file = uploadedFile;
        await CreateCampaign(payload, true);
      } else if (manualNumbers) {
        payload.numbers_to_call = manualNumbers;
        await CreateCampaign(payload, false);
      } else {
        toast.error("Please provide phone numbers");
        return;
      }
      onSuccess();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setUploadedFileName("");
    setUploadedFile(null);
    setManualNumbers("");
    setUploadedContacts(0);
    setValidContacts(0);
    setMobileContacts(0);
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  const hasRequiredFields =
    !!formData.campaignName?.trim() &&
    !!formData.botProfile &&
    !!formData.description?.trim() &&
    !!formData.context?.trim();
  const hasContactInput = !!uploadedFile || !!manualNumbers.trim();
  const hasValidNumbers = validContacts > 0;
  const isSubmitDisabled =
    !hasRequiredFields || !hasContactInput || !hasValidNumbers || isSubmitting;

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered scrollable >
      <Modal.Header closeButton>
        <Modal.Title>Create Campaign</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "85vh", overflowY: "auto" }}>
        {show && (
          <div style={{ backgroundColor: "white", padding: "0.5rem 0" }}>
            <Row>
              <Col md={6}>
                <div className="form-group mb-3">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#495057" }}>
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={formData.campaignName}
                    onChange={(e) => handleInputChange("campaignName", e.target.value)}
                    placeholder="Enter campaign name"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ced4da",
                      borderRadius: "6px",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="form-group mb-3">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#495057" }}>
                    Bot Profile
                  </label>
                  <select
                    value={formData.botProfile}
                    onChange={(e) => handleInputChange("botProfile", e.target.value)}
                    disabled={isLoadingBots}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ced4da",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      backgroundColor: isLoadingBots ? "#e9ecef" : "white",
                    }}
                  >
                    <option value="">Select Bot Profile</option>
                    {voiceBots.map((bot) => (
                      <option key={bot.id} value={bot.id}>
                        {bot.bot_name || bot.name || "Unnamed Bot"}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={12}>
                <div className="form-group mb-3">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#495057" }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter campaign description"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ced4da",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="form-group mb-3">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#495057" }}>
                    Context
                  </label>
                  <textarea
                    value={formData.context}
                    onChange={(e) => handleInputChange("context", e.target.value)}
                    placeholder="Enter campaign context"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ced4da",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="form-group mb-3">
                  <h4 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "#1f2937" }}>
                    Upload Contacts
                  </h4>
                  <input
                    type="file"
                    id="contactFileUploadModal"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="contactFileUploadModal"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "1.5rem",
                      border: "2px dashed #ced4da",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                      <Upload size={32} color="#6c757d" />
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                      {uploadedFileName || "Upload CSV/Excel"}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>Drag & drop or click to browse</div>
                  </label>
                  <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#495057" }}>
                      Or Enter Phone Numbers (comma-separated)
                    </label>
                    <textarea
                      value={manualNumbers}
                      onChange={(e) => setManualNumbers(e.target.value)}
                      placeholder="+1234567890,+0987654321"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ced4da",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                  </div>
                  {(uploadedContacts > 0 || validContacts > 0) && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", color: "#6c757d" }}>Total Contacts</span>
                        <span style={{ fontSize: "1rem", fontWeight: "600", color: "#1f2937" }}>
                          {uploadedContacts.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.875rem", color: "#6c757d" }}>Valid Numbers (E.164)</span>
                        <span style={{ fontSize: "1rem", fontWeight: "600", color: "#059669" }}>
                          {validContacts.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Col>
              
            </Row>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitDisabled}>
          {isSubmitting ? "Creating..." : "Create Campaign"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateCampaignModal;
