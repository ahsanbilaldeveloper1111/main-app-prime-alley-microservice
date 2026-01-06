import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, DragEvent, ChangeEvent, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from 'react-toastify';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { CheckNumber, BulkCheckNumber } from '@utils/dncr';
import { Edit3, Upload, HelpCircle, Download, X } from 'lucide-react';

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
    
const APINumberCheck = () => {
      const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
      const [manualInput, setManualInput] = useState<string>('');
      const [csvFile, setCsvFile] = useState<File | null>(null);
      const [results, setResults] = useState<PhoneResult[]>([]);
      const [isChecking, setIsChecking] = useState<boolean>(false);
      const [isUploading, setIsUploading] = useState<boolean>(false);
      const [bulkResults, setBulkResults] = useState<any>(null);
    
      // Parse phone numbers from manual input (comma or newline separated)
      const parsePhoneNumbers = (input: string): string[] => {
        return input
          .split(/[,\n]/)
          .map(num => num.trim())
          .filter(num => num.length > 0)
          .slice(0, 10); // Limit to 10 numbers
      };

      // Transform API response to PhoneResult
      const transformCheckResult = (phoneNumber: string, response: any): PhoneResult => {
        if (response && Array.isArray(response) && response.length > 0) {
          const item = response[0];
          return {
            input: phoneNumber,
            normalized: phoneNumber,
            status: item?.status === "TRUE" ? "Valid" : "Invalid",
            accountNumber: item?.accountNumber || '',
            dncrStatus: item?.dncrStatus === "TRUE" ? "Active" : "Inactive",
            transactionStatus: item?.transactionStatus || "N/A",
            notes: item?.status === "TRUE" ? "Registered" : "Not Registered"
          } as PhoneResult;
        }
        return {
          input: phoneNumber,
          normalized: phoneNumber,
          status: "Invalid",
          notes: "No results found"
        } as PhoneResult;
      };

      // Check a single phone number
      const checkSingleNumber = async (phoneNumber: string): Promise<PhoneResult> => {
        try {
          const response = await CheckNumber(phoneNumber);
          return transformCheckResult(phoneNumber, response);
        } catch (error) {
          console.error(`Error checking ${phoneNumber}:`, error);
          return {
            input: phoneNumber,
            normalized: phoneNumber,
            status: "Error",
            notes: "Check failed"
          } as PhoneResult;
        }
      };

      // Handle manual number check
      const handleCheckNumbers = useCallback(async (): Promise<void> => {
        if (!manualInput.trim()) {
          toast.error('Please enter at least one phone number');
          return;
        }

        const phoneNumbers = parsePhoneNumbers(manualInput);
        if (phoneNumbers.length === 0) {
          toast.error('Please enter valid phone numbers');
          return;
        }

        if (phoneNumbers.length > 10) {
          toast.error('Maximum 10 numbers allowed');
          return;
        }

        setIsChecking(true);
        setResults([]);
        setBulkResults(null);

        try {
          const checkPromises = phoneNumbers.map(checkSingleNumber);
          const checkResults = await Promise.all(checkPromises);
          setResults(checkResults);
        } catch (error) {
          console.error('Error checking numbers:', error);
          toast.error('Error checking numbers');
        } finally {
          setIsChecking(false);
        }
      }, [manualInput]);

      // Handle CSV file upload
      const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
          // Validate file
          const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          if (fileExtension !== '.csv') {
            toast.error('Please select a CSV file');
            return;
          }
          
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
          }
          
          setCsvFile(file);
        }
      };
    
      const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
      };
    
      const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
          const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          if (fileExtension !== '.csv') {
            toast.error('Please drop a CSV file');
            return;
          }
          
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
          }
          
          setCsvFile(file);
          toast.success(`File "${file.name}" selected successfully`);
        }
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

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (csvFile.size > maxSize) {
          toast.error('File size must be less than 10MB');
          return;
        }

        const fileExtension = csvFile.name.toLowerCase().substring(csvFile.name.lastIndexOf('.'));
        if (fileExtension !== '.csv') {
          toast.error('Invalid file type. Please use CSV format');
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
            setBulkResults(response);
            toast.success('Numbers checked successfully');
          } else {
            toast.error('Failed to check numbers');
          }
        } catch (error: any) {
          console.error('Bulk upload error:', error);
          if (error.response?.data?.message) {
            toast.error(error.response.data.message);
          } else if (error.message) {
            toast.error(`Upload failed: ${error.message}`);
          } else {
            toast.error('Error during bulk upload');
          }
        } finally {
          setIsUploading(false);
        }
      }, [csvFile]);
    
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
          csvContent = 'Phone Number,Status,Account Number,DNCR Status,Transaction Status\n';
          Object.entries(bulkResults).forEach(([phoneNumber, data]: [string, any]) => {
            csvContent += `${phoneNumber},${data.status === "TRUE" ? "Registered" : "Not Registered"},${data.accountNumber || ""},${data.dncrStatus === "TRUE" ? "Active" : "Inactive"},${data.transactionStatus || "N/A"}\n`;
          });
        } else if (results.length > 0) {
          // Download manual results
          csvContent = 'Input,Normalized,Status,Account Number,DNCR Status,Transaction Status,Notes\n';
          results.forEach((result) => {
            csvContent += `${result.input},${result.normalized || result.input},${result.status || "N/A"},${result.accountNumber || ""},${result.dncrStatus || "N/A"},${result.transactionStatus || "N/A"},${result.notes || ""}\n`;
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
      const validNumbers = results.filter(r => r.status === 'Valid').length || 
                          (bulkResults ? Object.values(bulkResults).filter((d: any) => d.status === "TRUE").length : 0);
      const invalidNumbers = totalNumbers - validNumbers;
      
      // Count manual numbers
      const manualNumbers = parsePhoneNumbers(manualInput).length;

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
              toast.info('Format guide: Enter phone numbers in E.164 format (e.g., +15551234567) or local format, separated by comma or newline');
            }}
            style={{...styles.formatGuide, background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
          >
            <HelpCircle size={16} style={{ marginRight: '6px' }} />
            Format guide
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
                    <span style={styles.hint}>Up to 10 numbers - E.164 or local format</span>
                    <div style={styles.manualButtons}>
                      <button 
                        style={{...styles.btnPrimary, opacity: (!manualInput.trim() || isChecking) ? 0.6 : 1, cursor: (!manualInput.trim() || isChecking) ? 'not-allowed' : 'pointer'}} 
                        onClick={handleCheckNumbers}
                        disabled={!manualInput.trim() || isChecking}
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
                  <div
                    style={{
                      ...styles.dropzone,
                      borderColor: csvFile ? '#28a745' : '#dee2e6',
                      backgroundColor: csvFile ? '#f0f9ff' : '#f8f9fa'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
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
                  </div>
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
                <span style={manualNumbers > 0 ? styles.statusBadgeSuccess : styles.statusBadgeDisabled}>
                  Manual: {manualNumbers} {manualNumbers === 1 ? 'number' : 'numbers'}
                </span>
                <span style={csvFile ? styles.statusBadgeSuccess : styles.statusBadgeDisabled}>
                  CSV: {csvFile ? csvFile.name : 'not selected'}
                </span>
              </div>
              <div style={styles.statusRight}>
                {activeTab === 'manual' ? (
                  <button 
                    style={{
                      ...styles.btnPrimaryLarge,
                      opacity: (!manualInput.trim() || isChecking) ? 0.6 : 1,
                      cursor: (!manualInput.trim() || isChecking) ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={handleCheckNumbers}
                    disabled={!manualInput.trim() || isChecking}
                  >
                    {isChecking ? 'Checking...' : 'Check Numbers'}
                  </button>
                ) : (
                  <button 
                    style={{
                      ...styles.btnPrimaryLarge,
                      opacity: (!csvFile || isUploading) ? 0.6 : 1,
                      cursor: (!csvFile || isUploading) ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={handleBulkUpload}
                    disabled={!csvFile || isUploading}
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
              <span style={styles.statItem}>Valid <strong style={{ color: '#28a745' }}>{validNumbers}</strong></span>
              <span style={styles.statItem}>Invalid <strong style={{ color: '#dc3545' }}>{invalidNumbers}</strong></span>
            </div>
          </div>

          <div style={styles.cardBody}>
            {results.length === 0 && !bulkResults ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No results yet. Enter phone numbers and click "Check Numbers" to see results.
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>Phone Number</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Account Number</th>
                      <th style={styles.th}>DNCR Status</th>
                      <th style={styles.th}>Transaction Status</th>
                      <th style={styles.th}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults ? (
                      // Display bulk results
                      Object.entries(bulkResults).map(([phoneNumber, data]: [string, any]) => (
                        <tr key={phoneNumber} style={styles.tr}>
                          <td style={styles.td}><strong>{phoneNumber}</strong></td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badgeValid,
                              backgroundColor: data.status === "TRUE" ? '#d4edda' : '#f8d7da',
                              color: data.status === "TRUE" ? '#155724' : '#721c24',
                              borderColor: data.status === "TRUE" ? '#c3e6cb' : '#f5c6cb'
                            }}>
                              {data.status === "TRUE" ? "Registered" : "Not Registered"}
                            </span>
                          </td>
                          <td style={styles.td}>{data.accountNumber || "N/A"}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badgeValid,
                              backgroundColor: data.dncrStatus === "TRUE" ? '#d4edda' : '#f8d7da',
                              color: data.dncrStatus === "TRUE" ? '#155724' : '#721c24',
                              borderColor: data.dncrStatus === "TRUE" ? '#c3e6cb' : '#f5c6cb'
                            }}>
                              {data.dncrStatus === "TRUE" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={styles.td}>{data.transactionStatus || "N/A"}</td>
                          <td style={styles.td}>{data.status === "TRUE" ? "Registered" : "Not Registered"}</td>
                        </tr>
                      ))
                    ) : (
                      // Display manual results
                      results.map((result: PhoneResult, idx: number) => (
                        <tr key={`${result.input}-${idx}`} style={styles.tr}>
                          <td style={styles.td}><strong>{result.input}</strong></td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badgeValid,
                              backgroundColor: result.status === "Valid" ? '#d4edda' : '#f8d7da',
                              color: result.status === "Valid" ? '#155724' : '#721c24',
                              borderColor: result.status === "Valid" ? '#c3e6cb' : '#f5c6cb'
                            }}>
                              {result.status || "N/A"}
                            </span>
                          </td>
                          <td style={styles.td}>{result.accountNumber || "N/A"}</td>
                          <td style={styles.td}>
                            {result.dncrStatus ? (
                              <span style={{
                                ...styles.badgeValid,
                                backgroundColor: result.dncrStatus === "Active" ? '#d4edda' : '#f8d7da',
                                color: result.dncrStatus === "Active" ? '#155724' : '#721c24',
                                borderColor: result.dncrStatus === "Active" ? '#c3e6cb' : '#f5c6cb'
                              }}>
                                {result.dncrStatus}
                              </span>
                            ) : "N/A"}
                          </td>
                          <td style={styles.td}>{result.transactionStatus || "N/A"}</td>
                          <td style={styles.td}>{result.notes || "N/A"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

APINumberCheck.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default APINumberCheck;
