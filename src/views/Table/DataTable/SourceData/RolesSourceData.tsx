import React, { useState } from 'react';
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import TableContainer from '@common/TableContainer';
import Link from 'next/link';

const RolesSourceData = () => {
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(0);

    const handleShowEditRoleModal = (id: number) => {
        setShowEditRoleModal(true);
    }

    const handleCloseEditRoleModal = () => {
        setShowEditRoleModal(false);
    }

    const handleShowDeleteRoleModal = (id: number) => {
        setShowDeleteRoleModal(true);
        setSelectedRoleId(id);

        // Swal.fire({
        //     title: 'Are you sure?',
        //     text: 'You won\'t be able to revert this!',
        //     icon: 'warning',
        //     showCancelButton: true,
        //     confirmButtonColor: '#3085d6',
        //     cancelButtonColor: '#d33',
        //     confirmButtonText: 'Yes, delete it!'
        // }).then((result: any) => {
        //     if (result.isConfirmed) {
        //         toast.success('Role deleted successfully');
        //     }
        // })
        
    }

    const handleCloseDeleteRoleModal = () => {
        setShowDeleteRoleModal(false);
    }
    
    const columns = [
        { header: "Id", accessorKey: "id", enableColumnFilter: false, enableSorting: true },
        { header: "Name", accessorKey: "name", enableColumnFilter: false, enableSorting: true },
        { header: "Status", accessorKey: "status", enableColumnFilter: false, enableSorting: true,
            cell: (props: any) => {
                return (
                    <span className={`badge bg-light-${props.row.original.status === 'Active' ? 'success' : 'danger'}`}>{props.row.original.status}</span>
                )
            }
         },
        { header: "Action", accessorKey: "action",enableColumnFilter: false, enableSorting: false,
            cell: (props: any) => {
                return (
                    <div className='d-flex gap-2'>
                        
                        <Link href={`/controlhub/roles/permissions/${props.row.original.id}`} className='btn btn-sm btn-outline-primary'>View Permissions</Link>

                        <Link href={`/controlhub/roles/permissions/edit/${props.row.original.id}`} className='btn btn-sm btn-outline-danger'>Edit Permissions</Link>

                        <Button size='sm' variant="outline-primary" onClick={() =>handleShowEditRoleModal(props.row.original.id)}>Edit Role</Button>
                        <Button size='sm' variant="outline-danger" onClick={() =>handleShowDeleteRoleModal(props.row.original.id)}>Delete Role</Button>
                    </div>
                )
            }
         },
        
    ];

    const data = [
        {
            id: 1,
            name: 'Abc   1',
            status: "Active",
        },
        {
            id: 2,
            name: 'Abc Role 2',
            status: "Inactive",
        },
        {
            id: 3,
            name: 'Abc Role 3',
            status: "Active",
        },
        {
            id: 4,
            name: 'Abc Role 4',
            status: "Active",
        },
        {
            id: 5,
            name: 'Abc Role 5',
            status: "Active",
        }
    ];
   
    return (
            <React.Fragment>

                {showDeleteRoleModal && (
                    <Modal show={showDeleteRoleModal} onHide={handleCloseDeleteRoleModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Delete Role</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p>Role Name: {data.find(item => item.id === selectedRoleId)?.name}</p>
                            <p>Are you sure you want to delete this role?</p>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={handleCloseDeleteRoleModal}>Close</Button>
                            <Button variant="outline-danger" onClick={handleCloseDeleteRoleModal}>Delete</Button>
                        </Modal.Footer>
                    </Modal>
                )}


                {showEditRoleModal && (
                    <Modal show={showEditRoleModal} onHide={handleCloseEditRoleModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Role</Modal.Title>
                        </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                                <Form.Label>Role Name</Form.Label>
                                <Form.Control type="text" placeholder="Enter Role Name" />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={handleCloseEditRoleModal}>
                            Close
                        </Button>
                        <Button variant="outline-primary" onClick={handleCloseEditRoleModal}>
                            Save changes
                        </Button>
                    </Modal.Footer>
                </Modal>
                )}
                <Row>
                    <Col md={12}>
                        <Card>
                            
                            <Card.Body className="table-border-style">
                                <div id="pc-dt-export">
                                    <TableContainer
                                        columns={columns || []}
                                        data={data || []}
                                        isGlobalFilter={true}
                                        isBordered={false}
                                        customPageSize={10}
                                        isPagination={true}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </React.Fragment>
    );
};
export default RolesSourceData;