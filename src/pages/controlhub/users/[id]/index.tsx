import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Tab, Table, Tabs } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

import { getUserById, assignRoleToUser,assignGroupToUser, updateUserStatus,getUserPermissions,UpdateExtendedPermission,UpdateBlockedPermission,getParentUsers,linkUsers,unlinkUsers,GetCustomFields, AddCustomFields,UpdateCustomFields,DeleteCustomFields, GetModules,MarkAsCompanyAdmin } from '@utils/users'
import { getAllRoles } from '@utils/roles'
import { getAllGroups } from '@utils/groups'

import { useRouter } from 'next/router'
import moment from 'moment';
import { selectRowsFn } from '@tanstack/react-table'
import Select from 'react-select';
import '@assets/scss/tabs.scss'

import imgStatus1 from '@assets/images/user/avatar-2.jpg'
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import FormModal from "@pages/partial/FormModal";
import '@assets/scss/common.scss';
import SuccessfulModal from '@pages/partial/SuccessfulModal'



interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    ou: string;
    username: string;
    department: string;
    company: string;
    last_synced_at: string;
    role_id: string;
    is_company_admin: string;
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
    module_name?: string;
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

// Add type for react-select option
interface SelectOption {
    value: number;
    label: string;
}

interface Module {
    id: number;
    name: string;
    slug: string;
}



