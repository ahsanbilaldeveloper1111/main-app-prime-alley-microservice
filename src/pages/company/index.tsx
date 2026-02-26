import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { useSession } from "next-auth/react";
import axiosInstance from "@utils/axios";
import { getCurrentUserCompanyImage } from "@utils/company";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import ThemeSelect from "@components/ThemeSelect";

interface CompanyOption {
  id?: string;
  uuid?: string;
  name?: string;
  [key: string]: unknown;
}

const PREFIX = "/users/companies";

async function getCompanies(): Promise<CompanyOption[]> {
  const { data } = await axiosInstance.get<{ success?: boolean; data?: CompanyOption[] }>('users/getCompanies');
  const body = data?.data ?? data;
  return Array.isArray(body) ? body : [];
}

async function postCompanyImage(image: File, companyId?: string): Promise<unknown> {
  const form = new FormData();
  form.append("image", image);
  if (companyId) form.append("company_id", companyId);
  const { data } = await axiosInstance.post<{ success?: boolean; data?: unknown }>(`${PREFIX}/image`, form);
  return (data as { data?: unknown })?.data ?? data;
}

async function getCompanyImage(companyId: string): Promise<Blob | null> {
  try {
    const { data } = await axiosInstance.get<Blob>(`${PREFIX}/image`, {
      params: { company_id: companyId },
      responseType: "blob",
    });
    return data;
  } catch {
    return null;
  }
}

async function deleteCompanyImage(companyId: string): Promise<void> {
  await axiosInstance.delete(`${PREFIX}/image`, { params: { company_id: companyId } });
}

