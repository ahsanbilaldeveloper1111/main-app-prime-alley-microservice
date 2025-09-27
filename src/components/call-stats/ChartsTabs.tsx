import React, { useState } from 'react';
import { Row, Col, Tabs, Tab } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { easeOut, easeIn } from 'framer-motion';
import ChartBar from '@components/ChartBar';

interface ChartsTabsProps {
  chartCalls: { series: any[]; categories: string[] } | null;
  chartRingTime: { series: any[]; categories: string[] } | null;
  chartCost: { series: any[]; categories: string[] } | null;
  chartDuration: { series: any[]; categories: string[] } | null;
  chartLoading: boolean;
  onOpenChartModal: (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => void;
}

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

export const ChartsTabs: React.FC<ChartsTabsProps> = ({
  chartCalls,
  chartRingTime,
  chartCost,
  chartDuration,
  chartLoading,
  onOpenChartModal
}) => {
  const [activeTab, setActiveTab] = useState('calls_chart');

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
    }
  };

  return (
    <Row>
      <Col md={12}>
        <h4 className="">Core Metrics</h4>
      </Col>

      <Col md={12}>
        <Tabs
          defaultActiveKey="calls_chart"
          id="system-tabs"
          className="mb-3"
          activeKey={activeTab}
          onSelect={handleTabChange}
        >
          <Tab eventKey="calls_chart" title="Calls by Department">
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
                          {chartLoading ? (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading chart...</span>
                              </div>
                            </div>
                          ) : chartCalls ? (
                            <ChartBar 
                              series={chartCalls.series}
                              categories={chartCalls.categories}
                              dataType="calls"
                              height={300}
                              maxDisplayedItems={5}
                              showViewAllButton={true}
                              viewAllButtonText="View All"
                              showFullScreenButton={true}
                              onFullScreenClick={() => onOpenChartModal(chartCalls, 'Calls by Department', 'calls')}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                              <i className="fa fa-chart-bar fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted mb-2">No Call Data Available</h5>
                              <p className="text-muted mb-0">No call statistics found for the selected filters and date range.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="duration_chart" title="Duration by Department">
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
                          {chartLoading ? (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading chart...</span>
                              </div>
                            </div>
                          ) : chartDuration ? (
                            <ChartBar 
                              series={chartDuration.series}
                              categories={chartDuration.categories}
                              dataType="time"
                              height={300}
                              maxDisplayedItems={5}
                              showViewAllButton={true}
                              viewAllButtonText="View All"
                              showFullScreenButton={true}
                              onFullScreenClick={() => onOpenChartModal(chartDuration, 'Duration by Department', 'time')}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                              <i className="fa fa-clock fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted mb-2">No Duration Data Available</h5>
                              <p className="text-muted mb-0">No duration statistics found for the selected filters and date range.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="ring_chart" title="Ring Time by Department">
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
                          {chartLoading ? (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading chart...</span>
                              </div>
                            </div>
                          ) : chartRingTime ? (
                            <ChartBar 
                              series={chartRingTime.series}
                              categories={chartRingTime.categories}
                              dataType="time"
                              height={300}
                              maxDisplayedItems={5}
                              showViewAllButton={true}
                              viewAllButtonText="View All"
                              showFullScreenButton={true}
                              onFullScreenClick={() => onOpenChartModal(chartRingTime, 'Ring Time by Department', 'time')}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                              <i className="fa fa-phone fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted mb-2">No Ring Time Data Available</h5>
                              <p className="text-muted mb-0">No ring time statistics found for the selected filters and date range.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
            </AnimatePresence>
          </Tab>

          <Tab eventKey="cost_chart" title="Cost by Department">
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
                          {chartLoading ? (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading chart...</span>
                              </div>
                            </div>
                          ) : chartCost ? (
                            <ChartBar 
                              series={chartCost.series}
                              categories={chartCost.categories}
                              dataType="cost"
                              height={300}
                              maxDisplayedItems={5}
                              showViewAllButton={true}
                              viewAllButtonText="View All"
                              showFullScreenButton={true}
                              onFullScreenClick={() => onOpenChartModal(chartCost, 'Cost by Department', 'cost')}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                              <i className="fa fa-dollar-sign fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted mb-2">No Cost Data Available</h5>
                              <p className="text-muted mb-0">No cost statistics found for the selected filters and date range.</p>
                            </div>
                          )}
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