import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import RolesFilters from '@components/filters/RolesFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckNumber,BulkCheckNumber } from '@utils/dncr';


const Ranks = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = [
        
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    
    // Form state for checking number
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [checkResult, setCheckResult] = useState<any>(null);
    
    // Bulk upload state
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [bulkResults, setBulkResults] = useState<any>(null);

    // Handle form submission
    const handleCheckNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber.trim()){
            toast.error('Please enter a phone number');
            return;
        }
        
        setIsChecking(true);
        setCheckResult(null);
        
        try {
            const response = await CheckNumber(phoneNumber);
            console.log(response);
            if(response){
                setCheckResult(response);
            }else{
                toast.error('No results found for this phone number');
            }
            
        } catch (error) {
            toast.error('Error checking number status');
        } finally {
            setIsChecking(false);
        }
    };

    // Handle bulk file upload
    const handleBulkUpload = async () => {
        if (!bulkFile){
            toast.error('Please select a file');
            return;
        }
        
        // Additional file validation
        if (!(bulkFile instanceof File)) {
            toast.error('Invalid file object');
            return;
        }
        
        if (bulkFile.size === 0) {
            toast.error('The selected file is empty');
            return;
        }
        
        // Check file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (bulkFile.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
        }
        
        // Validate file extension
        const fileExtension = bulkFile.name.toLowerCase().substring(bulkFile.name.lastIndexOf('.'));
        const allowedExtensions = ['.csv'];
        if (!allowedExtensions.includes(fileExtension)) {
            toast.error(`Invalid file type. Please use: ${allowedExtensions.join(', ')}`);
            return;
        }
        
        setIsUploading(true);
        setBulkResults(null);
        
        try {
            // Call your DNCR bulk check API endpoint
            const formData = new FormData();
            formData.append('sheet', bulkFile);
            
            const response = await BulkCheckNumber(formData);
            
            if (!response) {
                toast.error('Failed to check numbers');
                return;
            }
            console.log(response);
            if(response){
                setBulkResults(response);

                
                setShowBulkUploadModal(false);
            }
            
             
        } catch (error: any) {
            console.error('Bulk upload error:', error);
            
            // Show more specific error messages
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
    };

    // Download sample file
    const downloadSampleFile = () => {
        // Create CSV with Excel-compatible formatting to preserve leading zeros
        const sampleData = `PhoneNumber
0557044312
0556960535
0556930017
0557067850
0509380627
0551234567
0559876543`;
        
        // Ensure proper CSV formatting with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvContent = BOM + sampleData;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dncr_bulkupload_sample.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // Handle file drop
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file object
            if (!(file instanceof File)) {
                toast.error('Invalid file object');
                return;
            }
            
            const allowedExtensions = ['.csv'];
            
            // Check file extension
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExtension)) {
                toast.error('Please select a valid file type (CSV, XLSX, or XLS)');
                return;
            }
            
            // Additional validation
            if (file.size === 0) {
                toast.error('The selected file is empty');
                return;
            }
            
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                toast.error('File size must be less than 10MB');
                return;
            }
            
            setBulkFile(file);
            toast.success(`File "${file.name}" selected successfully`);
        }
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validate file object
            if (!(file instanceof File)) {
                toast.error('Invalid file object');
                return;
            }
            
            const allowedTypes = [
                'text/csv',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel' // .xls
            ];
            const allowedExtensions = ['.csv'];
            
            // Check file extension
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExtension)) {
                toast.error('Please select a valid file type (CSV)');
                return;
            }
            
            // Check MIME type (optional, as some systems may not report MIME types correctly)
            if (file.type && !allowedTypes.includes(file.type)) {
                console.warn('File MIME type validation failed, but proceeding with extension validation');
            }
            
            setBulkFile(file);
            //toast.success(`File "${file.name}" selected successfully`);
        }
    };

    // Phone number validation function
    const isValidPhoneCharacter = (char: string): boolean => {
        const phoneRegex = /[\d\s\-\+\(\)]/;
        return phoneRegex.test(char);
    };

    const isValidPhoneNumber = (value: string): boolean => {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(value);
    };

    // Clear all form data and results
    const handleClearAll = () => {
        setPhoneNumber('');
        setCheckResult(null);
        setBulkFile(null);
        setBulkResults(null);
        setIsChecking(false);
        setIsUploading(false);
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="DNCR" mainLink="/dncr" subTitle="Check Number" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                    Check Number on DNCR
                </h2>

{session?.user?.permissions?.includes('bulk-check-numbers-dncr') && (
    <Button variant="outline-primary" size="sm" onClick={() => setShowBulkUploadModal(true)}>Bulk Upload</Button>
)}
                </div>

            </Col>
            </Row>


            <Row>
                <Col md={12}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title">Check Number on DNCR</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleCheckNumber}>
                                <div className="row align-items-end">
                                    <Col md={3}>
                                        <div className="form-group">
                                            <label htmlFor="number" className="form-label fw-bold">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                className="form-control" 
                                                id="number" 
                                                name="number"
                                                value={phoneNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || isValidPhoneNumber(value)) {
                                                        setPhoneNumber(value);
                                                    }
                                                }}
                                                onKeyPress={(e) => {
                                                    const char = String.fromCharCode(e.which);
                                                    if (!isValidPhoneCharacter(char)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                placeholder="Enter phone number (e.g., +1 234-567-8900)"
                                                pattern="[\d\s\-\+\(\)]+"
                                                maxLength={20}
                                                required
                                            />
                                            
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="form-group d-flex gap-2">
                                            <Button 
                                                type="submit" 
                                                variant="primary" 
                                                size="lg"
                                                disabled={!phoneNumber.trim() || isChecking}
                                            >
                                                {isChecking ? 'Checking...' : 'Check Number Status'}
                                            </Button>
                                            <Button variant="outline-primary" size="lg" className="ms-2" onClick={handleClearAll}>Clear All</Button>
                                        </div>
                                    </Col>
                                </div>
                            </form>
                            
                            {checkResult && (
                                <div className="mt-4">
                                   
                                    
                                    {/* Results Table */}
                                    <div className="mt-4">
                                       
                                        <div className="table-responsive">
                                            <table className="table table-bordered table-striped">
                                                <thead className="">
                                                    <tr>
                                                        <th>Phone Number</th>
                                                        <th>Status</th>
                                                        <th>DNCR Status</th>
                                                        <th>Transaction Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {checkResult.map((item: any) => (
                                                        <tr key={item.phoneNumber}>
                                                            <td>{item.accountNumber}</td>
                                                            <td>
                                                                <span className={`badge ${item?.status === "TRUE" ? "bg-success" : "bg-danger"}`}>
                                                                    {item?.status === "TRUE" ? "Registered" : "Not Registered"}
                                                                </span>
                                                            </td>
                                                            
                                                            <td>
                                                                <span className={`badge ${item?.dncrStatus === "TRUE" ? "bg-success" : "bg-danger"}`}>
                                                                    {item?.dncrStatus === "TRUE" ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                            <td>{item?.transactionStatus || "N/A"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bulk Results Table */}
                            {bulkResults && (
                                <div className="mt-4">
                                    
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Phone Number</th>
                                                    <th>Status</th>
                                                    <th>Account Number</th>
                                                    <th>DNCR Status</th>
                                                    <th>Transaction Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(bulkResults).map(([phoneNumber, data]: [string, any]) => (
                                                    <tr key={phoneNumber}>
                                                        <td><strong>{phoneNumber}</strong></td>
                                                        <td>
                                                            <span className={`badge ${data.status === "TRUE" ? "bg-success" : "bg-danger"}`}>
                                                                {data.status === "TRUE" ? "Registered" : "Not Registered"}
                                                            </span>
                                                        </td>
                                                        <td>{data.accountNumber}</td>
                                                        <td>
                                                            <span className={`badge ${data.dncrStatus === "TRUE" ? "bg-success" : "bg-danger"}`}>
                                                                {data.dncrStatus === "TRUE" ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td>{data.transactionStatus || "N/A"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Bulk Upload Modal */}
            <Modal 
                show={showBulkUploadModal} 
                onHide={() => setShowBulkUploadModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Bulk Upload DNCR Check</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <h6>Upload File</h6>
                        <p className="text-muted mb-2">Upload a CSV file with phone numbers (one per line)</p>
                        
                        <div 
                            className={`border-2 border-dashed rounded p-4 text-center ${bulkFile ? 'border-success bg-light' : 'border-secondary'}`}
                            onDrop={handleFileDrop}
                            onDragOver={(e) => e.preventDefault()}
                            style={{ 
                                borderStyle: 'dashed',
                                cursor: 'pointer',
                                minHeight: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {bulkFile ? (
                                <div>
                                    <i className="fas fa-file-csv text-success fa-2x mb-2"></i>
                                    <p className="mb-1"><strong>{bulkFile.name}</strong></p>
                                    <p className="text-muted mb-2">File selected successfully</p>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => setBulkFile(null)}
                                    >
                                        Remove File
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <i className="fas fa-cloud-upload-alt text-muted fa-2x mb-2"></i>
                                    <p className="mb-1">Drag and drop your CSV file here</p>

                                    
                                    <p className="text-muted mb-2">or</p>
                                    <Form.Control
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        id="bulk-file-input"
                                    />
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        onClick={() => document.getElementById('bulk-file-input')?.click()}
                                    >
                                        Browse File
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between w-100">
                        <div>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={downloadSampleFile}
                            >
                                <i className="fas fa-download me-2"></i>
                                Download Sample File
                            </Button>
                        </div>
                        <div>
                            <Button variant="secondary" onClick={() => setShowBulkUploadModal(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleBulkUpload}
                                disabled={!bulkFile || isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload & Check Numbers'
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

         
                 {/* <GenericListPage
                 columns={columns}
                 fetchData={fetchRoles}
                 searchPlaceholder="Search ranks..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
             /> */}
           

            
        
        </React.Fragment>
    );
};

Ranks.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Ranks;
