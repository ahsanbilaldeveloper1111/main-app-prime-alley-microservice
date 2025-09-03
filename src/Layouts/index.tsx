import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { changeThemeLayout, changeThemeMode, changeThemePreset } from '../toolkit/thunk';
import { changeLayoutTheme, changeSidebarTheme, changeSidebarThemeCaptions } from '../toolkit/themeLayouts/thunk';
import { createSelector } from "reselect";
import { useRouter } from 'next/router';
import { tmsSession } from '@utils/tmsSession';


import Moduler from './Moduler';

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();

	const toogleSidebarHide = () => {
		const sidebar = document.querySelector('.pc-sidebar .pc-menu-overlay');
		const sidebarHideId = document.getElementById("pc-sidebar-hide");

		if (sidebarHideId) {
			sidebarHideId.classList.toggle("pc-sidebar-hide");
		}
	};
	const toogleMobileSidebarHide = () => {
		const sidebarHideId = document.getElementById("pc-sidebar-hide") as HTMLDivElement | null;

		if (sidebarHideId) {
			sidebarHideId.classList.toggle("mob-sidebar-active");
		}

		// Create a new element
		const newElement = document.createElement('div');
		newElement.className = 'pc-menu-overlay'; // Set the desired class name

		// Insert the new element after the .navbar-wrapper
		const navbarWrapper = document.querySelector('.navbar-wrapper') as Element | null;
		if (navbarWrapper) {
			navbarWrapper.insertAdjacentElement('afterend', newElement);
		}

		// Add an event listener to remove the "mob-sidebar-active" class when the new element is clicked
		newElement.addEventListener('click', function () {
			if (sidebarHideId) {
				sidebarHideId.classList.remove("mob-sidebar-active");
				newElement.remove(); // Remove the new element when clicked
			}
		});
	};

	//	TMS route guard: block /tms routes unless tmsSession is valid (except /tms/login)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const path = router.pathname;
		const isTmsRoute = path.startsWith('/tms') && path !== '/tms/login';
		if (isTmsRoute) {
			if (!tmsSession.isValid()) {
				if (router.asPath !== '/tms/login') {
					router.replace('/tms/login');
				}
			}
		}
	}, [router.pathname]);


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

	// Prevent rendering protected TMS content while redirecting
	const isTmsRoute = router.pathname.startsWith('/tms') && router.pathname !== '/tms/login';
	if (isTmsRoute && !tmsSession.isValid()) {
		return null;
	}

	return (
		<>
				<Moduler
					children={children}
					handleOffcanvasToggle={handleOffcanvasToggle}
					toogleSidebarHide={toogleSidebarHide}
					toogleMobileSidebarHide={toogleMobileSidebarHide}
					themeMode={themeMode}
					changeThemeMode={changeThemeMode}
				/>
			</>
	);
};
export default Layout
