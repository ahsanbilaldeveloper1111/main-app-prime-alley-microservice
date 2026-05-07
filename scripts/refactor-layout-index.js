const fs = require("fs");
const path = "src/Layouts/index.tsx";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  /\n  const formatPhoneNumber = \(number: string\): string => \{[\s\S]*?\n  \};\n\n/g,
  "\n",
);

s = s.replace(/\n  const dialpadButtons = \[[\s\S]*?\];\n\n/g, "\n");

const openStyle = "      <style>{`";
const i0 = s.indexOf(openStyle);
if (i0 < 0) throw new Error("style open");
const i1 = s.indexOf("      `}</style>", i0);
if (i1 < 0) throw new Error("style close");
const afterStyle = i1 + "      `}</style>".length;
s = s.slice(0, i0) + "      <LayoutGlobalStyles />" + s.slice(afterStyle);

const navOpen = "\n        {/* Top bar */}";
const j0 = s.indexOf(navOpen);
if (j0 < 0) throw new Error("nav open");
const j1 = s.indexOf("\n        </nav>", j0);
if (j1 < 0) throw new Error("nav close");
const afterNav = j1 + "\n        </nav>".length;

const topBar = `
        <LayoutTopBar
          isSidebarExpanded={isSidebarExpanded}
          searchWrapperRef={searchWrapperRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearchSuggestions={showSearchSuggestions}
          setShowSearchSuggestions={setShowSearchSuggestions}
          searchSuggestions={searchSuggestions}
          showCreateDropdown={showCreateDropdown}
          setShowCreateDropdown={setShowCreateDropdown}
          setShowCreateLeadModal={setShowCreateLeadModal}
          setShowCreateCompanySidebar={setShowCreateCompanySidebar}
          setShowCreateTicketSidebar={setShowCreateTicketSidebar}
          setShowCreateTaskSidebar={setShowCreateTaskSidebar}
          totalUnreadCount={totalUnreadCount}
          setShowNotificationsSidebar={setShowNotificationsSidebar}
          isInitialized={isInitialized}
          openDialer={openDialer}
          dialerButtonRef={dialerButtonRef}
          showIconsDropdown={showIconsDropdown}
          setShowIconsDropdown={setShowIconsDropdown}
          iconsDropdownRef={iconsDropdownRef}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          userDropdownRef={userDropdownRef}
          headerLogoUrl={headerLogoUrl}
          loggedInCompanyName={loggedInCompanyName}
          loggedInName={loggedInName}
          profileImageUrl={profileImageUrl}
          showBreezeAssistant={showBreezeAssistant}
          setShowBreezeAssistant={setShowBreezeAssistant}
        />`;

s = s.slice(0, j0) + topBar + s.slice(afterNav);

const k0 = s.indexOf(
  "\n        {/* Incoming call (attend/reject): primary UI for the transfer recipient / callee while the offer",
);
if (k0 < 0) throw new Error("incoming open");
const k2 = s.indexOf("\n        {/* Dialer Popup */}", k0);
if (k2 < 0) throw new Error("dialer comment after incoming");

const incomingReplace = `
        {/* Incoming call (attend/reject): primary UI for the transfer recipient / callee while the offer
            is pending. Transfer initiator keeps GlobalFloatingCallBar on their consult leg instead. */}
        {showIncomingCallModal && incomingCall && (
          <LayoutIncomingCallPanel
            callerName={incomingCallUserName}
            callerImageUrl={incomingCallUserImageUrl}
            callingAddress={incomingCall?.callingAddress ?? ""}
            onReject={handleRejectCall}
            onAttend={handleAttendCall}
            isDialing={isDialing}
          />
        )}`;

s = s.slice(0, k0) + incomingReplace + s.slice(k2);

const d0 = s.indexOf("\n        {/* Dialer Popup */}");
if (d0 < 0) throw new Error("dialer open");
const d2 = s.indexOf("\n        <DeviceSelectionModal", d0);
if (d2 < 0) throw new Error("device modal");

const dialerReplace = `
        {/* Dialer Popup */}
        {isDialerOpen && (
          <LayoutDialerPopup
            dialerPosition={dialerPosition}
            isDeviceRegistered={isDeviceRegistered}
            dialedNumber={dialedNumber}
            setDialedNumber={setDialedNumber}
            isDialing={isDialing}
            onDismiss={() => {
              closeDialer();
              setDialedNumber("");
            }}
            onDial={handleDial}
            onNumberClick={handleNumberClick}
          />
        )}`;

s = s.slice(0, d0) + dialerReplace + s.slice(d2);

fs.writeFileSync(path, s);
console.log("Layout index refactored OK");
