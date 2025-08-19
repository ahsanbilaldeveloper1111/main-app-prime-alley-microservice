import React from 'react';
import CallReportsFactory from '@components/CallReportsFactory';

const CallTrendDepartment = () => {
  return (
    <CallReportsFactory 
      reportType="trend" 
      groupingType="department" 
    />
  );
};

export default CallTrendDepartment; 