import React from 'react'
import { Button, Col, Row } from 'react-bootstrap'
import Link from 'next/link'

interface PageHeaderProps {
  session: any
  isFullscreen: boolean
  toggleFullscreen: () => void
}

const PageHeader: React.FC<PageHeaderProps> = ({
  session,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <Row className="mb-3">
      <Col md={12}>
        <div className="page-header-title style-2">
          <Row className="d-flex justify-content-between align-items-center">
            <Col md={5}>
              <h2 className="mb-0">Live View</h2>
            </Col>

            <Col md={7} className="d-flex justify-content-end">
              <div className="action-buttons d-flex gap-2">
                {session?.user?.permissions?.includes('dial-call-cti') && (
                  <Link 
                    href="/cti/dialer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary d-flex align-items-center"
                  >
                    <i className="material-icons-two-tone me-2 text-white">open_in_new</i>
                    Dialer
                  </Link>
                )}
                
                <Button
                  variant="info"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="d-flex align-items-center"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </i>
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  )
}

export default PageHeader

