import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaExpand, FaCompress, FaPhone, FaPhoneSlash, FaBackspace, FaPause, FaExchangeAlt } from 'react-icons/fa';
import { MdCallMissed, MdCallMade, MdCallReceived } from 'react-icons/md';
import { MdCallMerge } from 'react-icons/md';
import PreDialAssessment from './PreDialAssessment';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
  backdrop-filter: blur(2px);

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div<{ isExpanded: boolean }>`
  background: white;
  border-radius: 8px;
  position: relative;
  width: ${props => props.isExpanded ? '80%' : '350px'};
  max-width: ${props => props.isExpanded ? '1000px' : '350px'};
  height: ${props => props.isExpanded ? '90vh' : 'auto'};
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: ${props => props.isExpanded ? 'expandIn' : 'contractIn'} 0.3s ease-out;

  @keyframes expandIn {
    from {
      width: 320px;
      max-width: 320px;
      opacity: 0.8;
    }
    to {
      width: 80%;
      max-width: 1000px;
      opacity: 1;
    }
  }

  @keyframes contractIn {
    from {
      width: 80%;
      max-width: 1000px;
      opacity: 0.8;
    }
    to {
      width: 320px;
      max-width: 320px;
      opacity: 1;
    }
  }
`;

const DialerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f1f1;
`;

const HeaderTitle = styled.h5`
  margin: 0;
  color: #495057;
  font-size: 1rem;
  font-weight: 500;
`;

const ButtonGroup = styled.div<{ isExpanded?: boolean }>`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 20px;
  margin-bottom: ${props => !props.isExpanded ? '20px' : '0'};
`;

const CallControlsBox = styled.div<{ isVisible: boolean }>`
  display: ${props => props.isVisible ? 'grid' : 'none'};
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  animation: slideUp 0.2s ease-out;
  width: 100%;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const IconButton = styled.button<{ variant?: 'close' | 'expand' | 'primary' }>`
  background: ${props => 
    props.variant === 'close' ? 'transparent' :
    props.variant === 'expand' ? 'transparent' :
    props.variant === 'primary' ? '#0d6efd' : 'transparent'
  };
  color: ${props => props.variant === 'primary' ? 'white' : '#6c757d'};
  border: none;
  border-radius: 4px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;

  &:hover {
    background: ${props => 
      props.variant === 'close' ? '#e9ecef' :
      props.variant === 'expand' ? '#dee2e6' :
      props.variant === 'primary' ? '#0b5ed7' : '#f8f9fa'
    };
  }
`;

const CompactDialer = styled.div<{ isExpanded: boolean; isCallActive?: boolean }>`
  padding: 0;
  width: ${props => props.isExpanded ? '320px' : '100%'};
  margin: ${props => props.isExpanded ? '0 auto' : '0'};
  max-height: ${props => !props.isExpanded && !props.isCallActive ? 'fit-content' : 'none'};
  overflow: ${props => !props.isExpanded && !props.isCallActive ? 'hidden' : 'visible'};
  ${props => props.isExpanded ? `
    grid-column: 2;
    background: white;
    border-radius: 8px;
    align-self: start;
  ` : ''}
`;

const DevicesSection = styled.div`
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  .devices-header {
    h6 {
      margin: 0;
      font-size: 13px;
      color: #6c757d;
      white-space: nowrap;
    }
  }

  select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    background: #f8f9fa;
    font-size: 0.9rem;
    color: #495057;
    appearance: none;
    
    &:focus {
      outline: none;
      border-color: #0d6efd;
      box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }
  }
`;

const NumberDisplay = styled.div`
  position: relative;
  margin: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NumberInput = styled.input`
  width: 100%;
  font-size: 1.2rem;
  text-align: left;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  outline: none;
  color: #495057;
  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    border-color: #0d6efd;
    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
  }
`;

const ClearButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6c757d;
  padding: 8px;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  min-width: 40px;

  &:hover {
    background: #e9ecef;
    color: #343a40;
    border-color: #dee2e6;
  }
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 15px 20px;
  padding-bottom: 15px;
`;

