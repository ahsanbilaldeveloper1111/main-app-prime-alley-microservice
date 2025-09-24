 import React, { useState } from 'react';
import { Col, Row, Tab, Tabs } from 'react-bootstrap';
import { motion, AnimatePresence } from "framer-motion";
import { easeInOut, easeOut, easeIn } from "framer-motion";
import ChartBar from '@components/ChartBar';

interface ChartsTabsProps {
  chartCalls: { series: any[]; categories: string[] } | null;
  chartRingTime: { series: any[]; categories: string[] } | null;
  chartCost: { series: any[]; categories: string[] } | null;
  chartDuration: { series: any[]; categories: string[] } | null;
  chartLoading: boolean;
  onOpenChartModal: (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => void;
}

const ChartsTabs: React.FC<ChartsTabsProps> = ({
  chartCalls,
  chartRingTime,
  chartCost,
  chartDuration,
  chartLoading,
  onOpenChartModal
}) => {
  const [activeTab, setActiveTab] = useState('calls_chart');

  // Animation variants for tab transitions
  const tabVariants = {
    hidden: { 
      opacity: 0, 
      x: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: easeOut
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: easeIn
      }
    }
  };

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
    }
  };

  const renderChart = (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost', icon: string, emptyMessage: string) => {
    if (chartLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading chart...</span>
          </div>
        </div>
      );
    }

    if (chartData) {
      return (
        <ChartBar 
          series={chartData.series}
          categories={chartData.categories}
          dataType={dataType}
          height={300}
          maxDisplayedItems={5}
          showViewAllButton={true}
          viewAllButtonText="View All"
          showFullScreenButton={true}
          onFullScreenClick={() => onOpenChartModal(chartData, title, dataType)}
        />
      );
    }

    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
        <i className={`fa ${icon} fa-3x text-muted mb-3`}></i>
        <h5 className="text-muted mb-2">{emptyMessage}</h5>
        <p className="text-muted mb-0">No statistics found for the selected filters and date range.</p>
      </div>
    );
  };

  return (
    <Row>
      <Col md={12}>
        <h2 className="app-title-heading">Core Metrics</h2>
      </Col>

      <Col md={12}>
        <Tabs
          defaultActiveKey="calls_chart"
          id="system-tabs"
          className="mb-3"
          activeKey={activeTab}
          onSelect={handleTabChange}
        >
          <Tab eventKey="calls_chart" title="Calls by Country">
            <AnimatePresence mode="wait">
              {activeTab === 'calls_chart' && (
                <motion.div
                  key="calls_chart"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Row>
                    <Col md={12}>
                      <div className="card report-shadow">
                        <div className="card-body">
                          {renderChart(chartCalls, 'Calls by Country', 'calls', 'fa-chart-bar', 'No Call Data Available')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="duration_chart" title="Duration by Country">
            <AnimatePresence mode="wait">
              {activeTab === 'duration_chart' && (
                <motion.div
                  key="duration_chart"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Row>
                    <Col md={12}>
                      <div className="card report-shadow">
                        <div className="card-body">
                          {renderChart(chartDuration, 'Duration by Country', 'time', 'fa-clock', 'No Duration Data Available')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="ring_chart" title="Ring Time by Country">
            <AnimatePresence mode="wait">
              {activeTab === 'ring_chart' && (
                <motion.div
                  key="ring_chart"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Row>
                    <Col md={12}>
                      <div className="card report-shadow">
                        <div className="card-body">
                          {renderChart(chartRingTime, 'Ring Time by Country', 'time', 'fa-phone', 'No Ring Time Data Available')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="cost_chart" title="Cost by Country">
            <AnimatePresence mode="wait">
              {activeTab === 'cost_chart' && (
                <motion.div
                  key="cost_chart"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Row>
                    <Col md={12}>
                      <div className="card report-shadow">
                        <div className="card-body">
                          {renderChart(chartCost, 'Cost by Country', 'cost', 'fa-dollar-sign', 'No Cost Data Available')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>
        </Tabs>
      </Col>
    </Row>
  );
};

export default ChartsTabs;
