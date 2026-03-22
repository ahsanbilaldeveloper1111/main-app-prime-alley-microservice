import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, DragEvent, ChangeEvent, KeyboardEvent, useCallback, useMemo, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from 'react-toastify';
import GenericTable, { TableColumn } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { CheckNumber, BulkCheckNumber,CheckNumbers } from '@utils/dncr';
import { Edit3, Upload, HelpCircle, Download, X } from 'lucide-react';
import { Modal } from 'react-bootstrap';

interface PhoneResult {
  input: string;
  normalized?: string;
  status?: string;
  carrier?: string;
  country?: string;
  notes?: string;
  accountNumber?: string;
  dncrStatus?: string;
  transactionStatus?: string;
  details?: Record<string, unknown>;
}

interface NumberCheckTableRow {
  id: string;
  calledNumber: string;
  status: string;
  dncrStatus?: string;
}

interface ApiResultDetails {
  accountNumber?: string;
  dncrStatus?: string;
  transactionStatus?: string | null;
}

interface ApiResultItem {
  status?: string;
  message?: string;
  number?: string;
  details?: ApiResultDetails;
}

interface BatchApiResponse {
  results?: Record<string, ApiResultItem>;
}

const MAX_MANUAL_NUMBERS = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeDigits(value: string): string {
  return value.replaceAll(/\D/g, "");
}

function parsePhoneNumbers(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
    .slice(0, MAX_MANUAL_NUMBERS);
}

function isValidPhoneNumber(phoneNumber: string): boolean {
  const digitsOnly = normalizeDigits(phoneNumber);
  return digitsOnly.startsWith("05") && digitsOnly.length === 10;
}

function getStatusCategory(status: string | null | undefined, dncrStatus: string | null | undefined): "invalid" | "denied" | "permitted" {
  const normalizedStatus = status?.toUpperCase();
  const normalizedDncrStatus = dncrStatus?.toUpperCase();
  const isDncrStatusEmpty = !dncrStatus;

  if (normalizedStatus === "INVALID" && isDncrStatusEmpty) return "invalid";
  if (normalizedStatus === "TRUE" && normalizedDncrStatus === "TRUE") return "denied";
  if (normalizedStatus === "FALSE" && normalizedDncrStatus === "FALSE") return "permitted";
  if (normalizedDncrStatus === "TRUE" || dncrStatus === "Denied") return "denied";
  if (normalizedDncrStatus === "FALSE" || dncrStatus === "Permitted") return "permitted";
  return "permitted";
}

function getStatusLabel(status: string | null | undefined, dncrStatus: string | null | undefined): string {
  const category = getStatusCategory(status, dncrStatus);
  if (category === "invalid") return "Invalid";
  if (category === "denied") return "Denied";
  return "Permitted";
}

function createErrorResult(phoneNumber: string, notes: string): PhoneResult {
  return {
    input: phoneNumber,
    normalized: phoneNumber,
    status: "Error",
    notes,
  };
}

function transformCheckResult(phoneNumber: string, response: unknown): PhoneResult {
  if (!response || response === false) {
    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status: "Invalid",
      notes: "No results found",
    };
  }

  if (Array.isArray(response)) {
    if (response.length > 0) return transformCheckResult(phoneNumber, response[0]);
    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status: "Invalid",
      notes: "No results found",
    };
  }

  if (typeof response === "object") {
    const resultObj = response as ApiResultItem;
    const details = resultObj.details ?? {};
    const transactionStatus =
      details.transactionStatus !== null && details.transactionStatus !== undefined
        ? String(details.transactionStatus)
        : "N/A";
    const status = resultObj.status;
    const notes =
      resultObj.message ||
      (status === "TRUE" || status === "VALID" ? "Registered" : "Not Registered");

    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status,
      accountNumber: details.accountNumber || resultObj.number || phoneNumber,
      dncrStatus: details.dncrStatus,
      transactionStatus,
      notes,
    };
  }

  return {
    input: phoneNumber,
    normalized: phoneNumber,
    status: "Invalid",
    notes: "No results found",
  };
}