const KeypadButton = styled.button`
  padding: 15px;
  font-size: 1.1rem;
  border: none;
  border-radius: 4px;
  background: white;
  color: #495057;
  transition: all 0.2s;

  &:hover {
    background: #f1f3f5;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ExpandedContent = styled.div<{ isExpanded: boolean }>`
  display: ${props => props.isExpanded ? 'grid' : 'none'};
  grid-template-columns: 1fr 320px 1fr;
  gap: 15px;
  padding: 15px;
  animation: fadeIn 0.3s ease-out;
  height: calc(90vh - 60px); // Subtract header height
  overflow-y: auto;

  > *:first-child,
  > *:last-child {
    min-width: 250px;
    overflow-y: auto;
  }
`;

const CallList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CallIcon = styled.div<{ type: 'missed' | 'incoming' | 'outgoing' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => 
    props.type === 'missed' ? 'rgba(220, 53, 69, 0.1)' :
    props.type === 'incoming' ? 'rgba(40, 167, 69, 0.1)' :
    'rgba(13, 110, 253, 0.1)'
  };
  color: ${props => 
    props.type === 'missed' ? '#dc3545' :
    props.type === 'incoming' ? '#28a745' :
    '#0d6efd'
  };
  font-size: 16px;
`;

const CallItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: #f8f9fa;
  }

  .call-info {
    flex: 1;

    .number {
      font-size: 14px;
      color: #495057;
      margin-bottom: 2px;
    }

    .time {
      font-size: 12px;
      color: #6c757d;
    }
  }

  .call-status {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    
    &.missed {
      color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
    }
    
    &.success {
      color: #28a745;
      background: rgba(40, 167, 69, 0.1);
    }
  }
`;

const Section = styled.div<{ noScroll?: boolean }>`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
  overflow-y: ${props => props.noScroll ? 'hidden' : 'auto'};
  max-height: ${props => props.noScroll ? 'none' : 'calc(90vh - 90px)'};
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

interface DialerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DialerContent: React.FC = () => {
  const { number, setNumber, isCallActive, isExpanded, handleCall, handleEndCall, handleNumberClick } = React.useContext(DialerContext);
  const [selectedDevice, setSelectedDevice] = useState('default');
  
  return (
    <>
        <DevicesSection>
          <div className="devices-header">
            <h6>Select Device</h6>
          </div>
          <select 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="default">Default Device</option>
            <option value="headset">Headset</option>
            <option value="speaker">Speaker</option>
            <option value="bluetooth">Bluetooth Device</option>
          </select>
        </DevicesSection>
      <NumberDisplay>
        <NumberInput
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/[^\d*#]/g, ''))}
          placeholder="Enter Number"
          maxLength={15}
        />
        <ClearButton onClick={() => setNumber('')} title="Clear number">
          <FaBackspace />
        </ClearButton>
      </NumberDisplay>

      <Keypad>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(digit => (
          <KeypadButton
            key={digit}
            onClick={() => handleNumberClick(digit.toString())}
          >
            {digit}
          </KeypadButton>
        ))}
      </Keypad>

      <ButtonGroup isExpanded={isExpanded}>
        <IconButton 
          variant="primary" 
          onClick={isCallActive ? handleEndCall : handleCall}
          style={{ width: '50px', height: '50px', borderRadius: '25px' }}
        >
          {isCallActive ? <FaPhoneSlash /> : <FaPhone />}
        </IconButton>
      </ButtonGroup>

      {isCallActive && (
        <CallControlsBox isVisible={true}>
          <IconButton onClick={() => {}} title="Hold Call">
            <FaPause /> Hold
          </IconButton>
          <IconButton onClick={() => {}} title="Merge Calls">
            <MdCallMerge /> Merge
          </IconButton>
          <IconButton onClick={() => {}} title="Transfer Call">
            <FaExchangeAlt /> Transfer
          </IconButton>
          <IconButton variant="primary" onClick={handleEndCall} title="End Call">
            <FaPhoneSlash /> End
          </IconButton>
        </CallControlsBox>
      )}
    </>
  );
};

