import React from 'react';
import CallReportsFactory from '@components/CallReportsFactory';

const CallIncomingCountry = () => {
  return (
    <CallReportsFactory 
      reportType="incoming" 
      groupingType="country" 
    />
  );
};

export default CallIncomingCountry; 