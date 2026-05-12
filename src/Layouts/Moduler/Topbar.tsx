import { THEME_MODE } from "../../Common/layoutConfig";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Dropdown, Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import SimpleBar from "simplebar-react";

import avatar2 from "../../assets/images/user/avatar-2.jpg";
import { useSession } from "next-auth/react";
import { authAPI } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { FiArrowDown, FiChevronDown } from "react-icons/fi";
import router from "next/router";


interface HeaderProps {
    themeMode?: string; // Define the type for themeMode
    changeThemeMode?: any; // Define the type for changeThemeMode function
    toogleSidebarHide?: () => void;
    toogleMobileSidebarHide?: () => void;
     handleOffcanvasToggle?: () => void;
}

const TopBar = ({ handleOffcanvasToggle, changeThemeMode, toogleSidebarHide, toogleMobileSidebarHide }: HeaderProps) => {

    const { data: session, status } = useSession();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
          // Call logout API to invalidate tokens on backend
          await authAPI.logout();
          
          // Use the centralized logout function
          await logout();
        } catch (error) {
          console.error('Logout failed:', error);
          // Still try to logout even if API call fails
          await logout();
        }
      };

    
    const [loggedInName, setLoggedInName] = useState('');
    const [loggedInUserRole, setLoggedInUserRole] = useState('');
    const [loggedInUserUsername, setLoggedInUserUsername] = useState('');
    const [isMobileSidebarActive, setIsMobileSidebarActive] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isDialpadOpen, setIsDialpadOpen] = useState(false);
    
    useEffect(() => {
        if (status !=="loading" && session) {
          if (typeof window !== "undefined") {
            setLoggedInName(session.user.name || '');
            setLoggedInUserUsername(session.user.username || '');
            setLoggedInUserRole(session.user.role || '');
          }
        }
      }, [ status, session]);

    const dispatch = useDispatch<any>();
    // Function to handle theme mode change
    const handleThemeChange = (value: any) => {
        dispatch(changeThemeMode(value));
    };

    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setDropdownOpen(false);
    };


    const toggleSidebar = () => {
        //find sidebar element
        const sidebar = document.querySelector('.pc-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('pc-sidebar-hide');
        }
    };

    const handleMobileSidebarToggle = () => {
        setIsMobileSidebarActive(!isMobileSidebarActive);
        
        // Toggle mob-sidebar-active class on navbar
        const navbar = document.querySelector('.pc-sidebar');
        if (navbar) {
            navbar.classList.toggle('mob-sidebar-active');
        }
        
        // Call the original toggle function if it exists
        if (toogleMobileSidebarHide) {
            toogleMobileSidebarHide();
        }
    };

    // Dialpad functions

    const handleNumberClick = (number: string) => {
        setPhoneNumber(prev => prev + number);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow numbers and special dialpad characters: 0-9, +, *, #
        const dialpadRegex = /^[0-9+*#]*$/;
        if (dialpadRegex.test(value)) {
            setPhoneNumber(value);
        }
    };

    const handleClear = () => {
        setPhoneNumber('');
    };

    const handleBackspace = () => {
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    const handleCall = () => {
        if (phoneNumber.trim()) {
            // Here you can implement the actual call functionality
            console.log('Calling:', phoneNumber);
            // For now, just show an alert
            console.log('Calling:', phoneNumber);
            router.push(`/cti/dialer?dialedNumber=${phoneNumber}`);
            
            // Close the dropdown after initiating the call
            setIsDialpadOpen(false);
        }
       
    };

    return (
            <header className="pc-header">
                <div className="header-wrapper">
                    <div className="me-auto pc-mob-drp">
                        <ul className="list-unstyled">
                            <li className="pc-h-item pc-sidebar-collapse">
                                <button type="button" className="pc-head-link ms-0" id="sidebar-hide" onClick={toggleSidebar}>
                                    <i className="ti ti-menu-2"></i>
                                </button>
                            </li>
                            <li className="pc-h-item pc-sidebar-popup">
                                <Button variant="link" className="pc-head-link ms-0" id="mobile-collapse" onClick={handleMobileSidebarToggle}>
                                    <i className="ti ti-menu-2"></i>
                                </Button>
                            </li>
                            
                        </ul>
                    </div>

                    <div className="ms-auto">
                        <ul className="list-unstyled">

                            {/* <Dropdown as="li" className="pc-h-item">
                                <Dropdown.Toggle as="a" className="pc-head-link arrow-none me-0" data-bs-toggle="dropdown" href="#" role="button"
                                    aria-haspopup="false" aria-expanded="false">
                                    <i className="ph-duotone ph-sun-dim"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown">
                                    <Dropdown.Item onClick={() => handleThemeChange(THEME_MODE.DARK)}>
                                        <i className="ph-duotone ph-moon"></i>
                                        <span>Dark</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleThemeChange(THEME_MODE.LIGHT)}>
                                        <i className="ph-duotone ph-sun-dim"></i>
                                        <span>Light</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleThemeChange(THEME_MODE.DEFAULT)}>
                                        <i className="ph-duotone ph-cpu"></i>
                                        <span>Default</span>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown> */}

                    
                    <style>{`
                        .topbar-dialpad-container {
                            .app-button {
                                font-size: 1.5rem;
                                font-weight: 600;
                                text-align: center;
                                display: block;
                                transition: all 0.1s ease;
                                    padding: 10px !important;

                                    &.btn-primary {
                                        i{
                                            background-color: #fff;
                                        }
                                    }
                                    &:disabled {
                                        opacity: 0.5;
                                        cursor: not-allowed;
                                        i{
                                            background-color: #fff;
                                        }
                                    }
                            }
                            .app-button:hover {
                                transform: scale(1.05);
                                color: #fff;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                                i{
                                    background-color: #fff;
                                }
                            }
                        }
                    `}</style>

                   
                   {session?.user?.permissions?.includes('dial-call-cti') && (
                            <Dropdown as="li"  className="pc-h-item header-user-profile" show={isDialpadOpen} onToggle={setIsDialpadOpen}>
                                <Dropdown.Toggle  
                                    variant="secondary"
                                    className="pc-head-link arrow-none me-0" 
                                    href="#"
                                    aria-haspopup="false" 
                                    aria-expanded={isDialpadOpen} 
                                    style={{ border: "none" }}>
                                    <i className="material-icons-two-tone">dialpad</i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown" style={{ minWidth: '300px', padding: '15px' }}> 
                                    <div className="topbar-dialpad-container">
                                        {/* Phone number display */}
                                        <div className="mb-3">
                                            <input 
                                                type="text" 
                                                className="form-control text-center fs-4" 
                                                value={phoneNumber} 
                                                placeholder="Type number..."
                                                onChange={handleInputChange}
                                                style={{ fontSize: '18px', fontWeight: 'bold' }}
                                            />
                                        </div>
                                        
                                        {/* Dialpad buttons */}
                                        <div className="row g-2 mb-3">
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('1')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    1
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('2')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    2
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('3')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    3
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('4')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    4
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('5')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    5
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('6')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    6
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('7')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    7
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('8')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    8
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('9')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    9
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('*')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    *
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('0')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    0
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('#')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    #
                                                </button>
                                            </div>
                                            <div className="col-4">
                                                <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={() => handleNumberClick('+')}
                                                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="col-4">
                                            <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5"  
                                                    onClick={handleBackspace}
                                                    disabled={!phoneNumber.trim()}
                                                >
                                                    <i className="material-icons-two-tone">backspace</i>
                                                </button>
                                            </div>
                                            <div className="col-4">
                                            <button 
                                                    className="btn btn-outline-primary app-button w-100 py-3 fs-5" 
                                                    onClick={handleClear}
                                                    disabled={!phoneNumber.trim()}
                                                >
                                                    <i className="material-icons-two-tone">clear</i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        
                                        
                                        {/* Call button */}
                                        <div className="mt-3">
                                            <button 
                                                className="btn btn-primary app-button w-100 py-3 ps-5" 
                                                onClick={handleCall}
                                                disabled={!phoneNumber.trim()}
                                                style={{ fontSize: '18px', fontWeight: 'bold' }}
                                            >
                                                <i className="material-icons-two-tone me-2">call</i>Dial
                                               
                                            </button>
                                        </div>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                            )}
                          

                            <Dropdown as="li"  className="pc-h-item header-user-profile">
                                <Dropdown.Toggle  
                                    variant="secondary"
                                    className="pc-head-link arrow-none me-0" 
                                    data-bs-toggle="dropdown" 
                                    href="#"
                                    aria-haspopup="false" 
                                    data-bs-auto-close="outside" 
                                    aria-expanded="false" 
                                    style={{ border: "none" }}>
                                    <div className="text-capitalize d-flex align-items-center">
                                        <span className="user-avtar bg rounded-circle text-white" style={{ width: "30px", height: "30px", lineHeight: "30px", display: "inline-block", marginRight: "5px",backgroundColor: "#2c4661" }}>{loggedInName.split(' ')[0][0]}</span>
                                        {loggedInName}
                                        <FiChevronDown size={24}  />
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-user-profile dropdown-menu-end pc-h-dropdown">
                                   
                                    <div className="dropdown-body">
                                        <SimpleBar className="profile-notification-scroll position-relative" style={{ maxHeight: "calc(100vh - 225px)" }}>
                                            <ul className="list-group list-group-flush w-100">
                                                <li className="list-group-item">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0">
                                                            <Image src={avatar2} alt="user-image" width={50} className="wid-50 rounded-circle" />
                                                        </div>
                                                        <div className="flex-grow-1 mx-3">
                                                            <h5 className="mb-0 text-capitalize">{loggedInName}</h5>
                                                            <div className="link-primary" >
                                                                {loggedInUserRole !== '' ? (
                                                                    <span className="status-badge primary mt-1 small">{loggedInUserRole}</span>
                                                                ) : (
                                                                    <span className="status-badge primary mt-1 small">{loggedInUserUsername}</span>
                                                                )}


                                                                </div>
                                                        </div>
                                                        {/* <span className="badge bg-primary">PRO</span> */}
                                                    </div>
                                                </li>
                                                <li className="list-group-item">
                                                    
                                                    {/* <Link href="/configuration" className="dropdown-item">
                                                        <span className="d-flex align-items-center">
                                                            <i className="ph-duotone ph-gear"></i>
                                                            <span>Configuration</span>
                                                        </span>
                                                    </Link> */}
                                                    
                                                    <Link href="/profile" className="dropdown-item">
                                                        <span className="d-flex align-items-center">
                                                            <i className="ph-duotone ph-users"></i>
                                                            <span>Profile</span>
                                                        </span>
                                                    </Link>

                                                    {/* {session?.user?.permissions?.includes('accounts-services') && (
                                                        <Link href="/accounts" className="dropdown-item">
                                                            <span className="d-flex align-items-center">
                                                                <i className="ph-duotone ph-users"></i>
                                                            <span>Accounts</span>
                                                        </span>
                                                    </Link>
                                                    )} */}


                                                    <Dropdown.Item onClick={handleLogout}>
                                                        <span className="d-flex align-items-center">
                                                            <i className="ph-duotone ph-power"></i>
                                                            <span>Logout</span>
                                                        </span>
                                                    </Dropdown.Item>
                                                </li>
                                            </ul>
                                        </SimpleBar>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </ul>
                    </div>
                </div>
            </header>
    );
};

export default TopBar;