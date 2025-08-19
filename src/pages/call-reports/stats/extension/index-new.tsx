import React from 'react';
import CallReportsFactory from '@components/CallReportsFactory';

const CallStatsExtension = () => {
  return (
    <CallReportsFactory 
      reportType="stats" 
      groupingType="extension" 
    />
  );
};

export default CallStatsExtension; 