import React, { useState, useEffect } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import "@assets/scss/common.scss";
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface GsmDetailModelProps {
  show: boolean;
  onHide: () => void;
  gsmData?: {
    id: string;
    name: string;
    status: string;
    location?: string;
    ports?: number[];
    lastSync?: string;
    description?: string;
  };
  onEdit?: (gsmData: any) => void;
  onDelete?: (gsmId: string) => void;
  title?: string;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
}

const GsmDetailModel: React.FC<GsmDetailModelProps> = ({
  show,
  onHide,
  gsmData,
  onEdit,
  onDelete,
  title,
  showEditButton = true,
  showDeleteButton = true
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!show) {
      setShowDeleteConfirm(false);
    }
  }, [show]);

  const handleEdit = () => {
    if (onEdit && gsmData) {
      onEdit(gsmData);
    }
    onHide();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && gsmData) {
      onDelete(gsmData.id);
    }
    setShowDeleteConfirm(false);
    onHide();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onHide();
  };

  const [timeRange, setTimeRange] = useState('24h');

  const gsmLatencyChart = {
    series: [{
      name: "Latency",
      data: [63, 68, 66, 71, 68]
    }],
    options: {
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#2563eb']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 100]
        },
        colors: ['#2563eb']
      },
      colors: ['#2563eb'],
      labels: ['11:00', '11:05', '11:10', '11:15', '11:20'],
      xaxis: {
        type: 'category',
        categories: ['11:00', '11:05', '11:10', '11:15', '11:20'],
        title: {
          text: 'Time'
        },
        grid: {
          show: true,
          borderColor: '#e5e7eb'
        }
      },
      yaxis: {
        opposite: false,
        min: 0,
        max: 80,
        tickAmount: 4,
        title: {
          text: 'Latency (ms)'
        },
        grid: {
          show: true,
          borderColor: '#e5e7eb'
        }
      },
      legend: {
        show: false
      },
      grid: {
        show: true,
        borderColor: '#e5e7eb',
        strokeDashArray: 0
      },
      markers: {
        size: 4,
        colors: ['#2563eb'],
        strokeColors: '#ffffff',
        strokeWidth: 2,
        hover: {
          size: 6
        }
      }
    }
  };

  const gsmDataUsageChart = {
      series: [{
        name: "Data Usage",
        data: [63, 68, 66, 71, 68]
      }],
      options: {
        chart: {
          type: 'area',
          height: 350,
          zoom: {
            enabled: false
          },
          toolbar: {
            show: false
          },
          background: 'transparent'
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2,
          colors: ['#10b981']
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.1,
            stops: [0, 100]
          },
          colors: ['#10b981']
        },
        colors: ['#10b981'],
        labels: ['11:00', '11:05', '11:10', '11:15', '11:20'],
        xaxis: {
          type: 'category',
          categories: ['11:00', '11:05', '11:10', '11:15', '11:20'],
          title: {
            text: 'Time'
          },
          grid: {
            show: true,
            borderColor: '#e5e7eb'
          }
        },
        yaxis: {
          opposite: false,
          min: 0,
          max: 80,
          tickAmount: 4,
          title: {
            text: 'Latency (ms)'
          },
          grid: {
            show: true,
            borderColor: '#e5e7eb'
          }
        },
        legend: {
          show: false
        },
        grid: {
          show: true,
          borderColor: '#e5e7eb',
          strokeDashArray: 0
        },
        markers: {
          size: 4,
          colors: ['#10b981'],
          strokeColors: '#ffffff',
          strokeWidth: 2,
          hover: {
            size: 6
          }
        }
      }
  };

  const modalTitle = title || `GSM Details - ${gsmData?.name || 'Unknown'}`;

  if (!show) return null;

  return (
    <>
      {/* Main GSM Detail Modal */}
      <div id="gsm-detail-modal" className="modal customModal " style={{display: 'flex'}}>
        <div className="modal-content" style={{maxWidth: '900px'}}>
          <button
            type="button"
            className="close-btn"
            id="gsm-detail-close-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
          
          <div className="gsm-detail-header">
            <h2 id="gsm-detail-modal-title">{modalTitle}</h2>
          </div>

          <div className="gsm-detail-modal-body">
            <Row>
                  <Col md={6}>
                        <Card className="mb-3">
                              <Card.Body>
                              <h3 className="app-title-heading mb-3 text-center">Latency History</h3>
                                          <fieldset className="d-flex justify-content-center align-items-center gap-2 border-0 m-0 p-0">
                                                <legend className="visually-hidden">Latency time range</legend>
                                                <button 
                                                      type="button" 
                                                      className={`btn btn-sm ${timeRange === '24h' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                      onClick={() => setTimeRange('24h')}
                                                >
                                                      24h
                                                </button>
                                                <button 
                                                      type="button" 
                                                      className={`btn btn-sm ${timeRange === '7d' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                      onClick={() => setTimeRange('7d')}
                                                >
                                                      7d
                                                </button>
                                                <button 
                                                      type="button" 
                                                      className={`btn btn-sm ${timeRange === '30d' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                      onClick={() => setTimeRange('30d')}
                                                >
                                                      30d
                                                </button>
                                          </fieldset>
                                          <ReactApexChart options={gsmLatencyChart.options as ApexOptions} series={gsmLatencyChart.series} type="area" height={200} />
                              </Card.Body>
                        </Card>

                        <Card className="mb-3">
                              <Card.Body>
                              <h3 className="app-title-heading mb-3 text-center">Data usage (MB)</h3>
                              <ReactApexChart options={gsmDataUsageChart.options as ApexOptions} series={gsmDataUsageChart.series} type="area" height={200} />
                              </Card.Body>
                        </Card>
                  </Col>
                  <Col md={6}>
                       <Card className="mb-3">
                              <Card.Body className="bg-light-primary">
                                    <div className="listItems">
                                          <Row className="g-3">
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Fireware:</div>
                                                            <div className="listItemValue">1.0.0</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Uptime:</div>
                                                            <div className="listItemValue">10 days</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">CPU Usage:</div>
                                                            <div className="listItemValue">10%</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Memory Usage:</div>
                                                            <div className="listItemValue">10%</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Battery level:</div>
                                                            <div className="listItemValue">10%</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Last Check-in:</div>
                                                            <div className="listItemValue">11:25 AM</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">RSRP:</div>
                                                            <div className="listItemValue">-100 dBm</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">RSRQ:</div>
                                                            <div className="listItemValue">-10 dB</div>
                                                      </div>
                                                </Col>
                                                <Col md={6} className="mb-2 mt-2">
                                                      <div className="singleListItem">
                                                            <div className="listItemTitle">Modem Status:</div>
                                                            <div className="listItemValue">Active</div>
                                                      </div>
                                                </Col>
                                          </Row>
                                    </div>
                                    <div className="action-button-container mt-3 d-flex justify-content-center gap-2">
                                          <button type="button" className="btn btn-primary app-button btn-sm">
                                                Send Command
                                          </button>
                                          <button type="button" className="btn btn-warning app-button btn-sm">
                                                 Force Update
                                          </button>
                                          <button type="button" className="btn btn-success app-button btn-sm">
                                                Toggle Power
                                          </button>
                                    </div>
                              </Card.Body>
                       </Card>

                       <Card className="mb-3">
                              <Card.Body>
                                    <h3 className="app-title-heading mb-3 text-center">Location</h3>
                                    <div className="location-container">
                                         Location Map
                                    </div>
                              </Card.Body>
                        </Card>


                        <Card className="mb-3">
                              <Card.Body>
                                    <h3 className="app-title-heading mb-3 text-center">Alert History & Logs</h3>
                                    <div className="log-container" style={{
                                          backgroundColor: '#f8f9fa',
                                          border: '1px solid #dee2e6',
                                          borderRadius: '8px',
                                          padding: '15px',
                                          maxHeight: '200px',
                                          overflowY: 'auto',
                                          fontFamily: 'monospace',
                                          fontSize: '14px',
                                          lineHeight: '1.5'
                                    }}>
                                          <div style={{ color: '#fd7e14', fontWeight: 'bold', marginBottom: '10px' }}>
                                                ALERT: Latency spike detected at 11:15
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:00:00</span> Status check initiated. Latency: 65ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:05:00</span> Connection stable. Latency: 70ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:10:00</span> Latency improving. Latency: 68ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:15:00</span> Latency spike detected. Latency: 72ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:20:00</span> System recovery in progress. Latency: 69ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:25:00</span> Connection restored. Latency: 67ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:30:00</span> All systems normal. Latency: 65ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:35:00</span> Routine maintenance check. Latency: 66ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:40:00</span> Performance optimization applied. Latency: 64ms
                                          </div>
                                          <div style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#6c757d' }}>2025-09-18 11:45:00</span> System monitoring active. Latency: 63ms
                                          </div>
                                    </div>
                              </Card.Body>
                        </Card>
                  </Col>
            </Row>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-export" id="gsm-detail-cancel-btn" onClick={handleClose}>
              Close
            </button>
            {showEditButton && gsmData && (
              <button type="button" className="btn btn-secondary" id="gsm-detail-edit-btn" onClick={handleEdit}>
                <i className="fas fa-edit" aria-hidden="true"></i> Edit
              </button>
            )}
            {showDeleteButton && gsmData && (
              <button type="button" className="btn btn-danger" id="gsm-detail-delete-btn" onClick={handleDeleteClick}>
                <i className="fas fa-trash" aria-hidden="true"></i> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div id="delete-confirm-modal" className="modal customModal" style={{display: 'flex'}}>
          <div className="modal-content">
            <button
              type="button"
              className="close-btn"
              id="delete-confirm-close-btn"
              onClick={handleDeleteCancel}
              aria-label="Close dialog"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
            <h2 id="delete-confirm-modal-title">Confirm Delete</h2>
            <p id="delete-confirm-modal-text">
              Are you sure you want to delete GSM <strong>"{gsmData?.name}"</strong>? 
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn btn-export" id="delete-confirm-cancel-btn" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" id="delete-confirm-delete-btn" onClick={handleDeleteConfirm}>
                <i className="fas fa-trash" aria-hidden="true"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GsmDetailModel;
