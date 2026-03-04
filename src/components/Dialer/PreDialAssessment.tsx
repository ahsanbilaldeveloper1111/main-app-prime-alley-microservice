import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #343a40;
  font-size: 1.2rem;
`;

const AssessmentItem = styled.div`
  margin-bottom: 15px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
`;

const Question = styled.div`
  margin-bottom: 10px;
  font-weight: 500;
  color: #495057;
`;

const OptionsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Option = styled.button<{ selected?: boolean; variant: 'yes' | 'no' }>`
  flex: 1;
  padding: 8px;
  border: 1px solid ${props => props.selected ? (props.variant === 'yes' ? '#28a745' : '#dc3545') : '#ced4da'};
  background: ${props => props.selected ? (props.variant === 'yes' ? '#d4edda' : '#f8d7da') : 'white'};
  color: ${props => props.selected ? (props.variant === 'yes' ? '#28a745' : '#dc3545') : '#6c757d'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.variant === 'yes' ? '#d4edda' : '#f8d7da'};
  }
`;

const Notes = styled.textarea`
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  margin: 20px 0;
  overflow: hidden;
`;

const Progress = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: #0d6efd;
  transition: width 0.3s ease;
`;

const ResultSummary = styled.div`
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
  margin-top: 20px;
`;

interface AssessmentQuestion {
  id: string;
  question: string;
  answer: boolean | null;
  notes: string;
}

const PreDialAssessment: React.FC = () => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    {
      id: '1',
      question: 'Has the contact been verified?',
      answer: null,
      notes: ''
    },
    {
      id: '2',
      question: 'Is the contact available during business hours?',
      answer: null,
      notes: ''
    },
    {
      id: '3',
      question: 'Have previous contact attempts been made?',
      answer: null,
      notes: ''
    },
    {
      id: '4',
      question: 'Is there any DNC (Do Not Call) restriction?',
      answer: null,
      notes: ''
    }
  ]);

  const handleAnswer = (questionId: string, answer: boolean) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, answer }
          : q
      )
    );
  };

  const handleNotes = (questionId: string, notes: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, notes }
          : q
      )
    );
  };

  const calculateProgress = () => {
    const answered = questions.filter(q => q.answer !== null).length;
    return (answered / questions.length) * 100;
  };

  const isReadyToDial = () => {
    return questions.every(q => q.answer !== null) && 
           !questions.some(q => q.answer === false);
  };

  return (
    <Container>
      <h6>Pre-Dial Assessment</h6>
      
      <div className="blocked-status" style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <span style={{ 
              color: '#dc3545', 
              fontWeight: 500 
            }}>Blocked:</span>
            <span>Yes</span>
          </div>
          <button
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => {}}
          >
            Still Call
          </button>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6c757d'
        }}>
          This number is marked as blocked. Proceed with caution.
        </div>
      </div>

      <div className="block-history" style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <h6 style={{ margin: 0, fontSize: '13px', color: '#495057' }}>Block History</h6>
        </div>

        {[
          {
            date: '2024-03-15',
            time: '14:30',
            reason: 'Customer requested no calls',
            agent: 'John Smith'
          },
          {
            date: '2024-02-28',
            time: '11:20',
            reason: 'Wrong number reported',
            agent: 'Sarah Johnson'
          },
          {
            date: '2024-01-15',
            time: '09:45',
            reason: 'DNC list match',
            agent: 'System'
          }
        ].map((entry, index) => (
          <div key={index} style={{
            padding: '10px 0',
            borderTop: index === 0 ? 'none' : '1px solid #e9ecef'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '13px', color: '#495057' }}>
                {entry.date} {entry.time}
              </span>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>
                {entry.agent}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#dc3545' }}>
              {entry.reason}
            </div>
          </div>
        ))}
      </div>


     
    </Container>
  );
};

export default PreDialAssessment;
