export const TONE_LABELS = {
  NONE: 'No Tone',
  LOCAL: 'Notify Me',
  REMOTE: 'Notify Agent',
  BOTH: 'Notify Both'
}

export const SECTION_ORDER = ['supervision', 'onCall', 'activeIdle', 'downOffline']

export const SECTION_CONFIG = {
  supervision: {
    title: 'Live Coaching',
    icon: 'Eye',
    color: '#ffc107',
    order: 0
  },
  onCall: {
    title: 'Live Calls',
    icon: 'Phone',
    color: '#dc3545',
    order: 1
  },
  activeIdle: {
    title: 'Available & Idle',
    icon: 'CheckCircle',
    color: '#28a745',
    order: 2
  },
  downOffline: {
    title: 'Offline',
    icon: 'AlertCircle',
    color: '#ef4444',
    order: 3
  }
}

export const CUSTOM_STYLES = `
  .btn:hover i {
    background-color: #fff;
  }
   /* .live-calls-wrapper,
.live-calls-wrapper * {
  font-size: 99% !important;
}*/
  .kebab-menu-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #6c757d;
    cursor: pointer;
    text-decoration: none;
  }
  .kebab-menu-button:hover {
    color: #495057;
  }
  .dropdown-menu {
    min-width: 200px;
  }
  .dropdown-header {
    font-weight: 600;
    color: #6c757d;
    padding: 0.5rem 1rem 0.25rem;
  }
  .dropdown-divider {
    margin: 0.25rem 0;
  }
  .call-details {
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 0.25rem;
    font-style: italic;
  }
  .call-status-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .device-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
  }
  .device-grid .d-flex {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .device-icon {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }
  .device-icon:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  .device-icon.active {
    background-color: #4caf5052 !important;
  }
  .device-icon.monitoring {
    border: 2px solid #ffc107 !important;
    box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
  }
  .device-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
  }
  .monitoring-indicator {
    position: absolute;
    bottom: 0.25rem;
    right: 0.25rem;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ffc107;
    animation: monitoring-pulse 2s infinite;
  }
  @keyframes monitoring-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(255, 193, 7, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
    }
  }
  .device-menu-dropdown {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    z-index: 10;
  }
  .device-kebab-button {
    background: none;
    border: none;
    font-size: 0.875rem;
    color: #6c757d;
    cursor: pointer;
    text-decoration: none;
    padding: 0.125rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }
  .device-kebab-button:hover {
    color: #495057;
    background-color: rgba(0, 0, 0, 0.1);
  }
  .device-kebab-button:focus {
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  .device-stop-btn {
    min-width: auto;
    height: 28px;
    padding: 0.25rem 0.5rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: 1px solid #dc3545;
    background-color: transparent;
    color: #dc3545;
    gap: 0.25rem;
  }
  .device-stop-btn:hover {
    background-color: #dc3545;
    color: white;
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
  }
  .device-stop-btn:focus {
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }
  .device-stop-label {
    font-size: 0.625rem;
    font-weight: 500;
    margin-left: 0.25rem;
    white-space: nowrap;
  }
  .monitoring-status {
    border-radius: 0.375rem;
    overflow: hidden;
  }
  .monitoring-status .alert-sm {
    padding: 0.5rem 0.75rem;
    margin: 0;
    border: 1px solid #ffc107;
    background-color: #fff3cd;
  }
  .monitoring-status .alert-sm .btn {
    border-radius: 0.25rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .monitoring-status .alert-sm .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .monitoring-status .material-icons-two-tone {
    color: #856404;
  }
  .monitoring-status small {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  
  /* Card styles */
  .card-wrapper {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius:10px;
  }
  
  .card-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* Simple slide animations */
  .card-wrapper.slide-up {
    animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .card-wrapper.slide-down {
    animation: slideDown 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  @keyframes slideUp {
    0% {
      transform: translateY(30px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    0% {
      transform: translateY(-30px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  
  .section-transition {
    position: relative;
    overflow: hidden;
  }
  
  .section-container {
    min-height: 150px;
    border: 2px dashed rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(248, 249, 250, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
  }
  
 
  
  .section-container:hover {
   
    
  }
  
  .section-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .section-container:hover::before {
    opacity: 0.3;
  }
  
  .section-container.has-content {
    border: none;
    background: transparent;
  }
  
  .empty-section-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
    color: #6c757d;
    font-style: italic;
    text-align: center;
    padding: 20px;
  }
  
  .empty-section-placeholder .material-icons-two-tone {
    font-size: 3rem;
    opacity: 0.3;
    margin-bottom: 1rem;
  }
  
  /* Section-specific styling */
  .section-container[data-section="supervision"] {
    border-color: rgba(255, 193, 7, 0.3);
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.02) 100%);
  }
  
  .section-container[data-section="onCall"] {
    border-color: rgba(220, 53, 69, 0.3);
    background: linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(220, 53, 69, 0.02) 100%);
  }
  
  .section-container[data-section="activeIdle"] {
    border-color: rgba(40, 167, 69, 0.3);
    background: linear-gradient(135deg, rgba(40, 167, 69, 0.05) 0%, rgba(40, 167, 69, 0.02) 100%);
  }
  
  .section-container[data-section="downOffline"] {
    border-color: rgba(108, 117, 125, 0.3);
    background: linear-gradient(135deg, rgba(108, 117, 125, 0.05) 0%, rgba(108, 117, 125, 0.02) 100%);
  }
  
  .dial-pad .btn {
    font-size: 1.5rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .dial-pad .btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  .call-status-indicator {
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .call-status-indicator .spinner-border {
    width: 1.5rem;
    height: 1.5rem;
  }
  .extensions-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: block;
   
    max-height: 330px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    background-color: #f8f9fa;
  }
  .extension-item {
    margin: 0;
    display: block;
    padding: 0;
    margin-bottom: 5px !important;
  }
  .extension-button {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    background-color: #fff;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .extension-button.online {
    border-color: #198754;
    color: #198754;
  }
  .extension-button.offline {
    border-color: #6c757d;
    color: #6c757d;
  }
  .extension-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .extension-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .extension-button:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  /* Call Status Color Styles */
  .call-status-calling {
    color: #d97706 !important;
  }
  
  .call-status-connected {
    color: #059669 !important;
  }
  
  .call-status-held {
    color: #2563eb !important;
  }
  
  .call-status-incoming {
    color: #dc2626 !important;
  }
  
  .call-status-outgoing {
    color: #d97706 !important;
  }
  
  .call-status-conference {
    color: #6f42c1 !important;
  }
  
  /* FLIP Animation Styles */
  .anim-moving {
    transition: transform 0.55s cubic-bezier(0.2, 0.9, 0.2, 1), opacity 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) !important;
    z-index: 9999 !important;
    box-shadow: 0 15px 40px rgba(0,0,0,0.35) !important;
    opacity: 1 !important;
    pointer-events: none !important;
    border-width:3px;
  }
  
  .status-glow {
    animation: statusGlow 0.6s ease-out;
  }
  
  @keyframes statusGlow {
    0% {
      box-shadow: 0 0 0 0 currentColor;
      border-color: #e5e7eb;
    }
    40% {
      box-shadow: 0 0 0 4px currentColor;
      border-color: currentColor;
    }
    100% {
      box-shadow: 0 0 0 0 currentColor;
      border-color: #e5e7eb;
    }
  }
  
  /* Card transition styles */
  .card-wrapper {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-wrapper.animating {
    transition: none !important;
  }
  
  /* Smooth section transitions */
  .section-container {
    transition: all 0.3s ease;
  }
  
  .section-container .row {
    transition: all 0.3s ease;
  }
    .device-icon-wrapper.position-relative.active.monitoring {
  display: none !important;
}
  
  /* Hide top bar and sidebar when in fullscreen */
  body.fullscreen-mode .navbar,
  body.fullscreen-mode nav.navbar,
  body.fullscreen-mode .navbar-expand-lg,
  :fullscreen .navbar,
  :fullscreen nav.navbar,
  :fullscreen .navbar-expand-lg {
    display: none !important;
  }
  
  body.fullscreen-mode .position-fixed.d-lg-none,
  :fullscreen .position-fixed.d-lg-none {
    display: none !important;
  }
  
  body.fullscreen-mode .sidebar-card,
  body.fullscreen-mode .sidebar-scrollbar,
  body.fullscreen-mode .sidebar-backdrop,
  body.fullscreen-mode [class*="AppSidebar"],
  body.fullscreen-mode [class*="ApplicationSidebar"],
  :fullscreen .sidebar-card,
  :fullscreen .sidebar-scrollbar,
  :fullscreen .sidebar-backdrop,
  :fullscreen [class*="AppSidebar"],
  :fullscreen [class*="ApplicationSidebar"] {
    display: none !important;
  }
  
  body.fullscreen-mode footer,
  body.fullscreen-mode [class*="Footer"],
  :fullscreen footer,
  :fullscreen [class*="Footer"] {
    display: none !important;
  }
  
  /* Adjust main content when fullscreen */
  body.fullscreen-mode .main-content-wrapper,
  :fullscreen .main-content-wrapper {
    margin-left: 0 !important;
    margin-top: 0 !important;
    width: 100% !important;
    padding: 0 !important;
  }
  
  body.fullscreen-mode .d-flex.flex-grow-1,
  :fullscreen .d-flex.flex-grow-1 {
    margin-top: 0 !important;
  }
    body.fullscreen-mode .pc-content,:fullscreen .pc-content {
    padding:15px;
    }
`

