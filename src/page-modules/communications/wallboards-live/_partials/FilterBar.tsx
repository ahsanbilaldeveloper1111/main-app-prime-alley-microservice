import React from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Search, Filter } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  selectedTeam: string;
  selectedStatus: string;
  sortBy: string;
  setSearchQuery: (value: string) => void;
  setSelectedTeam: (value: string) => void;
  setSelectedStatus: (value: string) => void;
  setSortBy: (value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  getUserTeams: () => any[];
}

const FilterBar: React.FC<FilterBarProps> = ({
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
  return (
    <div
      className="bg-white shadow-sm mb-4 rounded"
      style={{
        position: "sticky",
        top: "56px",
        zIndex: 920,
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "1rem",
        paddingBottom: "1rem",
        backgroundColor: "#ffffff",
      }}
    >
      <Row className="g-2 align-items-center">
        {/* Search */}
        <Col xs={12} sm={12} md={12} lg={3} xl={3}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search name or extension..."
              value={searchQuery || ""}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && applyFilters()}
              className="border-start-0 ps-0"
              style={{ fontSize: "0.875rem" }}
            />
          </InputGroup>
        </Col>

        {/* Team Filter */}
        <Col xs={6} sm={3} md={3} lg={2} xl={2}>
          <Form.Select
            size="sm"
            value={selectedTeam || "all"}
            onChange={(e: any) => setSelectedTeam(e.target.value)}
            style={{ fontSize: "0.875rem" }}
          >
            <option value="all">All Teams</option>
            {(() => {
              const teams = getUserTeams?.() || [];
              return teams.map((team: any) => (
                <option
                  key={team.id || team.name || team}
                  value={team.id || team.name || team}
                >
                  {team.name || team.label || team}
                </option>
              ));
            })()}
          </Form.Select>
        </Col>

        {/* Status Filter */}
        <Col xs={6} sm={3} md={3} lg={2} xl={2}>
          <Form.Select
            size="sm"
            value={selectedStatus || "all"}
            onChange={(e: any) => setSelectedStatus(e.target.value)}
            style={{ fontSize: "0.875rem" }}
          >
            <option value="">All Status</option>
            <option value="supervision">Live Coaching</option>
            <option value="oncall">Live Calls</option>
            <option value="active">Available & Idle</option>
            <option value="offline">Offline</option>
          </Form.Select>
        </Col>

        {/* Sort By Duration */}
        <Col xs={6} sm={3} md={3} lg={2} xl={2}>
          <Form.Select
            size="sm"
            value={sortBy || "none"}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{ fontSize: "0.875rem" }}
          >
            <option value="none">Sort by Duration</option>
            <option value="longest">Longest First</option>
            <option value="shortest">Shortest First</option>
          </Form.Select>
        </Col>

        {/* Spacer to push buttons to right */}
        <Col
          xs={0}
          sm={0}
          md={0}
          lg={1}
          xl={1}
          className="d-none d-lg-block"
        ></Col>

        {/* Filter Button */}
        <Col xs={3} sm={1.5} md={1.5} lg={1} xl={1}>
          <Button
            variant="primary"
            size="sm"
            onClick={applyFilters}
            className="w-100"
            style={{
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
              padding: "0.25rem 0.5rem",
            }}
          >
            <Filter size={14} className="me-1" />
            Filter
          </Button>
        </Col>

        {/* Clear Filters Button */}
        <Col xs={3} sm={1.5} md={1.5} lg={1} xl={1}>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={clearFilters}
            className="w-100"
            style={{
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
              padding: "0.25rem 0.5rem",
            }}
          >
            Clear
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default FilterBar;
