/**
 * Example: Automated Calls from Any Page
 * 
 * This shows how to use the dialNumber function to trigger calls
 * from any page where phone numbers are displayed (e.g., CRM leads, deals, contacts)
 */

import React from 'react';
import { useCti } from './CtiContext';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { usePermissions } from '../utils/permissionUtils';

// Example 1: Simple call button in a table row
export const CallButtonInTable: React.FC<{ phoneNumber: string }> = ({ phoneNumber }) => {
  const { dialNumber, isInitialized } = useCti();
  const { hasPermission } = usePermissions();
  const [isCalling, setIsCalling] = React.useState(false);
  
  const handleCall = async () => {
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to make calls');
      return;
    }
    
    if (!isInitialized) {
      toast.error('CTI not initialized. Please wait...');
      return;
    }
    
    if (!phoneNumber) {
      toast.error('Phone number is required');
      return;
    }
    
    setIsCalling(true);
    try {
      const result = await dialNumber(phoneNumber);
      
      if (result.success) {
        toast.success(`Calling ${phoneNumber}...`);
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
    }
  };
  
  return (
    <Button
      variant="link"
      size="sm"
      onClick={handleCall}
      disabled={!isInitialized || isCalling || !hasPermission('dial-call-cti')}
      title={`Call ${phoneNumber}`}
    >
      <i className="material-icons-two-tone" style={{ fontSize: '18px', color: '#0d6efd' }}>
        phone
      </i>
      {isCalling ? 'Calling...' : 'Call'}
    </Button>
  );
};

// Example 2: Call button in a card/contact view
export const CallButtonInCard: React.FC<{ 
  phoneNumber: string;
  contactName?: string;
}> = ({ phoneNumber, contactName }) => {
  const { dialNumber, isInitialized, hasActiveCalls, getActiveCallForNumber } = useCti();
  const { hasPermission } = usePermissions();
  const [isCalling, setIsCalling] = React.useState(false);
  
  const activeCall = getActiveCallForNumber(phoneNumber);
  const isInCall = activeCall && ['connected', 'ringing', 'dialing'].includes(activeCall.status);
  
  const handleCall = async () => {
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to make calls');
      return;
    }
    
    if (!isInitialized) {
      toast.error('CTI not initialized. Please wait...');
      return;
    }
    
    if (isInCall) {
      toast.info(`Already in a call with ${phoneNumber}`);
      return;
    }
    
    setIsCalling(true);
    try {
      const result = await dialNumber(phoneNumber);
      
      if (result.success) {
        toast.success(`Calling ${contactName || phoneNumber}...`);
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
    }
  };
  
  return (
    <Button
      variant={isInCall ? "success" : "primary"}
      onClick={handleCall}
      disabled={!isInitialized || isCalling || !hasPermission('dial-call-cti')}
      className="w-100"
    >
      <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>
        {isInCall ? 'call' : 'phone'}
      </i>
      {isCalling ? 'Calling...' : isInCall ? 'In Call' : `Call ${contactName || phoneNumber}`}
    </Button>
  );
};

// Example 3: Click-to-call from any phone number display
export const ClickToCallLink: React.FC<{ 
  phoneNumber: string;
  className?: string;
}> = ({ phoneNumber, className }) => {
  const { dialNumber, isInitialized } = useCti();
  const { hasPermission } = usePermissions();
  const [isCalling, setIsCalling] = React.useState(false);
  
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to make calls');
      return;
    }
    
    if (!isInitialized) {
      toast.error('CTI not initialized. Please wait...');
      return;
    }
    
    setIsCalling(true);
    try {
      const result = await dialNumber(phoneNumber);
      
      if (result.success) {
        toast.success(`Calling ${phoneNumber}...`);
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
    }
  };
  
  return (
    <a
      href={`tel:${phoneNumber}`}
      onClick={handleClick}
      className={className}
      style={{ 
        cursor: 'pointer',
        textDecoration: 'none',
        color: isCalling ? '#999' : '#0d6efd'
      }}
      title={isCalling ? 'Calling...' : `Click to call ${phoneNumber}`}
    >
      {isCalling ? (
        <>
          <i className="material-icons-two-tone me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>
            phone_in_talk
          </i>
          Calling...
        </>
      ) : (
        <>
          <i className="material-icons-two-tone me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>
            phone
          </i>
          {phoneNumber}
        </>
      )}
    </a>
  );
};

// Example 4: Bulk call action (e.g., from a list)
export const BulkCallAction: React.FC<{ phoneNumbers: string[] }> = ({ phoneNumbers }) => {
  const { dialNumber, isInitialized } = useCti();
  const { hasPermission } = usePermissions();
  const [isCalling, setIsCalling] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  const handleBulkCall = async () => {
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to make calls');
      return;
    }
    
    if (!isInitialized) {
      toast.error('CTI not initialized. Please wait...');
      return;
    }
    
    if (phoneNumbers.length === 0) {
      toast.error('No phone numbers to call');
      return;
    }
    
    setIsCalling(true);
    setCurrentIndex(0);
    
    // Call first number
    try {
      const result = await dialNumber(phoneNumbers[0]);
      
      if (result.success) {
        toast.success(`Calling ${phoneNumbers[0]}...`);
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
    }
  };
  
  return (
    <Button
      variant="primary"
      onClick={handleBulkCall}
      disabled={!isInitialized || isCalling || !hasPermission('dial-call-cti') || phoneNumbers.length === 0}
    >
      <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>
        phone
      </i>
      {isCalling ? 'Calling...' : `Call First Number (${phoneNumbers.length} total)`}
    </Button>
  );
};

// Example 5: Integration in CRM Leads/Deals table
export const CrmTableRowWithCall: React.FC<{
  lead: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
}> = ({ lead }) => {
  const { dialNumber, isInitialized, getActiveCallForNumber } = useCti();
  const { hasPermission } = usePermissions();
  const [isCalling, setIsCalling] = React.useState(false);
  
  const activeCall = getActiveCallForNumber(lead.phone);
  const isInCall = activeCall && ['connected', 'ringing', 'dialing'].includes(activeCall.status);
  
  const handleCall = async () => {
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to make calls');
      return;
    }
    
    if (!isInitialized) {
      toast.error('CTI not initialized. Please wait...');
      return;
    }
    
    setIsCalling(true);
    try {
      const result = await dialNumber(lead.phone);
      
      if (result.success) {
        toast.success(`Calling ${lead.name} at ${lead.phone}...`);
      } else {
        toast.error(result.error || 'Failed to make call');
      }
    } catch (error) {
      toast.error('Failed to make call');
    } finally {
      setIsCalling(false);
    }
  };
  
  return (
    <tr>
      <td>{lead.name}</td>
      <td>
        <div className="d-flex align-items-center gap-2">
          <span>{lead.phone}</span>
          {isInCall && (
            <span className="badge bg-success">In Call</span>
          )}
        </div>
      </td>
      <td>{lead.email}</td>
      <td>
        <Button
          variant={isInCall ? "success" : "outline-primary"}
          size="sm"
          onClick={handleCall}
          disabled={!isInitialized || isCalling || !hasPermission('dial-call-cti')}
        >
          <i className="material-icons-two-tone me-1" style={{ fontSize: '16px', backgroundColor: '#fff' }}>
            {isInCall ? 'call' : 'phone'}
          </i>
          {isCalling ? 'Calling...' : isInCall ? 'In Call' : 'Call'}
        </Button>
      </td>
    </tr>
  );
};

