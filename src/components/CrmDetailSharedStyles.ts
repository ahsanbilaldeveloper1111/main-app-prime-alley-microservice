import React from "react";

export const sidebarContainerStyle: React.CSSProperties = {
  backgroundColor: "#f0f0f0",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  flexShrink: 0,
  overflowY: "auto",
};

export const sidebarCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #cccccc",
  borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
};

export const sectionHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const chevronTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

export const ghostActionButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "6px",
  cursor: "pointer",
  color: "#141414",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "3px",
  transition: "background-color 0.2s",
};

export const dropdownItemButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  backgroundColor: "transparent",
  border: "none",
  textAlign: "left",
  fontSize: "14px",
  color: "#141414",
  cursor: "pointer",
};

// Alias used by leads page
export const dropdownMenuItemStyle = dropdownItemButtonStyle;

export const quickActionCircleButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 7px",
  background: "#ffffff",
  border: "1px solid #8a8a8a",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  color: "#141414",
};

// Alias used by leads page
export const quickActionCircleButtonBaseStyle = quickActionCircleButtonStyle;

export const borderedPillButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  border: "1px solid #cbd5e0",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#141414",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

export const viewAllLinkStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#006162",
  textDecoration: "none",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