async function runManualNumberCheck(
  manualInput: string,
  checkSingleNumber: (phoneNumber: string) => Promise<PhoneResult>,
): Promise<PhoneResult[] | null> {
  if (!manualInput.trim()) {
    toast.error('Please enter at least one phone number');
    return null;
  }

  const phoneNumbers = parsePhoneNumbers(manualInput);
  if (phoneNumbers.length === 0) {
    toast.error('Please enter valid phone numbers');
    return null;
  }

  if (phoneNumbers.length > MAX_MANUAL_NUMBERS) {
    toast.error('Maximum 10 numbers allowed');
    return null;
  }

  const invalidNumbers = phoneNumbers.filter((phoneNumber) => !isValidPhoneNumber(phoneNumber));
  if (invalidNumbers.length > 0) {
    toast.error(`Invalid phone numbers: ${invalidNumbers.join(', ')}. Numbers must start with "05" and be exactly 10 digits.`);
    return null;
  }

  if (phoneNumbers.length === 1) {
    const result = await checkSingleNumber(phoneNumbers[0]);
    return [result];
  }

  const apiResponse = await CheckNumbers(phoneNumbers);
  if (!apiResponse || apiResponse === false) {
    return phoneNumbers.map((phoneNumber) => createErrorResult(phoneNumber, "API request failed"));
  }

  const responseObj = apiResponse as BatchApiResponse;
  if (!responseObj.results || typeof responseObj.results !== "object") {
    return phoneNumbers.map((phoneNumber) => createErrorResult(phoneNumber, "Unexpected response format"));
  }

  return phoneNumbers.map((phoneNumber) => {
    const result = responseObj.results?.[phoneNumber];
    return result ? transformCheckResult(phoneNumber, result) : createErrorResult(phoneNumber, "No result found for this number");
  });
}

const styles: { [key: string]: React.CSSProperties } = {
      container: {
        backgroundColor: '#f8f9fa',
        
      },
      wrapper: {
        maxWidth: '1400px',
        margin: '0 auto'
      },
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      },
      title: {
        color: '#212529',
        fontSize: '28px',
        fontWeight: '500',
        margin: 0
      },
      formatGuide: {
        color: '#4a9eff',
        textDecoration: 'none',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center'
      },
      card: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        marginBottom: '24px',
        overflow: 'hidden',
        border: '1px solid #dee2e6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      },
      cardHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: '#f8f9fa'
      },
      sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        color: '#212529',
        fontSize: '16px',
        fontWeight: '500'
      },
      iconBadge: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        backgroundColor: '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px'
      },
      resultStats: {
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
        color: '#6c757d',
        flexWrap: 'wrap'
      },
      statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      },
      cardBody: {
        padding: '24px'
      },
      tabsContainer: {
        marginBottom: '20px'
      },
      tabs: {
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #dee2e6'
      },
      tab: {
        padding: '12px 20px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#6c757d',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
      },
      tabActive: {
        padding: '12px 20px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#4a9eff',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #4a9eff',
        fontWeight: '500'
      },
      tabContent: {
        marginTop: '20px'
      },
      manualTab: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      },
      textarea: {
        width: '100%',
        minHeight: '120px',
        padding: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        color: '#212529',
        fontSize: '14px',
        resize: 'vertical',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
      },
      manualFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      },
      hint: {
        fontSize: '13px',
        color: '#6c757d'
      },
      manualButtons: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      },
      btnPrimary: {
        padding: '8px 20px',
        backgroundColor: '#4a9eff',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      },
      btnSecondary: {
        padding: '8px 20px',
        backgroundColor: 'transparent',
        color: '#6c757d',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      csvTab: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      },
      dropzone: {
        border: '2px dashed #dee2e6',
        borderRadius: '8px',
        padding: '48px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
        transition: 'border-color 0.2s'
      },
      dropzoneText: {
        color: '#6c757d',
        fontSize: '14px',
        marginBottom: '12px'
      },
      fileInput: {
        display: 'none'
      },
      browseLabel: {
        color: '#4a9eff',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'underline'
      },
      csvInfo: {
        display: 'flex',
        gap: '16px',
        fontSize: '13px',
        flexWrap: 'wrap'
      },
      link: {
        color: '#4a9eff',
        textDecoration: 'none'
      },
      statusBar: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1px solid #dee2e6'
      },
      statusLeft: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      },
      statusBadgeSuccess: {
        padding: '6px 12px',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '6px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid #c3e6cb'
      },
      statusBadgeDisabled: {
        padding: '6px 12px',
        backgroundColor: '#e9ecef',
        color: '#6c757d',
        borderRadius: '6px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid #dee2e6'
      },
      statusBadgeError: {
        padding: '6px 12px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '6px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid #dee2e6'
      },
      statusRight: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      },
      btnPrimaryLarge: {
        padding: '10px 24px',
        backgroundColor: '#4a9eff',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      },
      btnOutline: {
        padding: '10px 24px',
        backgroundColor: 'transparent',
        color: '#6c757d',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      tableWrapper: {
        overflowX: 'auto',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #dee2e6'
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse'
      },
      thead: {
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #dee2e6'
      },
      th: {
        padding: '14px 16px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: '600',
        color: '#495057',
        whiteSpace: 'nowrap'
      },
      tr: {
        borderBottom: '1px solid #dee2e6',
        transition: 'background-color 0.2s'
      },
      td: {
        padding: '14px 16px',
        fontSize: '14px',
        color: '#212529',
        whiteSpace: 'nowrap'
      },
      badgeValid: {
        padding: '4px 12px',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        border: '1px solid #c3e6cb'
      },
      downloadButton: {
        padding: '6px 12px',
        backgroundColor: 'transparent',
        color: '#6c757d',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
      }
    };
    
