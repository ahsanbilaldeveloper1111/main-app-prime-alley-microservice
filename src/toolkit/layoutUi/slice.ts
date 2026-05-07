import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface LayoutUiState {
  sidebarOpen: boolean;
  isSidebarExpanded: boolean;
  showNotificationsSidebar: boolean;
  showUserDropdown: boolean;
  showCreateDropdown: boolean;
  showIconsDropdown: boolean;
  searchQuery: string;
  showSearchSuggestions: boolean;
  showCreateLeadModal: boolean;
  showCreateCompanySidebar: boolean;
  showCreateTicketSidebar: boolean;
  showCreateTaskSidebar: boolean;
  showBreezeAssistant: boolean;
  breezeMaximized: boolean;
  headerLogoUrl: string | null;
  dialedNumber: string;
  dialerPosition: { top: number; right: number };
}

const initialState: LayoutUiState = {
  sidebarOpen: true,
  isSidebarExpanded: false,
  showNotificationsSidebar: false,
  showUserDropdown: false,
  showCreateDropdown: false,
  showIconsDropdown: false,
  searchQuery: "",
  showSearchSuggestions: false,
  showCreateLeadModal: false,
  showCreateCompanySidebar: false,
  showCreateTicketSidebar: false,
  showCreateTaskSidebar: false,
  showBreezeAssistant: false,
  breezeMaximized: false,
  headerLogoUrl: null,
  dialedNumber: "",
  dialerPosition: { top: 0, right: 0 },
};

const layoutUiSlice = createSlice({
  name: "layoutUi",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarExpanded(state) {
      state.isSidebarExpanded = !state.isSidebarExpanded;
    },
    setIsSidebarExpanded(state, action: PayloadAction<boolean>) {
      state.isSidebarExpanded = action.payload;
    },
    setShowNotificationsSidebar(state, action: PayloadAction<boolean>) {
      state.showNotificationsSidebar = action.payload;
    },
    setShowUserDropdown(state, action: PayloadAction<boolean>) {
      state.showUserDropdown = action.payload;
    },
    setShowCreateDropdown(state, action: PayloadAction<boolean>) {
      state.showCreateDropdown = action.payload;
    },
    setShowIconsDropdown(state, action: PayloadAction<boolean>) {
      state.showIconsDropdown = action.payload;
    },
    toggleShowIconsDropdown(state) {
      state.showIconsDropdown = !state.showIconsDropdown;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setShowSearchSuggestions(state, action: PayloadAction<boolean>) {
      state.showSearchSuggestions = action.payload;
    },
    clearSearchField(state) {
      state.showSearchSuggestions = false;
      state.searchQuery = "";
    },
    setShowCreateLeadModal(state, action: PayloadAction<boolean>) {
      state.showCreateLeadModal = action.payload;
    },
    setShowCreateCompanySidebar(state, action: PayloadAction<boolean>) {
      state.showCreateCompanySidebar = action.payload;
    },
    setShowCreateTicketSidebar(state, action: PayloadAction<boolean>) {
      state.showCreateTicketSidebar = action.payload;
    },
    setShowCreateTaskSidebar(state, action: PayloadAction<boolean>) {
      state.showCreateTaskSidebar = action.payload;
    },
    setShowBreezeAssistant(state, action: PayloadAction<boolean>) {
      state.showBreezeAssistant = action.payload;
    },
    openBreezeAssistant(state) {
      state.showBreezeAssistant = true;
      state.breezeMaximized = false;
    },
    toggleBreezeAssistant(state) {
      state.showBreezeAssistant = !state.showBreezeAssistant;
    },
    setBreezeMaximized(state, action: PayloadAction<boolean>) {
      state.breezeMaximized = action.payload;
    },
    setHeaderLogoUrl(state, action: PayloadAction<string | null>) {
      state.headerLogoUrl = action.payload;
    },
    setDialedNumber(state, action: PayloadAction<string>) {
      state.dialedNumber = action.payload;
    },
    appendDialedDigit(state, action: PayloadAction<string>) {
      state.dialedNumber += action.payload;
    },
    setDialerPosition(
      state,
      action: PayloadAction<{ top: number; right: number }>,
    ) {
      state.dialerPosition = action.payload;
    },
  },
});

export const {
  setSidebarOpen,
  toggleSidebarExpanded,
  setIsSidebarExpanded,
  setShowNotificationsSidebar,
  setShowUserDropdown,
  setShowCreateDropdown,
  setShowIconsDropdown,
  toggleShowIconsDropdown,
  setSearchQuery,
  setShowSearchSuggestions,
  clearSearchField,
  setShowCreateLeadModal,
  setShowCreateCompanySidebar,
  setShowCreateTicketSidebar,
  setShowCreateTaskSidebar,
  setShowBreezeAssistant,
  openBreezeAssistant,
  toggleBreezeAssistant,
  setBreezeMaximized,
  setHeaderLogoUrl,
  setDialedNumber,
  appendDialedDigit,
  setDialerPosition,
} = layoutUiSlice.actions;

export default layoutUiSlice.reducer;