const CompanyData = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user && (Number((session.user as { is_admin?: number | string }).is_admin) === 1 || String((session.user as { is_admin?: number | string }).is_admin) === "1");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [companyImages, setCompanyImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [currentUserCompanyImageUrl, setCurrentUserCompanyImageUrl] = useState<string | null>(null);
  const [loadingCurrentUserImage, setLoadingCurrentUserImage] = useState(true);
  const currentUserImageUrlRef = useRef<string | null>(null);

  const getCompanyId = (c: CompanyOption) => String(c?.uuid ?? c?.id ?? "");
  const getCompanyName = (c: CompanyOption) => String(c?.name ?? "—");

  const loadImageForCompany = useCallback(async (cid: string) => {
    if (!cid) return;
    setLoadingImages((prev) => ({ ...prev, [cid]: true }));
    try {
      const blob = await getCompanyImage(cid);
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        setCompanyImages((prev) => {
          const old = prev[cid];
          if (old) URL.revokeObjectURL(old);
          return { ...prev, [cid]: url };
        });
      } else {
        setCompanyImages((prev) => {
          const old = prev[cid];
          if (old) URL.revokeObjectURL(old);
          const next = { ...prev };
          delete next[cid];
          return next;
        });
      }
    } catch {
      setCompanyImages((prev) => {
        const old = prev[cid];
        if (old) URL.revokeObjectURL(old);
        const next = { ...prev };
        delete next[cid];
        return next;
      });
    } finally {
      setLoadingImages((prev) => ({ ...prev, [cid]: false }));
    }
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
      if (data?.length && !selectedCompanyId)
        setSelectedCompanyId(String(data[0]?.uuid ?? data[0]?.id ?? ""));
    } catch (err: unknown) {
      setCompanies([]);
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to load companies";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadCompanies();
    else setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedCompanyId) {
      loadImageForCompany(selectedCompanyId);
    }
  }, [isAdmin, selectedCompanyId, loadImageForCompany]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCurrentUserImage(true);
    getCurrentUserCompanyImage()
      .then((blob) => {
        if (cancelled) return;
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          currentUserImageUrlRef.current = url;
          setCurrentUserCompanyImageUrl(url);
        } else {
          setCurrentUserCompanyImageUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentUserCompanyImageUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingCurrentUserImage(false);
      });
    return () => {
      cancelled = true;
      const url = currentUserImageUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        currentUserImageUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!companies.length) return;
    // companies.forEach((c) => {
    //   const id = getCompanyId(c);
    //   if (id) loadImageForCompany(id);
    // });
  }, [companies, loadImageForCompany]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    if (isAdmin && !selectedCompanyId?.trim()) return;
    setUploading(true);
    try {
      const companyId = isAdmin ? selectedCompanyId?.trim() : undefined;
      await postCompanyImage(imageFile, companyId);
      setImageFile(null);
      if (companyId) await loadImageForCompany(companyId);
      else {
        const blob = await getCurrentUserCompanyImage();
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          currentUserImageUrlRef.current && URL.revokeObjectURL(currentUserImageUrlRef.current);
          currentUserImageUrlRef.current = url;
          setCurrentUserCompanyImageUrl(url);
        }
      }
      toast.success("Image uploaded");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to upload image";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!companyId) return;
    try {
      await deleteCompanyImage(companyId);
      setCompanyImages((prev) => {
        const old = prev[companyId];
        if (old) URL.revokeObjectURL(old);
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
      toast.success("Image deleted");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to delete image";
      toast.error(msg);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  };

  const centerWrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
    padding: 24,
    margin: "0 auto",
    maxWidth: 480,
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Company Logo" />
      {/* <PageHeader title="Company Logo" showSearch={false} /> */}

      <div className="container-fluid" style={{ marginTop: 16 }}>
        {!isAdmin ? (
          /* Non-admin: single friendly card — current logo, then update section */
          <div style={centerWrapperStyle}>
            <div style={{ ...cardStyle, width: "100%", maxWidth: 420 }}>
              {/* Current logo */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                  Your company logo
                </h3>
                {loadingCurrentUserImage ? (
                  <div style={{ padding: "40px 24px", color: "#6b7280", fontSize: 14, textAlign: "center", backgroundColor: "#f9fafb", borderRadius: 12 }}>
                    Loading your logo…
                  </div>
                ) : currentUserCompanyImageUrl ? (
                  <div style={{ padding: 20, backgroundColor: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
                    <img
                      src={currentUserCompanyImageUrl}
                      alt="Company logo"
                      style={{
                        maxWidth: 200,
                        maxHeight: 100,
                        objectFit: "contain",
                        borderRadius: 8,
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: "24px 20px", color: "#6b7280", fontSize: 14, textAlign: "center", backgroundColor: "#f9fafb", borderRadius: 12, border: "1px dashed #d1d5db" }}>
                    No logo set yet. Upload one below to get started.
                  </div>
                )}
              </div>

              {/* Update logo */}
              <div style={{ paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                  Update your logo
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                  Choose an image from your device. We recommend a square or landscape image.
                </p>
                <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <label
                    htmlFor="company-image-file"
                    style={{
                      display: "block",
                      padding: "24px 20px",
                      border: "2px dashed #d1d5db",
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: "#fafafa",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.backgroundColor = "#f5f3ff";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.backgroundColor = "#fafafa";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <input
                      id="company-image-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      style={{ display: "none" }}
                    />
                    {imageFile ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#059669", marginBottom: 4 }}>
                          {imageFile.name}
                        </div>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>Click or drop another file to replace</span>
                      </>
                    ) : (
                      <>
                        <Upload size={40} style={{ color: "#9ca3af", margin: "0 auto 12px", display: "block" }} />
                        <div style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                          Click to upload or drag and drop
                        </div>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>PNG, JPG or GIF</span>
                      </>
                    )}
                  </label>
                  <button
                    type="submit"
                    disabled={uploading || !imageFile}
                    style={{
                      padding: "14px 24px",
                      border: "none",
                      borderRadius: 10,
                      backgroundColor: uploading || !imageFile ? "#e5e7eb" : "#6366f1",
                      color: uploading || !imageFile ? "#9ca3af" : "#fff",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: uploading || !imageFile ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "background-color 0.2s",
                    }}
                  >
                    <Upload size={18} />
                    {uploading ? "Uploading…" : "Upload logo"}
                  </button>
                  {!imageFile && (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, textAlign: "center" }}>
                      Select an image above to enable upload
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Admin: user-friendly upload form — select company, current logo, then upload */
          <div style={{ ...centerWrapperStyle, maxWidth: 520 }}>
            <div style={{ ...cardStyle, width: "100%" }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 24 }}>
                Upload company logo
              </h3>

              <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Select company (searchable) */}
                <div>
                  <label
                    htmlFor="company-select"
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Select company
                  </label>
                  <ThemeSelect
                    inputId="company-select"
                    placeholder="Search or choose a company…"
                    value={
                      selectedCompanyId
                        ? { value: selectedCompanyId, label: getCompanyName(companies.find((c) => getCompanyId(c) === selectedCompanyId) ?? {}) }
                        : null
                    }
                    onChange={(option: unknown) => setSelectedCompanyId((option as { value?: string } | null)?.value ?? "")}
                    options={companies.map((c) => ({ value: getCompanyId(c), label: getCompanyName(c) }))}
                    isDisabled={loading}
                    isSearchable
                    isClearable
                  />
                </div>

                {/* Current logo preview */}
                {selectedCompanyId && (
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>
                      Current logo {selectedCompanyId}
                    </span>
                    <div
                      style={{
                        padding: 20,
                        backgroundColor: "#f9fafb",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        minHeight: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {loadingImages[selectedCompanyId] ? (
                        <span style={{ fontSize: 14, color: "#6b7280" }}>Loading logo…</span>
                      ) : companyImages[selectedCompanyId] ? (
                        <img
                          src={companyImages[selectedCompanyId]}
                          alt="Company logo"
                          style={{
                            maxWidth: 180,
                            maxHeight: 90,
                            objectFit: "contain",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 14, color: "#9ca3af" }}>No logo set for this company</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload new image */}
                <div style={{ paddingTop: selectedCompanyId ? 8 : 0, borderTop: selectedCompanyId ? "1px solid #e5e7eb" : "none", marginTop: selectedCompanyId ? 8 : 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#374151", display: "block", marginBottom: 8 }}>
                    Upload new logo
                  </span>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, marginTop: 0 }}>
                    Choose an image from your device. It will replace the current logo for the selected company.
                  </p>
                  <label
                    htmlFor="company-image-file-admin"
                    style={{
                      display: "block",
                      padding: "24px 20px",
                      border: "2px dashed #d1d5db",
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: "#fafafa",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.backgroundColor = "#f5f3ff";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.backgroundColor = "#fafafa";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <input
                      id="company-image-file-admin"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      style={{ display: "none" }}
                    />
                    {imageFile ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#059669", marginBottom: 4 }}>
                          {imageFile.name}
                        </div>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>Click or drop another file to replace</span>
                      </>
                    ) : (
                      <>
                        <Upload size={40} style={{ color: "#9ca3af", margin: "0 auto 12px", display: "block" }} />
                        <div style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                          Click to upload or drag and drop
                        </div>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>PNG, JPG or GIF</span>
                      </>
                    )}
                  </label>
                  <button
                    type="submit"
                    disabled={uploading || !imageFile || !selectedCompanyId}
                    style={{
                      marginTop: 16,
                      padding: "14px 24px",
                      border: "none",
                      borderRadius: 10,
                      backgroundColor: uploading || !imageFile || !selectedCompanyId ? "#e5e7eb" : "#6366f1",
                      color: uploading || !imageFile || !selectedCompanyId ? "#9ca3af" : "#fff",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: uploading || !imageFile || !selectedCompanyId ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background-color 0.2s",
                    }}
                  >
                    <Upload size={18} />
                    {uploading ? "Uploading…" : "Upload logo"}
                  </button>
                  {(!selectedCompanyId || !imageFile) && (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 0", padding: 0 }}>
                      {!selectedCompanyId ? "Select a company above, then choose an image." : "Select an image above to enable upload."}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

CompanyData.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyData;
