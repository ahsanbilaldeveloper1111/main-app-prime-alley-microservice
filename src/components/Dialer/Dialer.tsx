import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaPhone, FaPhoneSlash, FaPause, FaArrowsAlt, FaExchangeAlt } from 'react-icons/fa';
import { MdCallMerge } from 'react-icons/md';
import PreDialAssessment from './PreDialAssessment';

// Types
interface CallLog {
  id: string;
  number: string;
  date: Date;
  duration: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

// Animations
const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.3s ease-out;
`;

const DialerContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const MainDialer = styled.div`
  flex: 2;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const NumberDisplay = styled.div`
  font-size: 2rem;
  text-align: center;
  padding: 15px;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const KeypadButton = styled.button`
  padding: 15px;
  font-size: 1.5rem;
  border: none;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover {
    background: #f1f3f5;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CallControls = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ControlButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: white;
  background: ${props => props.variant === 'danger' ? '#dc3545' : props.variant === 'primary' ? '#0d6efd' : '#6c757d'};
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CallLogSection = styled.div`
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  max-height: 500px;
  overflow-y: auto;
`;

const LeadFormSection = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
`;

const ExpandButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #e9ecef;
  transition: all 0.2s;

  &:hover {
    background: #dee2e6;
  }
`;

const Dialer: React.FC = () => {
  const [number, setNumber] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  const handleNumberClick = (digit: string) => {
    if (number.length < 15) {
      setNumber(prev => prev + digit);
    }
  };

  const handleCall = () => {
    if (number) {
      setIsCallActive(true);
      // Add to call logs
      const newLog: CallLog = {
        id: Date.now().toString(),
        number,
        date: new Date(),
        duration: '0:00',
        type: 'outgoing'
      };
      setCallLogs(prev => [newLog, ...prev]);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setNumber('');
  };

  const handleClear = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  return (
    <Container>
      <DialerContainer>
        {isExpanded && (
          <CallLogSection>
            <h6>Call Logs</h6>
            {callLogs.map(log => (
              <div key={log.id}>
                <p>{log.number}</p>
                <small>{new Date(log.date).toLocaleString()}</small>
              </div>
            ))}
          </CallLogSection>
        )}
        
        <MainDialer>
          <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
            <FaArrowsAlt />
          </ExpandButton>

        {isExpanded && (
          <div style={{ flex: 1, marginLeft: '20px' }}>
            <PreDialAssessment />
          </div>
        )}
          
          <NumberDisplay>{number || 'Enter Number'}</NumberDisplay>
          
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

          <CallControls>
            {isCallActive ? (
              <>
                <ControlButton variant="danger" onClick={handleEndCall}>
                  <FaPhoneSlash /> End
                </ControlButton>
                <ControlButton>
                  <MdCallMerge /> Merge
                </ControlButton>
                <ControlButton>
                  <FaPause /> Hold
                </ControlButton>
                <ControlButton>
                  <FaExchangeAlt /> Transfer
                </ControlButton>
              </>
            ) : (
              <ControlButton variant="primary" onClick={handleCall}>
                <FaPhone /> Dial
              </ControlButton>
            )}
          </CallControls>
        </MainDialer>
      </DialerContainer>

      <LeadFormSection>
        <h3>Lead Form</h3>
        {/* Lead form implementation will go here */}
      </LeadFormSection>
    </Container>
  );
};

export default Dialer;