const UserView = () => {

    const [isClearable, setIsClearable] = useState(true);
    const [isSearchable, setIsSearchable] = useState(true)

    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [linkedUsers, setLinkedUsers] = useState<any[]>([]);

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
        console.log("Linked Users", getUser?.linkedUsers);
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

    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    const handleCloseSuccessfulModal = () => {
        setShowSuccessfulModal(false)
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
            setSuccessModalTitle('Group Changed');
            setSuccessModalDescription('The group has been changed successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            fetchUser();
        }
    }

    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false)
    const handleCloseChangeRoleModal = () => {
        setShowChangeRoleModal(false)
    }
    const handleSubmitChangeRole = async () => {
        const assignRole = await assignRoleToUser(id as string, updatedRole);
        if(assignRole){
        setShowChangeRoleModal(false);
        setSuccessModalTitle('Rank Changed');
            setSuccessModalDescription('The rank has been changed successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            fetchUser();
        }
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
            setSuccessModalTitle('Custom Field Added');
            setSuccessModalDescription('The custom field has been added successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
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
            setSuccessModalTitle('Custom Field Edited');
            setSuccessModalDescription('The custom field has been edited successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
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
    const [selectedModule, setSelectedModule] = useState<string>("");
    
    const handleLinkedUserChange = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            setSelectedParentUser(selectedOption.value.toString());
            //console.log("Selected Parent User:", selectedOption.value);
        } else {
            setSelectedParentUser("");
        }
    };

    const handleModuleChange = (selectedOption: any) => {
        if (selectedOption) {
            setSelectedModule(selectedOption.value);
        } else {
            setSelectedModule("");
        }
    };

    const [modules, setModules] = useState<Module[]>([]);
    const fetchModules = async () => {
        const response = await GetModules();
        console.log("Modules", response);
        if(response){
            setModules(response);
        }
    }
    useEffect(() => {
        fetchModules();
    }, []);

    // Filter modules based on user permissions
    const filteredModules = modules.filter(module => {
        return session?.user?.permissions?.includes(module.slug+'-services');
    });

    const handleSubmitAddLinkedUser = async () => {

        if(selectedParentUser === ""){
            toast.error('Please select a user to link');
            return;
        }

        if(selectedModule === ""){
            toast.error('Please select at least one module');
            return;
        }

        const response = await linkUsers(id as string, selectedParentUser, selectedModule);
        if(response){
            setShowAddLinkedUserModal(false);
            fetchUser();
            
            setSuccessModalTitle('Linked User Added');
            setSuccessModalDescription('The user has been linked successfully');
            setShowSuccessfulModal(true);
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

    const handleDeleteLinkedUser = async (delinkedUser: number, moduleId: number) => {
        const response = await unlinkUsers(id as string, delinkedUser+"", moduleId+"");
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

    const [showChangeCompanyAdminModal, setShowChangeCompanyAdminModal] = useState(false)
    const handleCloseChangeCompanyAdminModal = () => {
        setShowChangeCompanyAdminModal(false)
    }

    const [isCompanyAdmin, setIsCompanyAdmin] = useState<boolean>(false)

    const handleSubmitChangeCompanyAdmin = async () => {
        
        const response = await MarkAsCompanyAdmin(id as string, isCompanyAdmin);
        if(response){
            setShowChangeCompanyAdminModal(false);
            setSuccessModalTitle('Company Admin Changed');
            setSuccessModalDescription('The company admin has been changed successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            fetchUser();
        }
    }

    

    return (
        <React.Fragment>
               

                <FormModal
                        show={showChangeGroupModal}
                        onHide={handleCloseChangeGroupModal}
                        title="Change Group"
                        desc="Please select the group to change"
                        formHtml={
                            <>
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
                            </>
                        }
                        submitButtonText="Change Group"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitChangeGroup}
                        onCancel={handleCloseChangeGroupModal}
                    />


                <FormModal
                        show={showChangeRoleModal}
                        onHide={handleCloseChangeRoleModal}
                        title="Change Rank"
                        desc="Please select the rank to change"
                        formHtml={
                            <>
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
                            </>
                        }
                        submitButtonText="Change Rank"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitChangeRole}
                        onCancel={handleCloseChangeRoleModal}
                    />
                


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
                        className="mb-3"
                    
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


                                                    <p className="text-white mb-0 text-opacity">User Name</p>
                                                    <p className="text-white mb-2">{currentUser?.username}</p>

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

                                            {/* <p className="mb-0  small text-primary"><b>Last Synced</b></p>
                                            <p className="mb-2 text-capitalize">{currentUser?.last_synced_at ? formatDateTimeToLocal(currentUser?.last_synced_at, GlobalDateTimeFormat) : 'N/A'}</p> */}

                                            
                                            {/* {session?.user?.permissions?.includes('show-ou-users')  && (
                                            <div>
                                            <p className="mb-0  small text-primary"><b>OU</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.ou && currentUser?.ou !== 'N/A' ? currentUser?.ou : 'N/A'}
                                            </p>
                                            </div>
                                            )} */}

                                           

<p className="mb-0  small text-primary"><b>Status</b></p>
                                                <p className="mb-2 text-capitalize  d-flex justify-content-between">
                                                    {currentUser?.status}
                                                    <span>
                                                    {/* <i className="ti ti-edit" style={{cursor: 'pointer'}}></i> */}
                                                    </span>
                                                    </p>
                                                    
                                                <p className="mb-0  small text-primary"><b>Department</b></p>
                                                <p className="mb-2 text-capitalize">
                                                    {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Extension</b></p>
                                                <p className="mb-0 text-capitalize">
                                                    {currentUser?.phone && currentUser?.phone !== 'N/A' ? currentUser?.phone : 'N/A'}
                                                </p>




                                            </Col>
                                            <Col md={6}>
                                                

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
                                                <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.group?.name || 'Group not assigned'}
                                                    <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeGroupModal(true)
                                                      }} style={{cursor: 'pointer'}}></i>
                                                    </span>
                                                </p>


                                                {session?.user?.permissions?.includes('mark-company-admin-users') && (
                                                <div>
                                                    <p className="mb-0  small text-primary"><b>Company Admin</b></p>
                                                <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                      {currentUser?.is_company_admin === "1" ? "Yes" : "No"}
                                                    <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeCompanyAdminModal(true)
                                                      }} style={{cursor: 'pointer'}}></i>
                                                    </span>
                                                </p>
                                                </div>
                                                )}

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


                            <FormModal
                                show={showChangeCompanyAdminModal}
                                onHide={handleCloseChangeCompanyAdminModal}
                                title="Mark as Company Admin"
                                desc="Please select the company admin to change"
                                formHtml={
                                    <>
                                    <div className="form-group">
                                            <label htmlFor="companyAdmin">Mark as Company Admin</label>
                                            <select className="form-control" id="companyAdmin" 
                                            onChange={(e) => 
                                            setIsCompanyAdmin(e.target.value === "1")} 
                                            value={isCompanyAdmin ? "1" : "0"}>
                                                <option value="1" selected={isCompanyAdmin === true}>Yes</option>
                                                <option value="0" selected={isCompanyAdmin === false}>No</option>
                                            </select>
                                        </div>
                                        </>
                                }
                                submitButtonText="Mark as Company Admin"
                                cancelButtonText="Cancel"
                                onSubmit={handleSubmitChangeCompanyAdmin}
                                onCancel={handleCloseChangeCompanyAdminModal}
                            />
                        </Tab>







                        <Tab eventKey="permissions" title="Permissions">
                            <Tabs
                                defaultActiveKey="extended"
                                id="system-tabs"
                                className="mb-3 justify-content-center"
                            >
                {session?.user?.is_admin && session?.user?.permissions?.includes('extend-permission-users') && (
                                    <Tab eventKey="extended" title="Extended Permissions">
                                        <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header className="p-3 ">
                        <Row className="d-flex justify-content-between align-items-center ">
                                    <Col md={6}>
                                        <h5 className="text-capitalize app-title-heading text-primary">
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
                                          {allPermission && allPermission.length > 0 ? (
                                                                    (() => {
                                                                        // Group permissions by module_id
                                                                        const filteredPermissions = allPermission.filter((perm) => 
                                                                            perm && perm.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                                        );
                                                                        
                                                                        const groupedPermissions = filteredPermissions.reduce((groups, perm) => {
                                                                            const moduleId = perm.module_name || 'Other';
                                                                            if (!groups[moduleId]) {
                                                                                groups[moduleId] = [];
                                                                            }
                                                                            groups[moduleId].push(perm);
                                                                            return groups;
                                                                        }, {} as Record<string, any[]>);

                                                                        return Object.entries(groupedPermissions).map(([moduleId, permissions]) => (
                                                                            <div key={moduleId} className="mb-4">
                                                                                <h5 className="mb-3 text-primary border-bottom pb-2">
                                                                                    {moduleId === 'Other' ? 'Other Permissions' : `${moduleId}`}
                                                                                </h5>
                                                                                <Row className="g-3">
                                                                                    {permissions.map((perm) => (
                                                                                        <Col key={perm.id} md={6} lg={4} className="d-flex align-items-center justify-content-between">
                                                                                            <div className="form-check form-switch">
                                                                                                <input className="form-check-input" type="checkbox" id={`permission-${perm.id}`} checked={extended.includes(perm.id)} onChange={() => toggleExtendedPermission(perm.id)} />
                                                                                            </div>
                                                                                            <div className="flex-grow-1">
                                                                                                <h6 className="mb-1">{perm.name}</h6>
                                                                                            </div>
                                                                                        </Col>
                                                                                    ))}
                                                                                </Row>
                                                                            </div>
                                                                        ));
                                                                    })()
                                                                ) : (
                                                                    <Row>
                                                                        <Col md={12}>
                                                                            <Card>
                                                                                <Card.Body className="text-center text-muted">
                                                                                    No permissions available
                                                                                </Card.Body>
                                                                            </Card>
                                                                        </Col>
                                                                    </Row>
                                                                )}
                                          </div>

                                                            <div className="d-flex justify-content-end sticky-bottom bg-white p-3 border-top" style={{position: 'sticky', bottom: 0, zIndex: 10}}>
                                                                <Button variant="primary" className="app-button" onClick={updateExtendedPermissions}>Update Extended Permissions</Button>
                                     </div>
                              </div>
                        </Card.Body>
                    </Card>
                </Col>
                                        </Row>
                                    </Tab>
                )}
                
                {session?.user?.is_admin && session?.user?.permissions?.includes('block-permission-users') && (
                                    <Tab eventKey="blocked" title="Blocked Permissions">
                                        <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header className="p-3 ">
                        <Row className="d-flex justify-content-between align-items-center">
                                    <Col md={6}>
                                        <h5 className="text-capitalize app-title-heading text-danger">
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
                                                {rolePermission && rolePermission.length > 0 ? (
                                                                    (() => {
                                                                        // Group permissions by module_name
                                                                        const filteredPermissions = rolePermission.filter((perm) => 
                                                                            perm && perm.name && perm.name.toLowerCase().includes(searchTermBlocked.toLowerCase())
                                                                        );
                                                                        
                                                                        const groupedPermissions = filteredPermissions.reduce((groups, perm) => {
                                                                            const moduleId = perm.module_name || 'Other';
                                                                            if (!groups[moduleId]) {
                                                                                groups[moduleId] = [];
                                                                            }
                                                                            groups[moduleId].push(perm);
                                                                            return groups;
                                                                        }, {} as Record<string, any[]>);

                                                                        return Object.entries(groupedPermissions).map(([moduleId, permissions]) => (
                                                                            <div key={moduleId} className="mb-4">
                                                                                <h5 className="mb-3 text-danger border-bottom pb-2">
                                                                                    {moduleId === 'Other' ? 'Other Permissions' : `${moduleId}`}
                                                                                </h5>
                                                                                <Row className="g-3">
                                                                                    {permissions.map((perm) => (
                                                                                        <Col key={perm.id} md={6} lg={4} className="d-flex align-items-center justify-content-between">
                                                                                            <div className="form-check form-switch">
                                                                                                <input className="form-check-input" type="checkbox" id={`blocked-permission-${perm.id}`} checked={blocked.includes(perm.id)} onChange={() => toggleBlockedPermission(perm.id)} />
                                                                                            </div>
                                                                                            <div className="flex-grow-1">
                                                                                                <h6 className="mb-1">{perm.name}</h6>
                                                                                            </div>
                                                                                        </Col>
                                                                                    ))}
                                                                                </Row>
                                                                            </div>
                                                                        ));
                                                                    })()
                                                                ) : (
                                                                    <Row>
                                                                        <Col md={12}>
                                                                            <Card>
                                                                                <Card.Body className="text-center text-muted">
                                                                                    No permissions available
                                                                                </Card.Body>
                                                                            </Card>
                                                                        </Col>
                                                                    </Row>
                                                                )}
                                         </div>

                                                            <div className="d-flex justify-content-end sticky-bottom bg-white p-3 border-top" style={{position: 'sticky', bottom: 0, zIndex: 10}}>
                                    <Button variant="danger" className="app-button" onClick={updateBlockedPermissions}>Update Blocked Permissions</Button>
                                    </div>
                              </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
                                    </Tab>
                                )}
                            </Tabs>
                        </Tab>


                        <Tab eventKey="linked-users" title="Linked Users">
                        {session?.user?.is_admin && session?.user?.permissions?.includes('link-users') && (
            <Row>

                 <Col md={12}>

               
                    <FormModal
                         show={showAddLinkedUserModal}
                         onHide={handleCloseAddLinkedUserModal}
                         title="Add Linked User"
                         desc="Please select the user and module to add a linked user."
                         formHtml={
                            <>
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
                                    label: `${user.name} (${user.username})`
                                    }))}
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor="linkedUser">Select Module</label>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isLoading={isLoading}
                                    isClearable={isClearable}
                                    isSearchable={isSearchable}
                                    onChange={handleModuleChange}
                                    name="module"
                                    isMulti={false}
                                    options={filteredModules.map((module) => ({
                                        value: module.id.toString(),
                                        label: `${module.name}`
                                    }))}
                                    placeholder="Select Module"
                                />
                              </div>
                            </>
                         }
                         submitButtonText="Add Linked User"
                         cancelButtonText="Cancel"
                         onSubmit={handleSubmitAddLinkedUser}
                         onCancel={handleCloseAddLinkedUserModal}
                    />

    
        
      

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
                                  <th>Module</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {linkedUsers && linkedUsers.length > 0 ? (
                                  linkedUsers.map((obj) => (
                                   
                                    <tr key={obj.id}>
                                          <td>{obj?.linked_user?.name}</td>
                                          <td>{obj?.linked_user?.email}</td>
                                          <td>{obj?.linked_user?.phone}</td>
                                          <td>{obj?.linked_user?.department}</td>
                                          <td>{obj?.linked_user?.company}</td>
                                          <td>
                                            {obj?.module?.name}
                                          </td>
                                          <td>
                                                <div className="d-flex gap-2 justify-content-end">
                                                      {/* <Button size="sm" variant="primary" onClick={() => {
                                                        handleEditLinkedUser(1)
                                                      }}>Edit</Button> */}
                                                      {session?.user?.is_admin && session?.user?.permissions?.includes('unlink-users') && (
                                                        <Button size="sm" variant="danger" onClick={() => {
                                                          handleDeleteLinkedUser(obj?.linked_user?.id, obj?.module?.id)
                                                        }}>DeLink</Button>
                                                      )}
                                                </div>
                                          </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={7} className="text-center">No linked users found</td>
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
              

                <FormModal
                        show={showAddCustomFieldModal}
                        onHide={handleCloseAddCustomFieldModal}
                        title="Add Custom Field"
                        desc="Please fill in the details below to add a custom field."
                        formHtml={
                            <>
                            <div className="form-group mb-3">
                                <label htmlFor="customFieldName" className="form-label">Field Name</label>
                                <input type="text" className="form-control" id="customFieldName"  onChange={(e) => setAddFieldName(e.target.value)} />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="customFieldValue" className="form-label">Field Value</label>
                                <input type="text" className="form-control" id="customFieldValue"  onChange={(e) => setAddFieldValue(e.target.value)} />
                            </div>
                            </>
                        }
                        submitButtonText="Add Custom Field"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitAddCustomField}
                        onCancel={handleCloseAddCustomFieldModal}
                    />




                <FormModal
                        show={showEditCustomFieldModal}
                        onHide={handleCloseEditCustomFieldModal}
                        title="Edit Custom Field"
                        desc="Please fill in the details below to edit a custom field."
                        formHtml={
                            <>
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
                            </>
                        }
                        submitButtonText="Edit Custom Field"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitEditCustomField}
                        onCancel={handleCloseEditCustomFieldModal}
                    />

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

            <SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />
        </React.Fragment>
    )
}
UserView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default UserView
