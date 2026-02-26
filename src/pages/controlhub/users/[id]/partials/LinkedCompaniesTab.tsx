import React, { useState } from 'react';
import { Card, Col, Row, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Select, { MultiValue } from 'react-select';
import FormModal from '@pages/partial/FormModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Module } from '@typings/controlhub/users';
import { LinkCompany, UnlinkCompany } from '@utils/users';
import { useModuleSelection } from '@hooks/useModuleSelection';

interface LinkedCompaniesTabProps {
    linkedCompanies: any[];
    dataCompanies: any[];
    filteredModules: Module[];
    session: any;
    userId: string;
    onUserUpdate: () => void;
    onSuccess: (title: string, description: string) => void;
}

const LinkedCompaniesTab: React.FC<LinkedCompaniesTabProps> = ({
    linkedCompanies,
    dataCompanies,
    filteredModules,
    session,
    userId,
    onUserUpdate,
    onSuccess
}) => {
    const [showAddLinkedCompanyModal, setShowAddLinkedCompanyModal] = useState(false);
    const [showDeleteLinkedCompanyModal, setShowDeleteLinkedCompanyModal] = useState(false);
    const [showBulkDeleteLinkedCompanyModal, setShowBulkDeleteLinkedCompanyModal] = useState(false);
    const [deleteLinkedCompanyId, setDeleteLinkedCompanyId] = useState<string | null>(null);
    const [selectedLinkedCompanies, setSelectedLinkedCompanies] = useState<string[]>([]);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

    const {
        selectedModules,
        handleModuleChange,
        moduleOptions,
        moduleValue,
        resetModules
    } = useModuleSelection(session, []);

    const handleCloseAddLinkedCompanyModal = () => {
        setShowAddLinkedCompanyModal(false);
        setSelectedCompanies([]);
        resetModules();
    };

    const handleCompanyChange = (selectedOptions: MultiValue<{ value: string; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value);
        setSelectedCompanies(values);
    };

    const handleSubmitAddLinkedCompany = async () => {
        if (selectedCompanies.length === 0) {
            toast.error('Please select at least one company to link');
            return;
        }

        if (selectedModules.length === 0) {
            toast.error('Please select at least one module');
            return;
        }

        const responses = await Promise.all(
            selectedCompanies.flatMap((companyId) =>
                selectedModules.map((moduleId) => LinkCompany(userId, companyId, moduleId))
            )
        );

        if (responses.every(Boolean)) {
            setShowAddLinkedCompanyModal(false);
            setSelectedCompanies([]);
            onUserUpdate();
            onSuccess('Linked Companies Added', 'Selected companies have been linked successfully');
        }
    };

    const handleCloseDeleteLinkedCompanyModal = () => {
        setShowDeleteLinkedCompanyModal(false);
        setDeleteLinkedCompanyId(null);
    };

    const handleDeleteLinkedCompanyClick = (linkId: string) => {
        setDeleteLinkedCompanyId(linkId);
        setShowDeleteLinkedCompanyModal(true);
    };

    const handleLinkedCompanyCheckboxChange = (linkId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedLinkedCompanies(prev => [...prev, linkId]);
        } else {
            setSelectedLinkedCompanies(prev => prev.filter(id => id !== linkId));
        }
    };

    const handleSelectAllLinkedCompanies = (isChecked: boolean) => {
        if (isChecked) {
            const allLinkedCompanyIds = linkedCompanies?.map(linkedCompany => (linkedCompany.id || linkedCompany.link_id)?.toString()).filter(Boolean) || [];
            setSelectedLinkedCompanies(allLinkedCompanyIds);
        } else {
            setSelectedLinkedCompanies([]);
        }
    };

    const handleBulkDeleteLinkedCompaniesClick = () => {
        if (selectedLinkedCompanies.length === 0) {
            toast.error('Please select at least one linked company to delete');
            return;
        }
        setShowBulkDeleteLinkedCompanyModal(true);
    };

    const handleCloseBulkDeleteLinkedCompanyModal = () => {
        setShowBulkDeleteLinkedCompanyModal(false);
    };

    const handleDeleteLinkedCompany = async () => {
        if (!deleteLinkedCompanyId) return;

        const response = await UnlinkCompany(deleteLinkedCompanyId);
        if (response) {
            setShowDeleteLinkedCompanyModal(false);
            setDeleteLinkedCompanyId(null);
            onUserUpdate();
            onSuccess('Company Unlinked', 'The company has been unlinked successfully');
        }
    };

    const handleBulkDeleteLinkedCompanies = async () => {
        if (selectedLinkedCompanies.length === 0) return;

        try {
            const deletePromises = selectedLinkedCompanies.map(linkId => UnlinkCompany(linkId));

            const responses = await Promise.all(deletePromises);

            if (responses.every(Boolean)) {
                setShowBulkDeleteLinkedCompanyModal(false);
                setSelectedLinkedCompanies([]);
                onUserUpdate();
                onSuccess('Linked Companies Deleted', `${selectedLinkedCompanies.length} linked company/companies have been unlinked successfully`);
            }
        } catch (error) {
            console.error('Error deleting linked companies:', error);
            toast.error('Error deleting linked companies');
        }
    };

    return (
        <>
            <Row>
                <Col md={12}>
                    <FormModal
                        show={showAddLinkedCompanyModal}
                        onHide={handleCloseAddLinkedCompanyModal}
                        title="Add Linked Company"
                        desc="Please select the company/companies to link."
                        formHtml={
                            <>
                                <div className="form-group">
                                    <label htmlFor="linkedCompany">Select Company</label>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        isClearable={true}
                                        isSearchable={true}
                                        onChange={(opts) => handleCompanyChange(opts as MultiValue<{ value: string; label: string }>)}
                                        name="companies"
                                        isMulti={true}
                                        value={selectedCompanies.map((companyId) => {
                                            const company = dataCompanies.find((c) => c.id?.toString() === companyId || c.id === companyId);
                                            return company ? { value: company.id?.toString() || company.id, label: company.name || company.company_name || 'Unknown' } : { value: companyId, label: companyId };
                                        })}
                                        options={dataCompanies
                                            .map((company) => ({
                                                value: (company.id || company.company_id)?.toString(),
                                                label: company.name || company.company_name || 'Unknown'
                                            }))}
                                        placeholder="Select Company"
                                    />
                                    <p className="text-muted mt-2 small">
                                        Choose the company you want to link from the available list. This determines which organization's data or operations will be associated with the selected module.
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="linkedModule">Select Module</label>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        isClearable={true}
                                        isSearchable={true}
                                        onChange={(opts) => handleModuleChange(opts as MultiValue<{ value: string; label: string }>)}
                                        name="module"
                                        isMulti={true}
                                        value={moduleValue}
                                        options={moduleOptions}
                                        placeholder="Select Module"
                                    />
                                    <p className="text-muted mt-2 small">
                                        Pick the module you wish to link to the selected company. Modules represent functional areas that will be integrated with the company for shared access or workflow alignment
                                    </p>
                                </div>
                            </>
                        }
                        submitButtonText="Add Linked Company"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitAddLinkedCompany}
                        onCancel={handleCloseAddLinkedCompanyModal}
                    />

                    <Card>
                        <Card.Body>
                            <h5 className="d-flex justify-content-between">
                                Linked Companies
                                <div className="d-flex gap-2">
                                    {selectedLinkedCompanies.length > 0 && session?.user?.is_admin && session?.user?.permissions?.includes('company-unlink-users') && (
                                        <Button variant="danger" className="app-button" size="sm" onClick={handleBulkDeleteLinkedCompaniesClick}>
                                            Unlink Selected ({selectedLinkedCompanies.length})
                                        </Button>
                                    )}
                                    <Button variant="primary" className="app-button" size="sm" onClick={() => {
                                        setShowAddLinkedCompanyModal(true);
                                        resetModules();
                                    }}>Add Linked Company</Button>
                                </div>
                            </h5>

                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedLinkedCompanies.length > 0 && selectedLinkedCompanies.length === (linkedCompanies?.length || 0)}
                                                onChange={(e) => handleSelectAllLinkedCompanies(e.target.checked)}
                                            />
                                        </th>
                                        <th>Company</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedCompanies && linkedCompanies.length > 0 ? (
                                        linkedCompanies.map((obj) => (
                                            <tr key={(obj.id || obj.link_id)}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLinkedCompanies.includes((obj.id || obj.link_id)?.toString())}
                                                        onChange={(e) => handleLinkedCompanyCheckboxChange((obj.id || obj.link_id)?.toString(), e.target.checked)}
                                                    />
                                                </td>
                                                <td>{obj?.company?.name || obj?.company?.company_name || obj?.company_name || 'N/A'}</td>
                                                <td>{obj?.module?.name || 'N/A'}</td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        {session?.user?.is_admin && session?.user?.permissions?.includes('company-unlink-users') && (
                                                            <Button size="sm" className="app-button" variant="danger" onClick={() => {
                                                                handleDeleteLinkedCompanyClick((obj.id || obj.link_id)?.toString());
                                                            }}>Unlink</Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center">No linked companies found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <ConfirmModal
                show={showDeleteLinkedCompanyModal}
                onHide={handleCloseDeleteLinkedCompanyModal}
                title="Unlink Company"
                description="Are you sure you want to unlink this company? This action cannot be undone."
                targetName="this company"
                confirmButtonText="Yes, Unlink"
                cancelButtonText="Cancel"
                onConfirm={handleDeleteLinkedCompany}
                onCancel={handleCloseDeleteLinkedCompanyModal}
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="unlink"
                confirmationPlaceholder="Type 'unlink' to confirm"
                confirmationLabel="Confirmation Required"
            />

            <ConfirmModal
                show={showBulkDeleteLinkedCompanyModal}
                onHide={handleCloseBulkDeleteLinkedCompanyModal}
                title="Bulk Unlink Companies"
                description={`Are you sure you want to unlink ${selectedLinkedCompanies.length} selected company/companies? This action cannot be undone.`}
                targetName={`${selectedLinkedCompanies.length} selected company/companies`}
                confirmButtonText="Yes, Unlink All"
                cancelButtonText="Cancel"
                onConfirm={handleBulkDeleteLinkedCompanies}
                onCancel={handleCloseBulkDeleteLinkedCompanyModal}
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="unlink all"
                confirmationPlaceholder="Type 'unlink all' to confirm"
                confirmationLabel="Confirmation Required"
            />
        </>
    );
};

export default LinkedCompaniesTab;

