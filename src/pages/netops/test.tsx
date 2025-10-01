import React, { useState, useEffect } from 'react';
import { 
  getDevices, 
  getServices, 
  getAlerts, 
  getDeviceStatus, 
  getComprehensiveMonitoring, 
  getMonitoringDashboard, 
  getDeviceMonitoringStatus,
  testAllGetEndpoints,
  TestResult,
  TestResults
} from '../../utils/netops';

const NetOpsTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');

  const endpoints = [
    { key: 'devices', name: 'Devices', fn: () => getDevices() },
    { key: 'services', name: 'Services', fn: () => getServices() },
    { key: 'alerts', name: 'Alerts', fn: () => getAlerts() },
    { key: 'device-status', name: 'Device Status', fn: () => getDeviceStatus() },
    { key: 'comprehensive-monitoring', name: 'Comprehensive Monitoring', fn: () => getComprehensiveMonitoring() },
    { key: 'monitoring-dashboard', name: 'Monitoring Dashboard', fn: () => getMonitoringDashboard() },
    { key: 'device-monitoring-status', name: 'Device Monitoring Status', fn: () => getDeviceMonitoringStatus(1) },
  ];

  const testSingleEndpoint = async (endpoint: typeof endpoints[0]) => {
    setIsLoading(true);
    try {
      console.log(`Testing ${endpoint.name}...`);
      const data = await endpoint.fn();
      setTestResults(prev => ({
        ...prev,
        [endpoint.key]: {
          success: true,
          data: data,
          error: null
        }
      }));
      console.log(`✅ ${endpoint.name} - Success:`, data);
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [endpoint.key]: {
          success: false,
          data: null,
          error: error.message || 'Unknown error'
        }
      }));
      console.error(`❌ ${endpoint.name} - Error:`, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    setIsLoading(true);
    try {
      const results = await testAllGetEndpoints();
      setTestResults(results);
    } catch (error: any) {
      console.error("Failed to test all endpoints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults({});
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">NetOps API Test Page</h1>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={testAllEndpoints}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test All Endpoints'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Individual Endpoint:
            </label>
            <div className="flex flex-wrap gap-2">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.key}
                  onClick={() => testSingleEndpoint(endpoint)}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {endpoint.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Test Results</h2>
            
            {Object.entries(testResults).map(([endpoint, result]) => (
              <div key={endpoint} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-800 capitalize">
                    {endpoint.replace('-', ' ')}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>

                {result.error && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-red-600 mb-1">Error:</h4>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <code className="text-red-800 text-sm">{result.error}</code>
                    </div>
                  </div>
                )}

                {result.data && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Response Data:</h4>
                    <div className="bg-gray-50 border rounded p-3 max-h-96 overflow-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {formatJson(result.data)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Testing endpoints...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetOpsTestPage;
