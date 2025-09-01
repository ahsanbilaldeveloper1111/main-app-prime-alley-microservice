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

    
    const [loggedInUserName, setLoggedInUserName] = useState('');
    const [loggedInUserEmail, setLoggedInUserEmail] = useState('');
    const [isMobileSidebarActive, setIsMobileSidebarActive] = useState(false);
    
    useEffect(() => {
        if (status !=="loading" && session) {
          if (typeof window !== "undefined") {
            setLoggedInUserName(session.user.name || '');
            setLoggedInUserEmail(session.user.email || '');
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

    return (
        <React.Fragment>

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

                            <Dropdown as="li" className="pc-h-item">
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
                            </Dropdown>

                            <Dropdown as="li" className="pc-h-item header-user-profile">
                                <Dropdown.Toggle className="pc-head-link arrow-none me-0" data-bs-toggle="dropdown" href="#"
                                    aria-haspopup="false" data-bs-auto-close="outside" aria-expanded="false" style={{ border: "none" }}>
                                    <div className="text-capitalize d-flex align-items-center">
                                        <span className="user-avtar bg rounded-circle text-white" style={{ width: "30px", height: "30px", lineHeight: "30px", display: "inline-block", marginRight: "5px",backgroundColor: "#2c4661" }}>{loggedInUserName.split(' ')[0][0]}</span>
                                        
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
                                                            <h5 className="mb-0 text-capitalize">{loggedInUserName}</h5>
                                                            <div className="link-primary" >{loggedInUserEmail}</div>
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
        </React.Fragment>
    );
};

export default TopBar;