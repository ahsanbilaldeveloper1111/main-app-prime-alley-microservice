import React from 'react'
import { Button, Col, Row } from 'react-bootstrap'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  session: any
  isFullscreen: boolean
  toggleFullscreen: () => void
  collapsedSections: { [key: string]: boolean }
  expandAll: () => void
  collapseAll: () => void
}

const PageHeader: React.FC<PageHeaderProps> = ({
  session,
  isFullscreen,
  toggleFullscreen,
  collapsedSections,
  expandAll,
  collapseAll
}) => {
  const allCollapsed = Object.values(collapsedSections).every(val => val === true)
  
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
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    if (allCollapsed) {
                      expandAll()
                    } else {
                      collapseAll()
                    }
                  }}
                  className="d-flex align-items-center"
                  style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {allCollapsed ? (
                    <>
                      <ChevronDown size={16} className="me-1" />
                      Expand All
                    </>
                  ) : (
                    <>
                      <ChevronUp size={16} className="me-1" />
                      Collapse All
                    </>
                  )}
                </Button>
                
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                  <span className="ms-2">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
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

