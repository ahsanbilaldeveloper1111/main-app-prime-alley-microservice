import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { changeThemeLayout, changeThemeMode, changeThemePreset } from '../../toolkit/thunk';
import { changeLayoutTheme, changeSidebarTheme, changeSidebarThemeCaptions } from '../../toolkit/themeLayouts/thunk';
import RightCustomizer from '../RightCustomizer';
import { createSelector } from "reselect";
import Header from '../Moduler/Header';
import TopBar from '../Moduler/Topbar';
// import Moduler from '../Moduler';

interface LayoutProps {
  children: ReactNode;
  themeMode: any;
  changeThemeMode: any ;
  handleOffcanvasToggle: () => void;
  toogleSidebarHide: () => void;
  toogleMobileSidebarHide: () => void;
}

const Moduler = ({ children}: LayoutProps) => {

  const toogleSidebarHide = () => {
    const sidebar = document.querySelector('.pc-sidebar .pc-menu-overlay');
    const sidebarHideId = document.getElementById("pc-sidebar-hide");

    if (sidebarHideId) {
      sidebarHideId.classList.toggle("pc-sidebar-hide");
    }
  };
  const toogleMobileSidebarHide = () => {
    const sidebarHideId = document.getElementById("pc-sidebar-hide") as HTMLDivElement | null;
    const existingOverlay = document.querySelector('.pc-menu-overlay');

    // If overlay already exists, remove it and close sidebar
    if (existingOverlay) {
      existingOverlay.remove();
      if (sidebarHideId) {
        sidebarHideId.classList.remove("mob-sidebar-active");
      }
      return;
    }

    // If no overlay exists, create one and open sidebar
    if (sidebarHideId) {
      sidebarHideId.classList.add("mob-sidebar-active");
    }

    // Create a new overlay element
    const newElement = document.createElement('div');
    newElement.className = 'pc-menu-overlay';

    // Insert the new element after the .navbar-wrapper
    const navbarWrapper = document.querySelector('.navbar-wrapper') as Element | null;
    if (navbarWrapper) {
      navbarWrapper.insertAdjacentElement('afterend', newElement);
    }

    // Add an event listener to close the sidebar when the overlay is clicked
    newElement.addEventListener('click', function () {
      console.log("Overlay clicked - closing sidebar");
      const navbar = document.querySelector('.pc-sidebar');
      if (navbar) {
        navbar.classList.remove("mob-sidebar-active");
        newElement.remove();
      }
      
    });
  };


  const dispatch = useDispatch<any>();

  const selectLayoutProperties = createSelector(
    (state: any) => state.Theme,
    (layout) => ({
      themeMode: layout.themeMode,
      layoutTheme: layout.layoutTheme,
      themePreset: layout.themePreset,
      themeLayout: layout.themeLayout,
      sidebarTheme: layout.sidebarTheme,
      sidebarThemeCaptions: layout.sidebarThemeCaptions,
    })
  );
  // Inside your component
  const {
    themeMode,
    themePreset,
    layoutTheme,
    themeLayout,
    sidebarTheme,
    sidebarThemeCaptions,
  } = useSelector(selectLayoutProperties);

  /*
    layout settings
    */
  useEffect(() => {
    if (
      themeMode ||
      layoutTheme ||
      themePreset ||
      themeLayout ||
      sidebarTheme ||
      sidebarThemeCaptions
    ) {
      dispatch(changeThemeMode(themeMode));
      dispatch(changeLayoutTheme(layoutTheme));
      dispatch(changeThemePreset(themePreset));
      dispatch(changeThemeLayout(themeLayout));
      dispatch(changeSidebarTheme(sidebarTheme));
      dispatch(changeSidebarThemeCaptions(sidebarThemeCaptions));
    }
  }, [
    themeMode,
    layoutTheme,
    themePreset,
    themeLayout,
    sidebarTheme,
    sidebarThemeCaptions,
    dispatch
  ]);

  const [isLayoutWidth, setLayoutWidth] = useState(false);

  const handleChangeLayoutWidth = (value: boolean) => {
    setLayoutWidth(value);
  };
  const getLayoutWidth = isLayoutWidth ? "container" : "";
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  // console.log(isLanding);

  const handleOffcanvasToggle = () => {
    setShowOffcanvas(!showOffcanvas);
  };
  // console.log(isLanding);

  return (
    <>
      <>
        <Header themeMode={themeMode} />
        <TopBar
          handleOffcanvasToggle={handleOffcanvasToggle}
          toogleSidebarHide={toogleSidebarHide}
          toogleMobileSidebarHide={toogleMobileSidebarHide}
          themeMode={themeMode}
          changeThemeMode={changeThemeMode}
        />
        <div className="pc-container">
          <div className={"pc-content " + getLayoutWidth}>
            {children}
          </div>
        </div>
        
        <RightCustomizer
          showOffcanvas={showOffcanvas}
          handleOffcanvasToggle={handleOffcanvasToggle}
          themeMode={themeMode}
          changeThemeMode={changeThemeMode}
          themePreset={themePreset}
          changeThemePreset={changeThemePreset}
          themeLayout={themeLayout}
          changeThemeLayout={changeThemeLayout}
          isLayoutWidth={isLayoutWidth}
          handleChangeLayoutWidth={handleChangeLayoutWidth}
          sidebarTheme={sidebarTheme}
          changeSidebarTheme={changeSidebarTheme}
          sidebarThemeCaptions={sidebarThemeCaptions}
          changeSidebarThemeCaptions={changeSidebarThemeCaptions}
        />
      </>
    </>
  );
};
export default Moduler
