import React from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../toolkit/hooks';
import {
  setPendingDateEnd,
  setPendingDateStart,
} from '../../toolkit/callDashboard/slice';
import {
  applyCallDashboardDateRangeThunk,
  refreshCallDashboardThunk,
} from '../../toolkit/callDashboard/thunks';

const CallDashboardPageHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const showDateRange = useAppSelector((s) => s.callDashboard.showDateRange);
  const loading = useAppSelector((s) => s.callDashboard.loading);
  const pendingDateStart = useAppSelector((s) => s.callDashboard.pendingDateStart);
  const pendingDateEnd = useAppSelector((s) => s.callDashboard.pendingDateEnd);

  return (
    <Row className="mb-3">
      <Col md={12}>
        <div className="page-header-title style-2">
          <Row className="d-flex justify-content-between align-items-center">
            <Col md={4}>
              <h2 className="mb-0">Call Dashboard</h2>
            </Col>
            <Col md={8} className="d-flex justify-content-end">
              <div className="action-buttons">
                <div className="d-flex align-items-center gap-2">
                  {showDateRange && (
                    <>
                      Date Range:{' '}
                      <span className="status-badge primary">
                        <Form.Control
                          type="date"
                          value={pendingDateStart}
                          max={moment().format('YYYY-MM-DD')}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            dispatch(setPendingDateStart(newStart));
                            if (newStart && pendingDateEnd && newStart > pendingDateEnd) {
                              dispatch(setPendingDateEnd(newStart));
                            }
                          }}
                          className="border-0 bg-transparent p-0 text-inherit"
                          style={{ fontSize: 'inherit', minWidth: '130px', cursor: 'pointer' }}
                          aria-label="From date"
                          title="From date"
                        />
                      </span>
                      {' '}to{' '}
                      <span className="status-badge primary">
                        <Form.Control
                          type="date"
                          value={pendingDateEnd}
                          min={pendingDateStart || undefined}
                          max={moment().format('YYYY-MM-DD')}
                          onChange={(e) =>
                            dispatch(setPendingDateEnd(e.target.value))
                          }
                          className="border-0 bg-transparent p-0 text-inherit"
                          style={{ fontSize: 'inherit', minWidth: '130px', cursor: 'pointer' }}
                          aria-label="To date"
                          title="To date"
                        />
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          void dispatch(applyCallDashboardDateRangeThunk());
                        }}
                        disabled={loading}
                      >
                        Apply
                      </Button>
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 bg-transparent align-self-center"
                        onClick={() => {
                          void dispatch(refreshCallDashboardThunk(undefined));
                        }}
                        title="Refresh"
                        aria-label="Refresh"
                      >
                        <i className="material-icons-two-tone">refresh</i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  );
};

export default CallDashboardPageHeader;