const APINumberCheck = () => { // NOSONAR - legacy page kept readable via extracted helpers
      const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
      const [manualInput, setManualInput] = useState<string>('');
      const [csvFile, setCsvFile] = useState<File | null>(null);
      const [results, setResults] = useState<PhoneResult[]>([]);
      const [isChecking, setIsChecking] = useState<boolean>(false);
      const [isUploading, setIsUploading] = useState<boolean>(false);
      const [bulkResults, setBulkResults] = useState<Record<string, ApiResultItem> | null>(null);
      const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
      const csvInputRef = useRef<HTMLInputElement | null>(null);

      // Check if all parsed phone numbers are valid
      const isManualInputValid = useMemo(() => {
        if (!manualInput.trim()) {
          return false;
        }
        const phoneNumbers = parsePhoneNumbers(manualInput);
        if (phoneNumbers.length === 0) {
          return false;
        }
        // Check if all numbers are valid
        return phoneNumbers.every(phoneNumber => isValidPhoneNumber(phoneNumber));
      }, [manualInput]);

      // Calculate valid and invalid numbers count for manual input
      const { validCount, invalidCount } = useMemo(() => {
        if (!manualInput.trim()) {
          return { validCount: 0, invalidCount: 0 };
        }
        const phoneNumbers = parsePhoneNumbers(manualInput);
        let valid = 0;
        let invalid = 0;
        phoneNumbers.forEach(phoneNumber => {
          if (isValidPhoneNumber(phoneNumber)) {
            valid++;
          } else {
            invalid++;
          }
        });
        return { validCount: valid, invalidCount: invalid };
      }, [manualInput]);

      // Helper function to render status badge (reusable component)
      const renderStatusBadge = (status: string | null | undefined, dncrStatus: string | null | undefined): React.ReactElement => {
        const category = getStatusCategory(status, dncrStatus);
        const label = getStatusLabel(status, dncrStatus);
        
        if (category.toLowerCase() === 'invalid') {
          return (
            <span style={{
              ...styles.badgeValid,
              backgroundColor: '#c4c4c4',
              color: 'gray',
              borderColor: '#c4c4c4'
            }}>
              Invalid
            </span>
          );
        }
        
        return (
          <span style={{
            ...styles.badgeValid,
            backgroundColor: category === 'denied' ? '#f8d7da' : '#d4edda',
            color: category === 'denied' ? '#721c24' : '#155724',
            borderColor: category === 'denied' ? '#f5c6cb' : '#c3e6cb'
          }}>
            {label}
          </span>
        );
      };

      // Parse CSV file and calculate valid/invalid numbers
      const [csvValidCount, setCsvValidCount] = useState<number>(0);
      const [csvInvalidCount, setCsvInvalidCount] = useState<number>(0);

      // Read and validate CSV file when it's uploaded
      useEffect(() => {
        if (!csvFile) {
          setCsvValidCount(0);
          setCsvInvalidCount(0);
          return;
        }

        const validateCSV = async () => {
          try {
            const text = await csvFile.text();
            if (!text) {
              setCsvValidCount(0);
              setCsvInvalidCount(0);
              return;
            }

            // Parse CSV - split by newlines and get first column
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            let valid = 0;
            let invalid = 0;

            lines.forEach((line, index) => {
              // Skip header row if it doesn't look like a phone number
              if (index === 0) {
                const firstValue = line.split(',')[0]?.trim() || '';
                // If first line doesn't start with "05" or isn't 10 digits, it's likely a header
                const digitsOnly = normalizeDigits(firstValue);
                if (!digitsOnly.startsWith('05') || digitsOnly.length !== 10) {
                  return; // Skip header
                }
              }

              // Get first column value (phone number)
              const phoneNumber = line.split(',')[0]?.trim() || '';
              if (phoneNumber) {
                const digitsOnly = normalizeDigits(phoneNumber);
                if (digitsOnly.startsWith('05') && digitsOnly.length === 10) {
                  valid++;
                } else {
                  invalid++;
                }
              }
            });

            setCsvValidCount(valid);
            setCsvInvalidCount(invalid);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            setCsvValidCount(0);
            setCsvInvalidCount(0);
          }
        };

        validateCSV();
      }, [csvFile]);

      // Check a single phone number
      const checkSingleNumber = async (phoneNumber: string): Promise<PhoneResult> => {
        try {
          const response = await CheckNumber(phoneNumber);
          return transformCheckResult(phoneNumber, response);
        } catch (error) {
          console.error(`Error checking ${phoneNumber}:`, error);
          return createErrorResult(phoneNumber, "Check failed");
        }
      };

      // Handle manual number check
      const handleCheckNumbers = useCallback(async (): Promise<void> => {
        setIsChecking(true);
        setResults([]);
        setBulkResults(null);

        try {
          const nextResults = await runManualNumberCheck(manualInput, checkSingleNumber);
          if (nextResults) setResults(nextResults);
        } catch (error) {
          console.error('Error checking numbers:', error);
          toast.error('Error checking numbers');
        } finally {
          setIsChecking(false);
        }
      }, [manualInput]);

      const isAcceptableCsvFile = useCallback((file: File, invalidTypeMessage: string): boolean => {
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (fileExtension !== '.csv') {
          toast.error(invalidTypeMessage);
          return false;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error('File size must be less than 10MB');
          return false;
        }
        return true;
      }, []);

      // Handle CSV file upload
      const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!isAcceptableCsvFile(file, 'Please select a CSV file')) return;
        setCsvFile(file);
      };
    
      const handleDragOver = (e: DragEvent<HTMLButtonElement>): void => {
        e.preventDefault();
      };
    
      const handleDrop = (e: DragEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (!isAcceptableCsvFile(file, 'Please drop a CSV file')) return;
        setCsvFile(file);
        toast.success(`File "${file.name}" selected successfully`);
      };

      const handleDropzoneKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        csvInputRef.current?.click();
      };

      // Handle bulk CSV upload
      const handleBulkUpload = useCallback(async (): Promise<void> => {
        if (!csvFile) {
          toast.error('Please select a CSV file');
          return;
        }

        // Validate file
        if (!(csvFile instanceof File)) {
          toast.error('Invalid file object');
          return;
        }

        if (csvFile.size === 0) {
          toast.error('The selected file is empty');
          return;
        }

        if (!isAcceptableCsvFile(csvFile, 'Invalid file type. Please use CSV format')) {
          return;
        }

        setIsUploading(true);
        setBulkResults(null);
        setResults([]);

        try {
          const formData = new FormData();
          formData.append('sheet', csvFile);

          const response = await BulkCheckNumber(formData);
          
          if (response) {
            setBulkResults(response?.results);
            toast.success('Numbers checked successfully');
          } else {
            toast.error('Failed to check numbers');
          }
        } catch (error: unknown) {
          console.error('Bulk upload error:', error);
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const msg = err.response?.data?.message || err.message;
          toast.error(msg ? `Upload failed: ${msg}` : 'Error during bulk upload');
        } finally {
          setIsUploading(false);
        }
      }, [csvFile, isAcceptableCsvFile]);
    
      const clearManualInput = (): void => {
        setManualInput('');
        setResults([]);
        setBulkResults(null);
      };

      // Download sample CSV file
      const downloadSampleFile = (): void => {
        const sampleData = `PhoneNumber
0557044312
0556960535
0556930017
0557067850
0509380627
0551234567
0559876543`;
        
        const BOM = '\uFEFF';
        const csvContent = BOM + sampleData;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api_number_check_sample.csv';
        document.body.appendChild(a);
        a.click();
        globalThis.URL.revokeObjectURL(url);
        a.remove();
      };
    
      const handleDownloadResults = (): void => {
        if (results.length === 0 && !bulkResults) {
          toast.error('No results to download');
          return;
        }

        let csvContent = '';
        
        if (bulkResults) {
          // Download bulk results
          csvContent = 'Called Number,DNCR Status\n';
          Object.entries(bulkResults).forEach(([, data]) => {
            const statusLabel = getStatusLabel(data?.status, data?.details?.dncrStatus);
            csvContent += `${data?.details?.accountNumber},${statusLabel}\n`;
          });
        } else if (results.length > 0) {
          // Download manual results
          csvContent = 'Called Number,DNCR Status\n';
          
          results.forEach((result) => {
            const statusLabel = getStatusLabel(result?.status, result?.dncrStatus);
            csvContent += `${result?.input+"" || result?.accountNumber},${statusLabel}\n`;
          });
        }

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api_number_check_results_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        globalThis.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Results downloaded successfully');
      };

      // Calculate stats
      const totalNumbers = results.length || (bulkResults ? Object.keys(bulkResults).length : 0);
      
      // Calculate counts for Denied, Permitted, and Invalid
      let deniedCount = 0;
      let permittedCount = 0;
      let invalidStatusCount = 0;
      
      if (bulkResults) {
        Object.values(bulkResults).forEach((data) => {
          const category = getStatusCategory(data?.status, data?.details?.dncrStatus);
          if (category === 'invalid') invalidStatusCount++;
          else if (category === 'denied') deniedCount++;
          else permittedCount++;
        });
      } else {
        results.forEach((result: PhoneResult) => {
          const category = getStatusCategory(result?.status, result?.dncrStatus);
          if (category === 'invalid') invalidStatusCount++;
          else if (category === 'denied') deniedCount++;
          else permittedCount++;
        });
      }
      
      const tableData = useMemo<NumberCheckTableRow[]>(() => {
        if (bulkResults) {
          return Object.entries(bulkResults).map(([phoneNumber, data], idx: number) => ({
            id: `${phoneNumber}-${idx}`,
            calledNumber: String(data?.details?.accountNumber || phoneNumber || ''),
            status: String(data?.status || ''),
            dncrStatus: data?.details?.dncrStatus,
          }));
        }

        return results.map((result, idx) => ({
          id: `${result.input}-${idx}`,
          calledNumber: String(result?.accountNumber || result?.input || ''),
          status: String(result?.status || ''),
          dncrStatus: result?.dncrStatus,
        }));
      }, [bulkResults, results]);

      const tableColumns: TableColumn<NumberCheckTableRow>[] = [
        {
          key: 'calledNumber',
          label: 'CALLED NUMBER',
          type: 'custom',
          sortable: false,
          render: (row) => <strong>{row.calledNumber || '--'}</strong>,
        },
        {
          key: 'status',
          label: 'DNCR STATUS',
          type: 'custom',
          sortable: false,
          render: (row) => renderStatusBadge(row.status, row.dncrStatus),
        },
      ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="API Number Check" />

      <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>API Number Check</h1>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowFormatGuide(true);
            }}
            style={{...styles.formatGuide, background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
          >
            <HelpCircle size={16} style={{ marginRight: '6px' }} />
            Guidelines
          </button>
        </div>

        {/* Input Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge}>
                <Edit3 size={16} color="#6c757d" />
              </div>
              Input
            </div>
          </div>

          <div style={styles.cardBody}>
            {/* Tabs */}
            <div style={styles.tabsContainer}>
              <div style={styles.tabs}>
                <button
                  style={activeTab === 'manual' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('manual')}
                >
                  <Edit3 size={16} style={{ marginRight: '6px' }} />
                  Manual
                </button>
                <button
                  style={activeTab === 'csv' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('csv')}
                >
                  <Upload size={16} style={{ marginRight: '6px' }} />
                  CSV
                </button>
              </div>
            </div>

            <div style={styles.tabContent}>
              {/* Manual Tab */}
              {activeTab === 'manual' && (
                <div style={styles.manualTab}>
                  <textarea
                    style={styles.textarea}
                    value={manualInput}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setManualInput(e.target.value)}
                    placeholder="Enter phone numbers separated by comma or newline (e.g., +15551234567, +447700900123)"
                  />
                  <div style={styles.manualFooter}>
                    <span style={styles.hint}>
                      Numbers must start with "05" and be exactly 10 digits
                    </span>
                    <div style={styles.manualButtons}>
                      <button 
                        style={{...styles.btnPrimary, opacity: (!isManualInputValid || isChecking) ? 0.6 : 1, cursor: (!isManualInputValid || isChecking) ? 'not-allowed' : 'pointer'}} 
                        onClick={handleCheckNumbers}
                        disabled={!isManualInputValid || isChecking}
                      >
                        {isChecking ? 'Checking...' : 'Check Numbers'}
                      </button>
                      <button style={styles.btnSecondary} onClick={clearManualInput}>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CSV Tab */}
              {activeTab === 'csv' && (
                <div style={styles.csvTab}>
                  <button
                    type="button"
                    style={{
                      ...styles.dropzone,
                      borderColor: csvFile ? '#28a745' : '#dee2e6',
                      backgroundColor: csvFile ? '#f0f9ff' : '#f8f9fa'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onKeyDown={handleDropzoneKeyDown}
                  >
                    {csvFile ? (
                      <div style={{ textAlign: 'center' }}>
                        <Upload size={32} color="#28a745" style={{ marginBottom: '12px' }} />
                        <p style={{...styles.dropzoneText, color: '#28a745', fontWeight: '500'}}>
                          {csvFile.name}
                        </p>
                        <p style={{...styles.dropzoneText, fontSize: '12px'}}>
                          {(csvFile.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          style={{
                            ...styles.btnSecondary,
                            marginTop: '8px',
                            padding: '6px 16px',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setCsvFile(null);
                            setBulkResults(null);
                          }}
                        >
                          <X size={14} style={{ marginRight: '4px', display: 'inline' }} />
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <>
                    <Upload size={32} color="#6c757d" style={{ marginBottom: '12px' }} />
                    <p style={styles.dropzoneText}>Drag and drop or browse to upload CSV</p>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      style={styles.fileInput}
                      id="csvUpload"
                    />
                    <label htmlFor="csvUpload" style={styles.browseLabel}>
                      Browse
                    </label>
                      </>
                    )}
                  </button>
                  <div style={styles.csvInfo}>
                    <span style={styles.link}>CSV column: PhoneNumber</span>
                    <button
                      type="button"
                      onClick={downloadSampleFile}
                      style={{...styles.link, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline'}}
                    >
                      Download sample
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div style={styles.statusBar}>
              <div style={styles.statusLeft}>
              {activeTab === 'manual' ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={validCount > 0 ? styles.statusBadgeSuccess : styles.statusBadgeDisabled}>
                    Valid Numbers: {validCount}
                  </span>
                  <span style={invalidCount > 0 ? styles.statusBadgeError : styles.statusBadgeDisabled}>
                    Invalid Numbers: {invalidCount}
                  </span>
                  {validCount === 0 && invalidCount === 0 && (
                    <span style={styles.statusBadgeDisabled}>
                      Total Numbers: 0
                    </span>
                  )}
                </div>
                ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {csvFile ? (
                    <>
                      <span style={csvValidCount > 0 ? styles.statusBadgeSuccess : styles.statusBadgeDisabled}>
                        Valid Numbers: {csvValidCount}
                      </span>
                      <span style={csvInvalidCount > 0 ? styles.statusBadgeError : styles.statusBadgeDisabled}>
                        Invalid Numbers: {csvInvalidCount}
                      </span>
                     
                    </>
                  ) : (
                    <span style={styles.statusBadgeDisabled}>
                      CSV: No file selected
                    </span>
                  )}
                </div>
                )}
              </div>
              <div style={styles.statusRight}>
                {activeTab === 'manual' ? (
                  <></>
                ) : (
                  <button 
                    style={{
                      ...styles.btnPrimaryLarge,
                      opacity: (!csvFile || isUploading || csvInvalidCount > 0) ? 0.6 : 1,
                      cursor: (!csvFile || isUploading || csvInvalidCount > 0) ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={handleBulkUpload}
                    disabled={!csvFile || isUploading || csvInvalidCount > 0}
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Check Numbers'}
                </button>
                )}
                {(results.length > 0 || bulkResults) && (
                <button style={styles.btnOutline} onClick={handleDownloadResults}>
                    <Download size={16} style={{ marginRight: '6px', display: 'inline' }} />
                  Download Results
                </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge}>
                <Edit3 size={16} color="#6c757d" />
              </div>
              Results
            </div>
            <div style={styles.resultStats}>
              <span style={styles.statItem}>Total <strong>{totalNumbers}</strong></span>
              <span style={{...styles.statItem, color: '#28a745'}}>Permitted <strong>{permittedCount}</strong></span>
              <span style={{...styles.statItem, color: '#dc3545'}}>Denied <strong>{deniedCount}</strong></span>
              <span style={{...styles.statItem, color: '#856404'}}>Invalid <strong>{invalidStatusCount}</strong></span>
            </div>
          </div>

          <div style={styles.cardBody}>
            {results.length === 0 && !bulkResults ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No results yet. Enter phone numbers and click "Check Numbers" to see results.
              </div>
            ) : (
            <GenericTable<NumberCheckTableRow>
              data={tableData}
              columns={tableColumns}
              uniqueKey="id"
              showActions={false}
              showToolbar={false}
              showToolbarActions={false}
              loading={isChecking || isUploading}
              loadingMessage="Loading results..."
              emptyMessage="No results yet. Enter phone numbers and click Check Numbers to see results."
            />
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Format Guide Modal */}
    <Modal 
      show={showFormatGuide} 
      onHide={() => setShowFormatGuide(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} />
          Format Guide
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Manual Input Section */}
          <div>
            <h5 style={{ marginBottom: '12px', color: '#212529', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} />
              Manual Input Format
            </h5>
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#495057', lineHeight: '1.8' }}>
                <li>Numbers must start with <strong>"05"</strong></li>
                <li>Each number must be exactly <strong>10 digits</strong> total</li>
                <li>Separate multiple numbers with <strong>comma</strong></li>
                <li>Maximum <strong>10 numbers</strong> allowed per check</li>
                <li>Non-digit characters (spaces, dashes) are automatically removed during validation</li>
              </ul>
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <strong style={{ color: '#212529', display: 'block', marginBottom: '8px' }}>Example:</strong>
                <code style={{ color: '#0d6efd', fontSize: '14px' }}>
                  0512345678, 0598765432, 0555555555
                </code>
              </div>
            </div>
          </div>

          {/* CSV Upload Section */}
          <div>
            <h5 style={{ marginBottom: '12px', color: '#212529', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} />
              CSV File Format
            </h5>
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#495057', lineHeight: '1.8' }}>
                <li>File must be in <strong>CSV format</strong> (.csv extension)</li>
                <li>First column should contain phone numbers</li>
                <li>Numbers must start with <strong>"05"</strong> and be exactly <strong>10 digits</strong></li>
                <li>Each row represents one phone number</li>
                <li>Header row is optional (will be skipped if present)</li>
                <li>Maximum file size and row limits may apply</li>
              </ul>
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <strong style={{ color: '#212529', display: 'block', marginBottom: '8px' }}>Example CSV:</strong>
                <code style={{ color: '#0d6efd', fontSize: '14px', display: 'block', whiteSpace: 'pre' }}>
                  {`Phone Number
0512345678
0598765432
0555555555`}
                </code>
              </div>
            </div>
          </div>

          {/* Validation Rules */}
          <div style={{ backgroundColor: '#fff3cd', padding: '16px', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <h6 style={{ marginBottom: '8px', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Validation Rules
            </h6>
            <p style={{ margin: 0, color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>
              Invalid numbers will be highlighted in the status bar. Only valid numbers (starting with "05" and exactly 10 digits) can be checked.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => setShowFormatGuide(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
    </React.Fragment>
  );
};

APINumberCheck.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default APINumberCheck;
