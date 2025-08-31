import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Tab, Table, Tabs } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

import { getUserById, assignRoleToUser,assignGroupToUser, updateUserStatus,getUserPermissions,UpdateExtendedPermission,UpdateBlockedPermission,getParentUsers,linkUsers,unlinkUsers,GetCustomFields, AddCustomFields,UpdateCustomFields,DeleteCustomFields } from '@utils/users'
import { getAllRoles } from '@utils/roles'
import { getAllGroups } from '@utils/groups'

import { useRouter } from 'next/router'
import moment from 'moment';
import { selectRowsFn } from '@tanstack/react-table'
import Select from 'react-select';
import '@assets/scss/tabs.scss'

import imgStatus1 from '@assets/images/user/avatar-2.jpg'


interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    ou: string;
    department: string;
    company: string;
    last_synced_at: string;
    role_id: string;
    role: {
        name: string;
    };
    group_id: string;
    group: {
        name: string;
    };
    status: string;
    extended_permissions: string[];
    blocked_permissions: string[];
    role_excluded_permissions: string[];
}

// Define Permission Interface
interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface Role {
    id: number;
    name: string;
    company?: string;
}

interface Group {
    id: number;
    name: string;
}

// Add type for react-select option
interface SelectOption {
    value: number;
    label: string;
}

