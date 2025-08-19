import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Tab, Table, Tabs } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

import { getUserById, assignRoleToUser,assignGroupToUser, updateUserStatus,getUserPermissions,UpdateExtendedPermission,UpdateBlockedPermission,getParentUsers,linkUsers,unlinkUsers } from '@utils/users'
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

const ProfileView = () => {

    const [isClearable, setIsClearable] = useState(true);
    const [isSearchable, setIsSearchable] = useState(true)

    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [linkedUsers, setLinkedUsers] = useState<User[]>([]);

    useEffect(() => {
        if (session) {
           fetchUser();
          // fetchUserPermissions();
        }
    }, [session]);

    const fetchUser = async () => {

        //await fetchRoles();
        //await fetchGroups();
        const getUser = await getUserById(session?.user?.id as string);
        setCurrentUser(getUser?.userData);
        setUpdatedGroup(getUser?.userData?.group_id);
        setUpdatedRole(getUser?.userData?.role_id);
        setUpdatedStatus(getUser?.userData?.status);
        setLinkedUsers(getUser?.linkedUsers);
       // console.log("View User", getUser);

    };

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

    const handleSubmitAddCustomField = () => {
        toast.success('Custom field added successfully');
        setShowAddCustomFieldModal(false)
    }

    const handleDeleteCustomField = (id: number) => {
      Swal.fire({
            title: 'Are you sure?',
            text: 'Are you sure you want to delete this custom field?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result: any) => {
            if (result.isConfirmed) {
                toast.success('Custom field deleted successfully');
            }
        })
    }

    const [showEditCustomFieldModal, setShowEditCustomFieldModal] = useState(false)
    const handleCloseEditCustomFieldModal = () => {
        setShowEditCustomFieldModal(false)
    }

    const handleSubmitEditCustomField = () => {
        toast.success('Custom field edited successfully');
        setShowEditCustomFieldModal(false)
    }

    const handleEditCustomField = (id: number) => {
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
                 
                
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
           

            <Row>
                <Col md={12}>
                    <Tabs
                        defaultActiveKey="profile"
                        id="system-tabs"
                        className="mb-3"
                    
                    >
                        <Tab eventKey="profile" title="Overview">
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

                                            

                                            <p className="mb-0  small text-primary"><b>Phone</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.phone && currentUser?.phone !== 'N/A' ? currentUser?.phone : 'N/A'}
                                            </p>
                                            
                                            <p className="mb-0  small text-primary"><b>OU</b></p>
                                            <p className="mb-2 text-capitalize">
                                                {currentUser?.ou && currentUser?.ou !== 'N/A' ? currentUser?.ou : 'N/A'}
                                            </p>

                                           

                                                <p className="mb-0  small text-primary"><b>Department</b></p>
                                                <p className="mb-0 text-capitalize">
                                                    {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-0  small text-primary"><b>Status</b></p>
                                                <p className="mb-2 text-capitalize  d-flex justify-content-between">
                                                    {currentUser?.status}
                                                    
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Rank</b></p>
                                                <p className="mb-2 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.role?.name || 'Rank not assigned'}
                                                </p>

                                                <p className="mb-0  small text-primary"><b>Group</b></p>
                                                <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                    {currentUser?.group?.name || 'Group not assigned'}
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

                        <Tab eventKey="update-profile" title="Update Profile">

                        </Tab>
                        
                        {/* <Tab eventKey="linked-users" title="Linked Users">
                        
                        </Tab> */}
                    </Tabs>
                </Col>
            </Row>
        </React.Fragment>
    )
}
ProfileView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default ProfileView
