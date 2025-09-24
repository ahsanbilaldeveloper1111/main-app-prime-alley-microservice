import React, { ReactElement, useState, useCallback, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Card, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import {
  getCompany,
  createUpdateProfile,
  createUpdateCallingAccess,
  deleteCallingAccess,
  getAvailableExtensions,
  generateFacCode,
  CompanyData,
} from "@utils/accounting";

interface CompanyProfileProps {}

const CompanyProfile: React.FC<CompanyProfileProps> = () => {
  const router = useRouter();
  const { id } = router.query;
  const companyId = parseInt(id as string, 10);

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [availableExtensions, setAvailableExtensions] = useState<number[]>([]);

  // Profile form data
  const [profileData, setProfileData] = useState({
    currency: "USD",
    address: "",
    vat_rate: 0,
    vat_exemption: false,
    tax_id: "",
    discount_type: "flat_percentage" as "flat_percentage" | "flat_amount",
    discount_limit: 0,
    payment_mode: "one_time" as "one_time" | "recurring" | "subscription",
    credit_limit: 0,
    early_payment_discount: 0,
    late_fee_rule: 0,
    payment_terms: 30,
    outstanding_invoices: 0,
    discounts_applied_ytd: 0,
    vat_collected: 0,
    active_subscriptions: 0,
    last_refund_date: "",
    profile_status: "incomplete" as "incomplete" | "complete" | "pending_verification",
  });

  // Calling access form data
  const [callingAccessData, setCallingAccessData] = useState({
    company_id: companyId,
    extension_ranges: [{ start: 0, end: 0 }],
    recording_profile: "",
    recording_profile_mobile: "",
    app_user: "",
    user_id_prefix: "",
    device_pool: "",
    allow_gsm: 1,
    device_pool_mobile: "",
    fac_info: "",
    mobile_user: "No" as "Yes" | "No",
    sim_ports: [] as string[],
    directory_name: "",
    fac_code: 0,
    max_users: null as number | null,
    organizational_unit: "",
  });

  // Load company data
  const loadCompany = useCallback(async () => {
    if (!companyId || isNaN(companyId)) return;

    setIsLoading(true);
    try {
      const companyData = await getCompany(companyId);
      setCompany(companyData);
      
      // Set profile data if available
      if (companyData.profile) {
        setProfileData({
          currency: companyData.profile.currency || "USD",
          address: companyData.profile.address || "",
          vat_rate: companyData.profile.vat_rate || 0,
          vat_exemption: companyData.profile.vat_exemption || false,
          tax_id: companyData.profile.tax_id || "",
          discount_type: companyData.profile.discount_type || "flat_percentage",
          discount_limit: companyData.profile.discount_limit || 0,
          payment_mode: companyData.profile.payment_mode || "one_time",
          credit_limit: companyData.profile.credit_limit || 0,
          early_payment_discount: companyData.profile.early_payment_discount || 0,
          late_fee_rule: companyData.profile.late_fee_rule || 0,
          payment_terms: companyData.profile.payment_terms || 30,
          outstanding_invoices: companyData.profile.outstanding_invoices || 0,
          discounts_applied_ytd: companyData.profile.discounts_applied_ytd || 0,
          vat_collected: companyData.profile.vat_collected || 0,
          active_subscriptions: companyData.profile.active_subscriptions || 0,
          last_refund_date: companyData.profile.last_refund_date || "",
          profile_status: companyData.profile.profile_status || "incomplete",
        });
      }

      // Load available extensions
      const extensions = await getAvailableExtensions(companyId);
      setAvailableExtensions(extensions);
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error("Failed to load company data");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  // Handle profile form changes
  const handleProfileChange = useCallback((field: string, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle calling access form changes
  const handleCallingAccessChange = useCallback((field: string, value: any) => {
    setCallingAccessData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle extension range changes
  const handleExtensionRangeChange = useCallback((index: number, field: string, value: number) => {
    setCallingAccessData((prev) => ({
      ...prev,
      extension_ranges: prev.extension_ranges.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      ),
    }));
  }, []);

  // Add new extension range
  const addExtensionRange = useCallback(() => {
    setCallingAccessData((prev) => ({
      ...prev,
      extension_ranges: [...prev.extension_ranges, { start: 0, end: 0 }],
    }));
  }, []);

  // Remove extension range
  const removeExtensionRange = useCallback((index: number) => {
    setCallingAccessData((prev) => ({
      ...prev,
      extension_ranges: prev.extension_ranges.filter((_, i) => i !== index),
    }));
  }, []);

  // Save profile
  const handleSaveProfile = useCallback(async () => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      await createUpdateProfile({
        company_id: companyId,
        ...profileData,
      });
      toast.success("Profile updated successfully");
      loadCompany(); // Reload data
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }, [companyId, profileData, loadCompany]);

  // Save calling access
  const handleSaveCallingAccess = useCallback(async () => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      await createUpdateCallingAccess({
        ...callingAccessData,
        company_id: companyId,
      });
      toast.success("Calling access updated successfully");
      loadCompany(); // Reload data
    } catch (error) {
      console.error("Error saving calling access:", error);
      toast.error("Failed to save calling access");
    } finally {
      setIsSaving(false);
    }
  }, [companyId, callingAccessData, loadCompany]);

  // Generate FAC code
  const handleGenerateFacCode = useCallback(async () => {
    if (!companyId) return;

    try {
      const facCode = await generateFacCode({ company_id: companyId });
      handleCallingAccessChange("fac_code", facCode);
      toast.success("FAC code generated successfully");
    } catch (error) {
      console.error("Error generating FAC code:", error);
      toast.error("Failed to generate FAC code");
    }
  }, [companyId, handleCallingAccessChange]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <Alert variant="danger">
        <h4>Company Not Found</h4>
        <p>The requested company could not be found.</p>
        <Button variant="primary" onClick={() => router.back()}>
          Go Back
        </Button>
      </Alert>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Accounting"
        mainLink="/accounting/companies"
        subTitle={`${company.name} - Profile`}
      />

      <Row className="mb-4">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">
              {company.name} - Company Profile
            </h2>
            <p className="text-muted">Manage company profile and calling access settings</p>
          </div>
        </Col>
      </Row>

      {/* Company Profile Section */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="card-title mb-0">Company Profile</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  value={profileData.currency}
                  onChange={(e) => handleProfileChange("currency", e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>VAT Rate (%)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={profileData.vat_rate}
                  onChange={(e) => handleProfileChange("vat_rate", parseFloat(e.target.value) || 0)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={profileData.address}
                  onChange={(e) => handleProfileChange("address", e.target.value)}
                  placeholder="Enter company address"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tax ID</Form.Label>
                <Form.Control
                  type="text"
                  value={profileData.tax_id}
                  onChange={(e) => handleProfileChange("tax_id", e.target.value)}
                  placeholder="Enter tax ID"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Discount Type</Form.Label>
                <Form.Select
                  value={profileData.discount_type}
                  onChange={(e) => handleProfileChange("discount_type", e.target.value)}
                >
                  <option value="flat_percentage">Flat Percentage</option>
                  <option value="flat_amount">Flat Amount</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Credit Limit</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={profileData.credit_limit}
                  onChange={(e) => handleProfileChange("credit_limit", parseFloat(e.target.value) || 0)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Terms (Days)</Form.Label>
                <Form.Control
                  type="number"
                  value={profileData.payment_terms}
                  onChange={(e) => handleProfileChange("payment_terms", parseInt(e.target.value) || 30)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="VAT Exemption"
                  checked={profileData.vat_exemption}
                  onChange={(e) => handleProfileChange("vat_exemption", e.target.checked)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Profile Status</Form.Label>
                <Form.Select
                  value={profileData.profile_status}
                  onChange={(e) => handleProfileChange("profile_status", e.target.value)}
                >
                  <option value="incomplete">Incomplete</option>
                  <option value="complete">Complete</option>
                  <option value="pending_verification">Pending Verification</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Calling Access Section */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="card-title mb-0">Calling Access Configuration</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Directory Name</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.directory_name}
                  onChange={(e) => handleCallingAccessChange("directory_name", e.target.value)}
                  placeholder="Enter directory name"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>User ID Prefix</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.user_id_prefix}
                  onChange={(e) => handleCallingAccessChange("user_id_prefix", e.target.value)}
                  placeholder="Enter user ID prefix"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Device Pool</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.device_pool}
                  onChange={(e) => handleCallingAccessChange("device_pool", e.target.value)}
                  placeholder="Enter device pool"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>App User</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.app_user}
                  onChange={(e) => handleCallingAccessChange("app_user", e.target.value)}
                  placeholder="Enter app user"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Recording Profile</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.recording_profile}
                  onChange={(e) => handleCallingAccessChange("recording_profile", e.target.value)}
                  placeholder="Enter recording profile"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mobile Recording Profile</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.recording_profile_mobile}
                  onChange={(e) => handleCallingAccessChange("recording_profile_mobile", e.target.value)}
                  placeholder="Enter mobile recording profile"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>FAC Code</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="number"
                    value={callingAccessData.fac_code}
                    onChange={(e) => handleCallingAccessChange("fac_code", parseInt(e.target.value) || 0)}
                    placeholder="Enter FAC code"
                    readOnly
                  />
                  <Button
                    variant="outline-primary"
                    className="ms-2"
                    onClick={handleGenerateFacCode}
                  >
                    Generate
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Max Users</Form.Label>
                <Form.Control
                  type="number"
                  value={callingAccessData.max_users || ""}
                  onChange={(e) => handleCallingAccessChange("max_users", parseInt(e.target.value) || null)}
                  placeholder="Enter max users"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Organizational Unit</Form.Label>
                <Form.Control
                  type="text"
                  value={callingAccessData.organizational_unit}
                  onChange={(e) => handleCallingAccessChange("organizational_unit", e.target.value)}
                  placeholder="Enter organizational unit"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mobile User</Form.Label>
                <Form.Select
                  value={callingAccessData.mobile_user}
                  onChange={(e) => handleCallingAccessChange("mobile_user", e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Allow GSM"
                  checked={callingAccessData.allow_gsm === 1}
                  onChange={(e) => handleCallingAccessChange("allow_gsm", e.target.checked ? 1 : 0)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Extension Ranges */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Extension Ranges</Form.Label>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addExtensionRange}
              >
                Add Range
              </Button>
            </div>
            {callingAccessData.extension_ranges.map((range, index) => (
              <Row key={index} className="mb-2">
                <Col md={4}>
                  <Form.Control
                    type="number"
                    placeholder="Start"
                    value={range.start}
                    onChange={(e) => handleExtensionRangeChange(index, "start", parseInt(e.target.value) || 0)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="number"
                    placeholder="End"
                    value={range.end}
                    onChange={(e) => handleExtensionRangeChange(index, "end", parseInt(e.target.value) || 0)}
                  />
                </Col>
                <Col md={4}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeExtensionRange(index)}
                    disabled={callingAccessData.extension_ranges.length === 1}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
          </div>

          <div className="d-flex justify-content-end">
            <Button
              variant="primary"
              onClick={handleSaveCallingAccess}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Calling Access"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

CompanyProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyProfile;
