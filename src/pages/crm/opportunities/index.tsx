import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getOpportunities, deleteOpportunity, deleteLead } from '@utils/crm';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { FiTarget, FiPlus, FiMoreVertical, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';

const CrmOpportunities = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string>("");

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const columns: Column[] = useMemo(() => [
    { 
      key: 'name', 
      name: 'Opportunity Name', 
      selector: (row: any) => row.name, 
      sortable: true,
      cell: (props: any) => (
        <div>
          <div className="fw-medium">{props.name || 'Unnamed Opportunity'}</div>
          <small className="text-muted">{props.company || 'No Company'}</small>
        </div>
      )
    },
    { 
      key: 'stage_name', 
      name: 'Stage', 
      selector: (row: any) => row.stage_name, 
      sortable: true,
      cell: (props: any) => (
        <Badge bg={getStageColor(props.stage_name)}>
          {props.stage_name || 'New'}
        </Badge>
      )
    },
    { 
      key: 'value', 
      name: 'Value', 
      selector: (row: any) => row.value, 
      sortable: true,
      cell: (props: any) => (
        <span className="fw-medium">
          {formatCurrency(props.value)}
        </span>
      )
    },
    { 
      key: 'probability', 
      name: 'Probability', 
      selector: (row: any) => row.probability, 
      sortable: true,
      cell: (props: any) => (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-medium">{props.probability || 0}%</span>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div 
              className="progress-bar" 
              style={{ width: `${props.probability || 0}%` }}
            />
          </div>
        </div>
      )
    },
    { 
      key: 'expected_close_date', 
      name: 'Close Date', 
      selector: (row: any) => row.expected_close_date, 
      sortable: true,
      cell: (props: any) => (
        <span className="text-muted">
          {props.expected_close_date ? moment(props.expected_close_date).format('DD/MM/YYYY') : '-'}
        </span>
      )
    },
    { 
      key: 'assigned_to', 
      name: 'Assigned To', 
      selector: (row: any) => row.assigned_to, 
      sortable: true,
      cell: (props: any) => (
        <span>{props.assigned_to_name || 'Unassigned'}</span>
      )
    },
    { 
      key: 'created_at', 
      name: 'Created', 
      selector: (row: any) => row.created_at, 
      sortable: true,
      cell: (props: any) => (
        <span className="text-muted">
          {moment(props.created_at).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      key: 'Action',
      name: 'ACTION',
      selector: (row: any) => row.id,
      sortable: false,
      cell: (props: any) => (
        <div className="action-buttons-container">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm" id={`dropdown-${props.id}`}>
              <FiMoreVertical size={14} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} href={`/crm/leads/${props.id}`}>
                <FiEdit className="me-2" />
                View
              </Dropdown.Item>
              <Dropdown.Item as={Link} href={`/crm/leads/${props.id}/edit`}>
                <FiEdit className="me-2" />
                Edit
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => handleDeleteOpportunity(props)} className="text-danger">
                <FiTrash2 className="me-2" />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      ),
    },
  ], []);

  const fetchOpportunities = useCallback(async (page = 1, perPage = 15, search = "") => {
    return await getOpportunities({ page, perPage, search, filters: memoizedFilters });
  }, [memoizedFilters]);

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const getStageColor = (stageName: string) => {
    const colors: { [key: string]: string } = {
      'New': 'primary',
      'Qualified': 'info',
      'Proposal': 'warning',
      'Negotiation': 'secondary',
      'Closed Won': 'success',
      'Closed Lost': 'danger'
    };
    return colors[stageName] || 'secondary';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleDeleteOpportunity = useCallback((opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowDeleteModal(true);
  }, []);

  const handleSubmitDelete = useCallback(async () => {
    const confirmDeleteValue = confirmDelete.trim().toLowerCase();
    if (confirmDeleteValue === "delete") {
      try {
        const response = await deleteLead(selectedOpportunity.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    } else {
      toast.error('Please type the word "delete" to confirm');
    }
  }, [confirmDelete, selectedOpportunity]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Opportunities" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              <FiTarget className="me-2" />
              Opportunities Management
            </h2>
            <p className="text-muted mb-0">Track your sales opportunities and manage your pipeline</p>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button 
                variant="success" 
                href="/crm/leads/create"
                className="d-flex align-items-center"
              >
                <FiPlus className="me-2" />
                New Opportunity
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                href="/crm/opportunities/import"
                size="sm"
              >
                Import
              </Button>
              <Button 
                variant="outline-secondary" 
                href="/crm/opportunities/export"
                size="sm"
              >
                Export
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchOpportunities}
        title="Opportunities"
        searchPlaceholder="Search opportunities..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Opportunity?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the opportunity <b className="text-danger">{selectedOpportunity?.name}</b>?
          </p>
          <p>
            Type the word <b className="text-danger">delete</b> to confirm
          </p>
          <input 
            type="text" 
            className="form-control" 
            value={confirmDelete} 
            onChange={(e) => setConfirmDelete(e.target.value)} 
            placeholder="Type the word delete to confirm" 
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmitDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmOpportunities.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOpportunities;