const UserView = () => {

    const [isClearable, setIsClearable] = useState(true);
    const [isSearchable, setIsSearchable] = useState(true)

    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [linkedUsers, setLinkedUsers] = useState<User[]>([]);

    useEffect(() => {
        if (id) {
           fetchUser();
           fetchUserPermissions();
           fetchCustomFields();
        }
    }, [id]);

    const fetchUser = async () => {

        await fetchRoles();
        await fetchGroups();
        const getUser = await getUserById(id as string);
        setCurrentUser(getUser?.userData);
        setUpdatedGroup(getUser?.userData?.group_id);
        setUpdatedRole(getUser?.userData?.role_id);
        setUpdatedStatus(getUser?.userData?.status);
        setLinkedUsers(getUser?.linkedUsers);
       // console.log("View User", getUser);

    };

    const [customFields, setCustomFields] = useState<any[]>([]);

    const fetchCustomFields = async () => {
        const customFields = await GetCustomFields(id as string);
        console.log("Custom Fields", customFields);
        setCustomFields(customFields);
    }

    const [allPermission, setAllPermission] = useState<Permission[]>([]);
    const [extended, setExtended] = useState<number[]>([]);
    const [blocked, setBlocked] = useState<number[]>([]);
    const [rolePermission, setRolePermission] = useState<Permission[]>([]);

    const fetchUserPermissions = async () => {
        const userPermissions = await getUserPermissions(id as string);
        //console.log("User Permissions", userPermissions);
        if(userPermissions){
        setExtended(userPermissions?.extended_permissions?.map((p: any) => typeof p === 'string' ? parseInt(p) : p) || []);
        setBlocked(userPermissions?.blocked_permissions?.map((p: any) => typeof p === 'string' ? parseInt(p) : p) || []);
        setAllPermission(userPermissions?.role_excluded_permissions || []);
        setRolePermission(userPermissions?.rolePermissions || []);
        }
    }

    const [roles, setRoles] = useState<Role[]>([]);
    const [updatedRole, setUpdatedRole] = useState<string>('');

    const fetchRoles = async () => {
        const roles = await getAllRoles();
        //console.log("Roles", roles);
        setRoles(roles);
    };

    const [groups, setGroups] = useState<Group[]>([]);
    const [updatedGroup, setUpdatedGroup] = useState<string>('');

    const fetchGroups = async () => {
        const groups = await getAllGroups();
        setGroups(groups);
    };


    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const handleCloseResetPasswordModal = () => {
        setShowResetPasswordModal(false)
    }

    const handlePasswordChange = () => {
      Swal.fire({
            title: 'Are you sure?',
            text: 'Are you sure you want to reset the password for this user?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset it!'
        }).then((result: any) => {
            if (result.isConfirmed) {
                toast.success('Password reset successfully');
            }
        })
    }

    const [showChangeGroupModal, setShowChangeGroupModal] = useState(false)
    const handleCloseChangeGroupModal = () => {
        setShowChangeGroupModal(false)
    }
    const handleSubmitChangeGroup = async () => {
        const response = await assignGroupToUser(id as string, updatedGroup);
        if(response){
            setShowChangeGroupModal(false);
            fetchUser();
        }
    }

    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false)
    const handleCloseChangeRoleModal = () => {
        setShowChangeRoleModal(false)
    }
    const handleSubmitChangeRole = async () => {
        const assignRole = await assignRoleToUser(id as string, updatedRole);
        setShowChangeRoleModal(false)
        fetchUser();
    }

    const [updatedStatus, setUpdatedStatus] = useState<string>('');
    const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
    const handleCloseChangeStatusModal = () => {
        setShowChangeStatusModal(false)
    }

    const handleSubmitChangeStatus = async () => {
        const response = await updateUserStatus(id as string, updatedStatus);
        if(response){
            setShowChangeStatusModal(false);
            fetchUser();
        }
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermBlocked, setSearchTermBlocked] = useState('');
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value.toLowerCase());
    }

    const toggleExtendedPermission = (perm: number) => {
        setExtended((prev) => {
            const newState = prev.includes(perm)
                ? prev.filter((p) => p !== perm)
                : [...prev, perm];

            return newState;
        });
    }

    const updateExtendedPermissions = async () => {
        
        const response = await UpdateExtendedPermission(id as string, extended.map(p => p.toString()));
        if(response){
            fetchUserPermissions(); 
        }
    }


    const handleSearchChangeBlocked = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTermBlocked(event.target.value.toLowerCase());
    }

    // Toggle permission in blocked list
    const toggleBlockedPermission = (perm: number) => {
        setBlocked((prev) => {
            const newState = prev.includes(perm)
                ? prev.filter((p) => p !== perm)
                : [...prev, perm];

           // console.log("Updated state:", newState);
            return newState;
        });
    };
    const updateBlockedPermissions = async () => {
        const response = await UpdateBlockedPermission(id as string, blocked.map(p => p.toString()));
        if(response){
            fetchUserPermissions(); 
        }
    }

    const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false)
    const handleCloseAddCustomFieldModal = () => {
        setShowAddCustomFieldModal(false)
    }


    const [add_field_name, setAddFieldName] = useState('');
    const [add_field_value, setAddFieldValue] = useState('');
    const handleSubmitAddCustomField = async () => {
        const response = await AddCustomFields(id as string, add_field_name, add_field_value);
        if(response){
            fetchCustomFields();
            toast.success('Custom field added successfully');
            setShowAddCustomFieldModal(false)
        }
        
    }

    const handleDeleteCustomField = async (id: number) => {
        const response = await DeleteCustomFields(String(id));
        if(response){
            fetchCustomFields();
            toast.success('Custom field deleted successfully');
        }
      
    }

    const [showEditCustomFieldModal, setShowEditCustomFieldModal] = useState(false)
    const handleCloseEditCustomFieldModal = () => {
        setShowEditCustomFieldModal(false)
    }

    const [edit_field_name, setEditFieldName] = useState('');
    const [edit_field_value, setEditFieldValue] = useState('');
    const [edit_field_id, setEditFieldId] = useState('');
    const handleSubmitEditCustomField = async () => {
        const response = await UpdateCustomFields(edit_field_id, edit_field_name, edit_field_value);
        if(response){
            fetchCustomFields();
            toast.success('Custom field edited successfully');
            setShowEditCustomFieldModal(false)
        }
    }

    const handleEditCustomField = (field: any) => {
        setEditFieldId(field.id);
        setEditFieldName(field.field_name);
        setEditFieldValue(field.field_value);
        setShowEditCustomFieldModal(true)
    }

    const [showAddLinkedUserModal, setShowAddLinkedUserModal] = useState(false)
    const handleCloseAddLinkedUserModal = () => {
        setShowAddLinkedUserModal(false)
    }

    const [selectedParentUser, setSelectedParentUser] = useState<string>("");
    const handleLinkedUserChange = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            setSelectedParentUser(selectedOption.value.toString());
            //console.log("Selected Parent User:", selectedOption.value);
        } else {
            setSelectedParentUser("");
        }
    };

    const handleSubmitAddLinkedUser = async () => {
        const response = await linkUsers(id as string, selectedParentUser);
        if(response){
            setShowAddLinkedUserModal(false);
            fetchUser();
        }
    }

    const [showEditLinkedUserModal, setShowEditLinkedUserModal] = useState(false)
    const handleEditLinkedUser = (id: number) => {
        setShowEditLinkedUserModal(true)
    }

    const handleCloseEditLinkedUserModal = () => {
        setShowEditLinkedUserModal(false)
    }

    const handleSubmitEditLinkedUser = () => {
        toast.success('Linked user edited successfully');
    }

    const handleDeleteLinkedUser = async (delinkedUser: number) => {
        const response = await unlinkUsers(id as string, delinkedUser+"");
        if(response){
            fetchUser();
        }
    }

    const [parentUsers, setParentUsers] = useState<User[]>([]);
    useEffect(() => {
        fetchParentUsers();
    }, [id]);

    const fetchParentUsers = async () => {
        const response = await getParentUsers();
        if(response){
            setParentUsers(response);
        }
    };

    return (
        <React.Fragment>
                 
                 {showChangeGroupModal && (
                    <Modal show={showChangeGroupModal} onHide={handleCloseChangeGroupModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Change Group</Modal.Title>
                        </Modal.Header>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="group">Group</label>
                            <select className="form-control" id="group" 
                            onChange={(e) => {
                                setUpdatedGroup(e.target.value)
                            }}>
                                <option value="">Select Group</option>
                                {groups.map((group) => (
                                    <option 
                                    key={group.id} 
                                    selected={currentUser?.group_id === group.id.toString()}
                                    value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseChangeGroupModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmitChangeGroup}>
                            Change Group
                        </Button>
                    </Modal.Footer>
                </Modal>
                )}


                {showChangeRoleModal && (
                    <Modal show={showChangeRoleModal} onHide={handleCloseChangeRoleModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Change Rank</Modal.Title>
                        </Modal.Header>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                           
                           
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable={true}
                                isSearchable={true}
                                onChange={(selectedOption: any) => {
                                    setUpdatedRole(selectedOption ? selectedOption.value.toString() : '')
                                }}
                                value={roles.find(role => role.id.toString() === updatedRole) ? {
                                    value: updatedRole,
                                    label: session?.user?.is_admin === "1" 
                                        ? `${roles.find(role => role.id.toString() === updatedRole)?.name}`
                                        : roles.find(role => role.id.toString() === updatedRole)?.name
                                } : null}
                                options={roles.map((role) => ({
                                    value: role.id,
                                    label: session?.user?.is_admin === "1" 
                                        ? `${role.name} ${role.company && role.company !== 'null' ? '('+role.company+')' : ''}`
                                        : role.name
                                }))}
                                placeholder="Select Rank"
                            />

                            
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseChangeRoleModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmitChangeRole}>
                            Change Rank
                        </Button>
                    </Modal.Footer>
                </Modal>
                )}


                {showChangeStatusModal && (
                    <Modal show={showChangeStatusModal} onHide={handleCloseChangeStatusModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Change Status</Modal.Title>
                        </Modal.Header>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select className="form-control" id="status"
                            onChange={(e) => {
                                setUpdatedStatus(e.target.value)
                            }}>
                                <option value="">Select Status</option>
                                <option value="Active" selected={currentUser?.status === "Active"}>Active</option>
                                <option value="Inactive" selected={currentUser?.status === "Inactive"}>Inactive</option>
                            </select>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseChangeStatusModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmitChangeStatus}>
                            Change Status
                        </Button>
                    </Modal.Footer>
                </Modal>
                )}

            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
            {/* <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title d-flex justify-content-between">
                        <h4 className="mb-0">
                            <span className="text-muted me-2">
                                Details for:
                            </span>

                            <span className="text-info text-capitalize">
                                {session?.user?.name}
                            </span>
                        </h4>
                    </div>
                </Col>
            </Row> */}

            <Row>
                <Col md={12}>
                    <Tabs
                        defaultActiveKey="overview"
                        id="system-tabs"
                        className="mb-3 tab-style-two"
                    
                    >
                        <Tab eventKey="overview" title="Overview">
                            <Row>
                                <Col md={5}>
                                    <Card>
                                        <Card.Body className="overview-card">
                                            <Row className="align-items-center">
                                                <Col md={3}>
                                                    <div className="user-avatar">
                                                        <div className="text">
                                                        <i className="material-icons-two-tone">person</i>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={9}>
                                                    <h4 className="text-white mb-1 text-capitalize">{currentUser?.name}</h4>


                                                    <p className="text-white mb-0 text-opacity">Email</p>
                                                    <p className="text-white mb-2">{currentUser?.email}</p>

                                                   <hr className="theme-hr" />

                                                    <p className="text-white mb-0 text-opacity">Company</p>
                                                    <p className="text-white mb-2">
                                                    {currentUser?.company && currentUser?.company !== 'N/A' ? currentUser?.company : 'N/A'}    
                                                    </p>

                                                    

                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={7}>
                                    <Card className="no-shadow">
                                        <Card.Body>
                                           <Row>
                                            <Col md={6}>

                                            <p className="mb-0  small text-primary"><b>Last Synced</b></p>
                                            <p className="mb-2 text-capitalize">{currentUser?.last_synced_at ? moment(currentUser?.last_synced_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}</p>

                                            
                                            {session?.user?.permissions?.includes('show-ou-users')  && (
                                            <div>
                                            <p className="mb-0  small text-primary"><b>OU</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.ou && currentUser?.ou !== 'N/A' ? currentUser?.ou : 'N/A'}
                                            </p>
                                            </div>
                                            )}

                                           

                                                <p className="mb-0  small text-primary"><b>Department</b></p>
                                                <p className="mb-0 text-capitalize">
                                                    {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-0  small text-primary"><b>Status</b></p>
                                                <p className="mb-2 text-capitalize  d-flex justify-content-between">
                                                    {currentUser?.status}
                                                    <span>
                                                    <i className="ti ti-edit" style={{cursor: 'pointer'}}></i>
                                                    </span>
                                                    </p>

                                                <p className="mb-0  small text-primary"><b>Rank</b></p>
                                                <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.role?.name || 'Rank not assigned'}
                                                    <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeRoleModal(true)
                                                      }} style={{cursor: 'pointer'}}></i>
                                                    </span>
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Group</b></p>
                                                <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.group?.name || 'Group not assigned'}
                                                    <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeGroupModal(true)
                                                      }} style={{cursor: 'pointer'}}></i>
                                                    </span>
                                                </p>

                                            </Col>
                                           </Row>
                                           </Card.Body>
                                    </Card>
                                </Col>
                            </Row>


                            <Row>
                                <Col md={12}>
                                    <Card>

                                        <Card.Header>
                                            <h5 >Recent Activities</h5>
                                        </Card.Header>
                                        <Card.Body >
                                            
                                            <Row className="recent-activity">
                                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                                    <div className="ico">
                                                    <i className="ti ti-history"></i>
                                                    </div>
                                                </Col>
                                                <Col md={10} className="d-flex align-items-center">
                                                    <div className="info">
                                                    <h6>Login to platform</h6>
                                                    <p className="mb-2 small">
                                                        <span className=""><b>Date: </b> </span>
                                                        <span className="text-muted me-4">23 Aug 2024</span>

                                                        <span className=""><b>Time: </b> </span>
                                                        <span className="text-muted me-4">12:00:00</span>

                                                        <span className=""><b>Device: </b> </span>
                                                        <span className="text-muted me-4">MacBook Pro</span>

                                                        <span className=""><b>Browser: </b> </span>
                                                        <span className="text-muted me-4">Chrome</span>


                                                    </p>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                                <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                                </Col>
                                            </Row>

                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>
                        <Tab eventKey="permissions" title="Permissions">
                        <Row>
                {session?.user?.is_admin && session?.user?.permissions?.includes('extend-permission-users') && (
                    <>
                <Col md={6}>
                    <Card>
                        <Card.Header className="p-3 bg-primary text-white">
                        <Row className="d-flex justify-content-between align-items-center">
                                    <Col md={6}>
                                        <h5 className="text-white">
                                            Extended Permissions
                                        </h5>
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="text"
                                            className="form-control mb-1"
                                            placeholder="Search permissions..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                        />
                                    </Col>
                                </Row>
                        </Card.Header>
                        <Card.Body>
                              <div className="permissions-box">
                                   
                                          <div className="mb-2">

                                          <ul className="viewUser-list-group list-group">
                                          {allPermission && allPermission.length > 0 ? (
                                                allPermission
                                                      .filter((perm) => perm && perm.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                      .map((perm) => (
                                                          <li key={perm.id} className="list-group-item">
                                                              <input
                                                                  type="checkbox"
                                                                  checked={extended.includes((perm.id))}
                                                                  onChange={() => toggleExtendedPermission(perm.id)}
                                                              />{" "}
                                                              {perm.name}
                                                          </li>
                                                      ))
                                          ) : (
                                                <li className="list-group-item">No permissions available</li>
                                          )}
                                          </ul>

                                          </div>

                                     <div className="d-flex justify-content-end">
                                    <Button size="sm" variant="outline-primary" onClick={updateExtendedPermissions}>Update Extended Permissions</Button>
                                     </div>
                              </div>
                        </Card.Body>
                    </Card>
                </Col>
                </>
                )}
                
                {session?.user?.is_admin && session?.user?.permissions?.includes('block-permission-users') && (
                    <>

                <Col md={6}>
                    <Card>

                        <Card.Header className="p-3 bg-danger text-white">
                        <Row className="d-flex justify-content-between align-items-center">
                                    <Col md={6}>
                                        <h5 className="text-white">
                                            Blocked Permissions
                                        </h5>
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="text"
                                            className="form-control mb-1"
                                            placeholder="Search permissions..."
                                            value={searchTermBlocked}
                                            onChange={handleSearchChangeBlocked}
                                        />
                                    </Col>
                                </Row>
                        </Card.Header>
                        <Card.Body>
                              <div className="permissions-box">
                                         <div className="mb-2">
                                         <ul className="viewUser-list-group list-group">
                                                {rolePermission && rolePermission.length > 0 ? (
                                                      rolePermission
                                                            .filter((perm) => perm.name && perm.name.toLowerCase().includes(searchTermBlocked.toLowerCase()))
                                                            .map((perm) => (
                                                                <li key={perm.id} className="list-group-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={blocked.includes(perm.id)}
                                                                        onChange={() => toggleBlockedPermission(perm.id)}
                                                                    />{" "}
                                                                    {perm.name}
                                                                </li>
                                                            ))
                                                ) : (
                                                      <li className="list-group-item">No permissions available</li>
                                                )}
                                          </ul>
                                         </div>

                                    <div className="d-flex justify-content-end">
                                    <Button size="sm" variant="outline-danger" onClick={updateBlockedPermissions}>Update Blocked Permissions</Button>
                                    </div>
                              </div>
                        </Card.Body>
                    </Card>
                </Col>
                </>
                )}
            </Row>
                        </Tab>


                        <Tab eventKey="linked-users" title="Linked Users">
                        {session?.user?.is_admin && session?.user?.permissions?.includes('link-users') && (
            <Row>

                 <Col md={12}>

                    {showAddLinkedUserModal && (
                        <Modal show={showAddLinkedUserModal} onHide={handleCloseAddLinkedUserModal}>
                            <Modal.Header closeButton>
                                <Modal.Title>Add Linked User</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              <div className="form-group">
                                <label htmlFor="linkedUser">Select User</label>

                                <Select
        className="basic-single"
        classNamePrefix="select"
        isLoading={isLoading}
        isClearable={isClearable}
        isSearchable={isSearchable}
        onChange={handleLinkedUserChange}
        name="color"
        options={parentUsers
            .filter((user) => !linkedUsers.some(linkedUser => linkedUser.id === user.id))
            .map((user) => ({
          value: user.id,
          label: `${user.name} (${user.email})`
        }))}
      />

                            {/* <select className="form-control" id="linkedUser" onChange={handleLinkedUserChange}>
                                    <option value="">Select User</option>
                                  {parentUsers && parentUsers.length > 0 ? (
                                    parentUsers.filter((user) =>
                                        user.id !== Number(id) &&
                                        !linkedUsers.some(linkedUser => linkedUser.id === user.id)
                                    ).map((user) => (
                                      <option key={`link_user_${user.id}`} value={user.id}>{user.name} ({user.email})</option>
                                    ))
                                  ) : (
                                    <option value="">No parent users available</option>
                                  )} 
                                </select> */}
                              </div>
                            </Modal.Body>
                            <Modal.Footer>
                              <Button variant="secondary" onClick={handleCloseAddLinkedUserModal}>
                                Close
                              </Button>
                              <Button variant="primary" onClick={handleSubmitAddLinkedUser}>
                                Add Linked User
                              </Button>
                            </Modal.Footer>
                        </Modal>
                    )}

                    {showEditLinkedUserModal && (
                        <Modal show={showEditLinkedUserModal} onHide={handleCloseEditLinkedUserModal}>
                            <Modal.Header closeButton>
                                <Modal.Title>Edit Linked User</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              <div className="form-group">
                                <label htmlFor="linkedUser">Select User</label>
                                <select className="form-control" id="linkedUser">
                                  <option value="1">User 1</option>
                                  <option value="2">User 2</option>
                                </select>
                              </div>
                            </Modal.Body>
                            <Modal.Footer>
                              <Button variant="secondary" onClick={handleCloseEditLinkedUserModal}>
                                Close
                              </Button>
                              <Button variant="primary" onClick={handleSubmitEditLinkedUser}>
                                Edit Linked User
                              </Button>
                              
                            </Modal.Footer>
                        </Modal>
                    )}
                    <Card>
                        <Card.Body>
                            <h5 className="d-flex justify-content-between">
                              Linked Users 
                              <Button variant="primary" onClick={() => {
                                setShowAddLinkedUserModal(true)
                              }}>Add Linked User</Button>
                            </h5>

                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Phone</th>
                                  <th>Department</th>
                                  <th>Company</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {linkedUsers && linkedUsers.length > 0 ? (
                                  linkedUsers.map((user) => (
                                    <tr>
                                          <td>{user.name}</td>
                                          <td>{user.email}</td>
                                          <td>{user.phone}</td>
                                          <td>{user.department}</td>
                                          <td>{user.company}</td>
                                          <td>
                                                <div className="d-flex gap-2 justify-content-end">
                                                      {/* <Button size="sm" variant="primary" onClick={() => {
                                                        handleEditLinkedUser(1)
                                                      }}>Edit</Button> */}
                                                      {session?.user?.is_admin && session?.user?.permissions?.includes('unlink-users') && (
                                                        <Button size="sm" variant="danger" onClick={() => {
                                                          handleDeleteLinkedUser(user.id)
                                                        }}>DeLink</Button>
                                                      )}
                                                </div>
                                          </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="text-center">No linked users found</td>
                                  </tr>
                                )}

                              </tbody>
                            </table>

                        </Card.Body>
                    </Card>
                 </Col>
                 </Row>
                
)}
                        </Tab>



                        <Tab eventKey="custom-fields-users" title="Custom Fields">
                        {session?.user?.is_admin && session?.user?.permissions?.includes('custom-field-users') && (
            <Row>
                {showAddCustomFieldModal && (   
                    <Modal show={showAddCustomFieldModal} onHide={handleCloseAddCustomFieldModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add Custom Field</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="form-group mb-3">
                                <label htmlFor="customFieldName" className="form-label">Field Name</label>
                                <input type="text" className="form-control" id="customFieldName"  onChange={(e) => setAddFieldName(e.target.value)} />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="customFieldValue" className="form-label">Field Value</label>
                                <input type="text" className="form-control" id="customFieldValue"  onChange={(e) => setAddFieldValue(e.target.value)} />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseAddCustomFieldModal}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={handleSubmitAddCustomField}>
                                Add Custom Field
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}


{showEditCustomFieldModal && (   
                    <Modal show={showEditCustomFieldModal} onHide={handleCloseEditCustomFieldModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Custom Field</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <input type="hidden" className="form-control" id="customFieldId"
                                value={edit_field_id}
                                onChange={(e) => setEditFieldId(e.target.value)} />

                            <div className="form-group mb-3">
                                <label htmlFor="customFieldName" className="form-label">Field Name</label>
                                <input type="text" className="form-control" id="customFieldName"
                                value={edit_field_name}
                                onChange={(e) => setEditFieldName(e.target.value)} />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="customFieldValue" className="form-label">Field Value</label>
                                <input type="text" className="form-control" id="customFieldValue"
                                value={edit_field_value}
                                onChange={(e) => setEditFieldValue(e.target.value)} />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseEditCustomFieldModal}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={handleSubmitEditCustomField}>
                                Edit Custom Field
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}

                 <Col md={12}>
                    <Card>
                        <Card.Body>
                            <h5 className="d-flex justify-content-between">
                              Custom Fields 
                              {session?.user?.permissions?.includes('add-custom-field-users') && (
                                <Button size="sm" variant="outline-primary" onClick={() => {
                                  setShowAddCustomFieldModal(true)
                                }}>Add Custom Field</Button>
                              )}
                            </h5>

                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Field Name</th>
                                  <th>Field Value</th>
                                  <th className="text-end">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customFields && customFields.length > 0 ? (
                                  customFields.map((field) => (
                                    <tr>
                                      <td>{field.field_name}</td>
                                      <td>{field.field_value}</td>
                                      <td>
                                        <div className="d-flex gap-2 justify-content-end">
                                          
                                          {session?.user?.permissions?.includes('delete-custom-field-users') && (
                                            <Button size="sm" variant="outline-danger" onClick={() => {
                                              handleDeleteCustomField(field.id)
                                            }}>Delete</Button>
                                          )}
                                          
                                          {session?.user?.permissions?.includes('edit-custom-field-users') && (
                                            <Button size="sm" variant="outline-primary" onClick={() => {
                                              handleEditCustomField(field)
                                            }}>Edit</Button>
                                          )}
                                        
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="text-center">No custom fields found</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                           

                        </Card.Body>
                    </Card>
                 </Col>
                 </Row>
                
)}
                        </Tab>


                    </Tabs>

                    

                </Col>
            </Row>
        </React.Fragment>
    )
}
UserView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default UserView
