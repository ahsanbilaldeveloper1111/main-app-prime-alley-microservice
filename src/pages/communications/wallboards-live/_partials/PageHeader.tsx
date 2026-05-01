import React from 'react'
import { Button, Col, Row } from 'react-bootstrap'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import Link from 'next/link'
import GenericFilterSidebar, { FilterField } from '@components/GenericFilterSidebar' // adjust import path

interface PageHeaderProps {
  session: any
  isFullscreen: boolean
  toggleFullscreen: () => void
  collapsedSections: { [key: string]: boolean }
  expandAll: () => void
  collapseAll: () => void
  showFilterBar: boolean
  toggleFilterBar: () => void
  // Filter state props (previously handled by FilterBar)
  searchQuery: string
  selectedTeam: string
  selectedStatus: string
  sortBy: string
  setSearchQuery: (value: string) => void
  setSelectedTeam: (value: string) => void
  setSelectedStatus: (value: string) => void
  setSortBy: (value: string) => void
  applyFilters: () => void
  clearFilters: () => void
  getUserTeams: () => any[]
}

const PageHeader: React.FC<PageHeaderProps> = ({
  session,
  isFullscreen,
  toggleFullscreen,
  collapsedSections,
  expandAll,
  collapseAll,
  showFilterBar,
  toggleFilterBar,
  searchQuery,
  selectedTeam,
  selectedStatus,
  sortBy,
  setSearchQuery,
  setSelectedTeam,
  setSelectedStatus,
  setSortBy,
  applyFilters,
  clearFilters,
  getUserTeams,
}) => {
  const allCollapsed = Object.values(collapsedSections).every(val => val === true)

  // Build team options from getUserTeams()
  const teamOptions = (getUserTeams?.() || []).map((team: any) => ({
    value: team.id || team.name || team,
    label: team.name || team.label || team,
  }))

  // Define filter fields for GenericFilterSidebar
  const filters: FilterField[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      value: searchQuery,
      onChange: setSearchQuery,
      placeholder: 'Search name or extension...',
    },
    {
      id: 'team',
      label: 'Team',
      type: 'select',
      value: teamOptions.find(t => t.value === selectedTeam) || null,
      onChange: (option: any) => setSelectedTeam(option?.value ?? 'all'),
      placeholder: 'All Teams',
      options: [{ value: 'all', label: 'All Teams' }, ...teamOptions],
      isClearable: true,
    },
    {
      id: 'status',
      label: 'Status',
      type: 'dropdown',
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: [
        { value: '', label: 'All Status' },
        { value: 'supervision', label: 'Live Coaching' },
        { value: 'oncall', label: 'Live Calls' },
        { value: 'active', label: 'Available & Idle' },
        { value: 'offline', label: 'Offline' },
      ],
    },
    {
      id: 'sortBy',
      label: 'Sort by Duration',
      type: 'dropdown',
      value: sortBy,
      onChange: setSortBy,
      options: [
        { value: 'none', label: 'Sort by Duration' },
        { value: 'longest', label: 'Longest First' },
        { value: 'shortest', label: 'Shortest First' },
      ],
    },
  ]

  return (
    <>
      <Row className={`mb-3 ${isFullscreen ? 'd-none' : ''}`}>
        <Col md={12}>
          <div className="page-header-title style-2 mt-0 mb-0">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Live Calls</h2>
              </Col>

              <Col md={7} className="d-flex justify-content-end">
                <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">

                  {session?.user?.permissions?.includes('view-live-wallboard-beta-cti') && (
                    <Link href="/live-monitoring">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="d-flex align-items-center"
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        <span>New View (BETA)</span>
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => allCollapsed ? expandAll() : collapseAll()}
                    className="d-flex align-items-center"
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {allCollapsed ? (
                      <><ChevronDown size={16} className="me-1" />Expand All</>
                    ) : (
                      <><ChevronUp size={16} className="me-1" />Collapse All</>
                    )}
                  </Button>

                  <Button
                    onClick={toggleFullscreen}
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center"
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      padding: '0.5rem 1rem'
                    }}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    <span className="ms-2">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                  </Button>

                  {/* Filter button — toggles the sidebar */}
                  <Button
                    variant={showFilterBar ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={toggleFilterBar}
                    className="d-flex align-items-center"
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <Filter size={16} className="me-1" />
                    <span>Filter</span>
                  </Button>

                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Filter Sidebar — replaces FilterBar */}
     

      <GenericFilterSidebar
        isOpen={showFilterBar}
        onClose={toggleFilterBar}
        title="Filters"
        subtitle="Filter and refine your results"
        filters={filters}
        onApply={applyFilters}
        onReset={clearFilters}
        showApplyButton
        showResetButton
      />
      
    
    </>
  )
}

export default PageHeader