// Create a context to share dialer state
const DialerContext = React.createContext<{
  number: string;
  setNumber: (value: string) => void;
  isCallActive: boolean;
  isExpanded: boolean;
  handleCall: () => void;
  handleEndCall: () => void;
  handleNumberClick: (digit: string) => void;
}>({
  number: '',
  setNumber: () => {},
  isCallActive: false,
  isExpanded: false,
  handleCall: () => {},
  handleEndCall: () => {},
  handleNumberClick: () => {},
});

const DialerModal: React.FC<DialerModalProps> = ({ isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [number, setNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);

  const handleNumberClick = (digit: string) => {
    if (number.length < 15) {
      setNumber(prev => prev + digit);
    }
  };

  const handleCall = () => {
    if (number) {
      setIsCallActive(true);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setNumber('');
  };

  const handleClear = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const contextValue = {
    number,
    setNumber,
    isCallActive,
    isExpanded,
    handleCall,
    handleEndCall,
    handleNumberClick
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent isExpanded={isExpanded}>
        <DialerHeader>
          <HeaderTitle>{isExpanded ? 'Advanced Dialer' : 'Quick Dial'}</HeaderTitle>
          <ButtonGroup>
            <IconButton
              variant="expand"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <FaCompress /> : <FaExpand />}
            </IconButton>
            <IconButton variant="close" onClick={onClose}>
              <FaTimes />
            </IconButton>
          </ButtonGroup>
        </DialerHeader>

        <DialerContext.Provider value={contextValue}>
        {!isExpanded ? (
          <CompactDialer isExpanded={isExpanded} isCallActive={isCallActive}>
            <DialerContent />
          </CompactDialer>
        ) : (
          <ExpandedContent isExpanded={isExpanded}>
            <Section>
              <h6>Call Logs</h6>
              
              <CallList>
                <CallItem>
                  <CallIcon type="missed">
                    <MdCallMissed />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 123-4567</div>
                    <div className="time">Today, 2:30 PM</div>
                  </div>
                  <div className="call-status missed">Missed</div>
                </CallItem>
                <CallItem>
                  <CallIcon type="outgoing">
                    <MdCallMade />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 234-5678</div>
                    <div className="time">Today, 1:15 PM</div>
                  </div>
                  <div className="call-status success">2m 30s</div>
                </CallItem>
                <CallItem>
                  <CallIcon type="incoming">
                    <MdCallReceived />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 345-6789</div>
                    <div className="time">Today, 11:45 AM</div>
                  </div>
                  <div className="call-status success">1m 15s</div>
                </CallItem>
                <CallItem>
                  <CallIcon type="missed">
                    <MdCallMissed />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 456-7890</div>
                    <div className="time">Today, 10:30 AM</div>
                  </div>
                  <div className="call-status missed">Missed</div>
                </CallItem>
                <CallItem>
                  <CallIcon type="outgoing">
                    <MdCallMade />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 567-8901</div>
                    <div className="time">Yesterday, 4:20 PM</div>
                  </div>
                  <div className="call-status success">4m 45s</div>
                </CallItem>
                <CallItem>
                  <CallIcon type="incoming">
                    <MdCallReceived />
                  </CallIcon>
                  <div className="call-info">
                    <div className="number">+1 (555) 678-9012</div>
                    <div className="time">Yesterday, 2:15 PM</div>
                  </div>
                  <div className="call-status success">3m 20s</div>
                </CallItem>
              </CallList>
            </Section>
            
            <CompactDialer isExpanded={isExpanded} isCallActive={isCallActive}>
              <DialerContent />
            </CompactDialer>
            
            <Section noScroll>
              <PreDialAssessment />
            </Section>
          </ExpandedContent>
        )}
        </DialerContext.Provider>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DialerModal;