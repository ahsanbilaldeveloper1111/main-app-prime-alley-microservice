import React, { useState } from 'react';
import { X, ChevronDown, Minimize2 } from 'lucide-react';

interface WrapUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { wrapUp: string; variables: Record<string, string> }) => void;
  onMinimize?: () => void;
}

interface CallVariables {
  callVariable1: string;
  callVariable2: string;
  callVariable3: string;
  callVariable4: string;
}

const WrapUpModal: React.FC<WrapUpModalProps> = ({ isOpen, onClose, onSubmit, onMinimize }) => {
  const [selectedWrapUp, setSelectedWrapUp] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [callVariables, setCallVariables] = useState<CallVariables>({
    callVariable1: '',
    callVariable2: '',
    callVariable3: '',
    callVariable4: ''
  });

  const wrapUpOptions = [
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'language_barrier', label: 'Language Barrier' },
    { value: 'call_back', label: 'Call Back' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'busy', label: 'Busy' },
    { value: 'wrong_number', label: 'Wrong Number' },
    { value: 'do_not_call', label: 'Do Not Call' },
    { value: 'voicemail', label: 'Voicemail' },
    { value: 'successful', label: 'Successful' },
    { value: 'appointment_set', label: 'Appointment Set' }
  ];

  const handleVariableChange = (key: keyof CallVariables, value: string) => {
    setCallVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        wrapUp: selectedWrapUp,
        variables: { ...callVariables }
      });
    }
    // Reset form
    setSelectedWrapUp('');
    setCallVariables({
      callVariable1: '',
      callVariable2: '',
      callVariable3: '',
      callVariable4: ''
    });
    onClose();
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 480px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
        }

        .icon-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .required {
          color: #ef4444;
          margin-left: 4px;
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-select {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dropdown-select:hover {
          border-color: #cbd5e1;
        }

        .dropdown-select.active {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .dropdown-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: transform 0.2s;
        }

        .dropdown-icon.open {
          transform: translateY(-50%) rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          max-height: 240px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          animation: dropdownSlide 0.2s ease;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-option {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #475569;
        }

        .dropdown-option:hover {
          background: #f8fafc;
        }

        .dropdown-option.selected {
          background: #ede9fe;
          color: #7c3aed;
          font-weight: 600;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dropdown-option.selected .checkbox-custom {
          background: #7c3aed;
          border-color: #7c3aed;
        }

        .checkbox-check {
          width: 10px;
          height: 10px;
          background: white;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }

        .variables-section {
          margin-top: 24px;
        }

        .variables-header {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .variables-table-container {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          max-height: 240px;
          overflow-y: auto;
        }

        .variables-table {
          width: 100%;
          border-collapse: collapse;
        }

        .variables-table thead {
          background: #f8fafc;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .variables-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }

        .variables-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .variables-table tr:last-child td {
          border-bottom: none;
        }

        .variable-name {
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }

        .variable-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }

        .variable-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(6, 182, 212, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Scrollbar styling */
        .dropdown-menu::-webkit-scrollbar,
        .variables-table-container::-webkit-scrollbar,
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .dropdown-menu::-webkit-scrollbar-track,
        .variables-table-container::-webkit-scrollbar-track,
        .modal-body::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .dropdown-menu::-webkit-scrollbar-thumb,
        .variables-table-container::-webkit-scrollbar-thumb,
        .modal-body::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .dropdown-menu::-webkit-scrollbar-thumb:hover,
        .variables-table-container::-webkit-scrollbar-thumb:hover,
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Wrap Up</h2>
            <div className="modal-actions">
              <button className="icon-btn" onClick={handleMinimize} title="Minimize">
                <Minimize2 size={18} />
              </button>
              <button className="icon-btn" onClick={onClose} title="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="modal-body">
            {/* Wrap Up Selection */}
            <div className="form-group">
              <label className="form-label">
                Wrap Up <span className="required">*</span>
              </label>
              <div className="dropdown-container">
                <div
                  className={`dropdown-select ${isDropdownOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <span style={{ color: selectedWrapUp ? '#1e293b' : '#94a3b8' }}>
                    {selectedWrapUp
                      ? wrapUpOptions.find(opt => opt.value === selectedWrapUp)?.label
                      : 'Select wrap-up items...'}
                  </span>
                  <ChevronDown 
                    className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} 
                    size={20} 
                  />
                </div>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {wrapUpOptions.map(option => (
                      <div
                        key={option.value}
                        className={`dropdown-option ${selectedWrapUp === option.value ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWrapUp(option.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="checkbox-custom">
                          {selectedWrapUp === option.value && (
                            <div className="checkbox-check" />
                          )}
                        </div>
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Call Variables */}
            <div className="variables-section">
              <div className="variables-header">Call Variables</div>
              <div className="variables-table-container">
                <table className="variables-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(callVariables) as Array<keyof CallVariables>).map((key) => (
                      <tr key={key}>
                        <td>
                          <div className="variable-name">{key}</div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="variable-input"
                            value={callVariables[key]}
                            onChange={(e) => handleVariableChange(key, e.target.value)}
                            placeholder="Enter value..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleMinimize}>
              Minimize
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedWrapUp}
            >
              Submit Wrap Up
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WrapUpModal;

// Example usage (can be removed or kept for reference)
/*
const WrapUpExample = () => {
  const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleWrapUpSubmit = (data: { wrapUp: string; variables: Record<string, string> }) => {
    console.log('Wrap Up Data:', data);
    alert(`Wrap Up Submitted!\n\nStatus: ${data.wrapUp}\nVariables: ${JSON.stringify(data.variables, null, 2)}`);
    setIsWrapUpOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsWrapUpOpen(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginBottom: '24px' }}>Wrap Up Modal Example</h1>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => {
            setIsWrapUpOpen(true);
            setIsMinimized(false);
          }}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
          }}
        >
          Open Wrap Up Modal
        </button>

        {isMinimized && (
          <button
            onClick={() => {
              setIsWrapUpOpen(true);
              setIsMinimized(false);
            }}
            style={{
              padding: '12px 24px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
            }}
          >
            Restore Minimized Wrap Up
          </button>
        )}
      </div>

      <div style={{
        background: '#f8fafc',
        padding: '24px',
        borderRadius: '12px',
        border: '2px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '12px', color: '#1e293b' }}>Integration Instructions:</h3>
        <ol style={{ color: '#64748b', lineHeight: '1.8' }}>
          <li>Copy the <code>WrapUpModal</code> component</li>
          <li>Import it in your campaigns page</li>
          <li>Add state: <code>const [isWrapUpOpen, setIsWrapUpOpen] = useState(false)</code></li>
          <li>Add the component with props</li>
          <li>Open it when "Wrap Up" button is clicked</li>
        </ol>
      </div>

      <WrapUpModal
        isOpen={isWrapUpOpen}
        onClose={() => setIsWrapUpOpen(false)}
        onSubmit={handleWrapUpSubmit}
        onMinimize={handleMinimize}
      />
    </div>
  );
};
*/