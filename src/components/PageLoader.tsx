import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

interface PageLoaderProps {
  isLoading: boolean;
  message?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const PageLoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const PageLoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const PageLoadingSpinner = styled.div`
  font-size: 4rem;
  color: var(--primary-accent);
  animation: ${pulse} 2s infinite;
`;

const PageLoadingMessage = styled.div`
  margin-top: 1rem;
  font-size: 1.2rem;
  color: var(--text-secondary);
  text-align: center;
`;

const PageLoader: React.FC<PageLoaderProps> = ({ isLoading, message = "Loading..." }) => {
   if (!isLoading) return null;

  return (

    <div className="loader" style={{ display: 'flex',opacity: 1,zIndex: 99 }}>
      <div className="p-4 text-center">
        <div className="custom-loader"></div>
        <h2 className="my-3 f-w-400">Loading..</h2>
        <p className="mb-0">Retrieving information, just a moment</p>
      </div>
    </div>
  );
};

export default PageLoader;
