import React, { useRef, useEffect } from "react";
import { Search, ChevronDown, CheckCircle } from "lucide-react";

interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon: any;
}

export interface TeamOption {
  id: number;
  name: string;
}

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  /** Team names only (legacy) or full team options with id for onTeamChange */
  teams: string[] | TeamOption[];
  agentStatus: string;
  setAgentStatus: (status: string) => void;
  showStatusDropdown: boolean;
  setShowStatusDropdown: (show: boolean) => void;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  statusOptions: StatusOption[];
  handleLogout: () => void;
  /** When provided, called on status change (e.g. to call API); parent should update state on success */
  onStatusChange?: (newState: string) => void | Promise<void>;
  /** When provided and teams are TeamOption[], called when user selects a different team (unlink → storage → link flow). */
  onTeamChange?: (teamName: string, teamId: number) => void | Promise<void>;
}

const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedTeam,
  setSelectedTeam,
  teams,
  agentStatus,
  setAgentStatus,
  showStatusDropdown,
  setShowStatusDropdown,
  showUserMenu,
  setShowUserMenu,
  statusOptions,
  handleLogout,
  onStatusChange,
  onTeamChange,
}) => {
  const teamOptions: TeamOption[] =
    Array.isArray(teams) &&
    teams.length > 0 &&
    typeof teams[0] === "object" &&
    teams[0] != null &&
    "id" in (teams[0] as object)
      ? (teams as TeamOption[])
      : (teams as string[]).map((name, i) => ({ id: i, name }));
  const teamNames = teamOptions.map((t) => t.name);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowStatusDropdown, setShowUserMenu]);

  const currentStatus =
    statusOptions.find((s) => s.value === agentStatus) || statusOptions[0];

  const handleStatusChange = async (status: string) => {
    setShowStatusDropdown(false);
    if (onStatusChange) {
      await onStatusChange(status);
    } else {
      setAgentStatus(status);
      const statusLabel = statusOptions.find((s) => s.value === status)?.label;
      if (statusLabel) {
        alert(`✅ Status changed to ${statusLabel}`);
      }
    }
  };

  return (
    <>
      <style>{`
        .top-bar {
          background: white;
          padding: 16px 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box input {
          width: 100%;
          padding: 9px 16px 10px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .team-selector select {
          padding: 11px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .team-selector select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .team-selector select:hover {
          border-color: #667eea;
        }

        .top-right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-dropdown-container {
          position: relative;
          z-index: 100;
        }

        .status-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
          min-width: 160px;
          font-family: inherit;
          color: inherit;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
        }

        .status-selector:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .status-selector:focus-visible {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .status-indicator {
          display: inline-block;
          flex-shrink: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          z-index: 9999;
          overflow: hidden;
          animation: slideDown 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: white;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #475569;
          font-family: inherit;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.active {
          background: #ede9fe;
          color: #7c3aed;
        }

        .user-menu-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .user-menu-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      `}</style>

      <div className="top-bar">
        <div
          style={{ display: "flex", gap: "12px", flex: 1, maxWidth: "450px" }}
        >
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="team-selector">
            <select
              value={selectedTeam}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedTeam(name);
                const team = teamOptions.find((t) => t.name === name);
                if (team && onTeamChange) onTeamChange(name, team.id);
              }}
            >
              {teamOptions.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="top-right-controls">
          <div className="status-dropdown-container" ref={statusDropdownRef}>
            <button
              type="button"
              className="status-selector"
              aria-expanded={showStatusDropdown}
              aria-haspopup="menu"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
              }}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <span
                className="status-indicator"
                aria-hidden
                style={{ backgroundColor: currentStatus.color }}
              />
              <span>{currentStatus.label}</span>
              <ChevronDown
                size={16}
                style={{
                  marginLeft: "auto",
                  transform: showStatusDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showStatusDropdown && (
              <div className="dropdown-menu" style={{ display: "block" }}>
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`dropdown-item ${agentStatus === option.value ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStatusChange(option.value);
                      }}
                    >
                      <IconComponent size={18} color={option.color} />
                      <span>{option.label}</span>
                      {agentStatus === option.value && (
                        <CheckCircle size={16} style={{ marginLeft: "auto" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* <div className="status-dropdown-container" ref={userMenuRef}>
            <button 
              className="user-menu-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              title="User Menu"
              type="button"
              style={{ cursor: 'pointer' }}
            >
              <User size={20} />
            </button>
            
            {showUserMenu && (
              <div className="dropdown-menu" style={{ display: 'block' }}>
                {/* <button 
                  type="button"
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Profile settings coming soon...');
                    setShowUserMenu(false);
                  }}
                >
                  <Users size={18} />
                  <span>Profile</span>
                </button>
                <button 
                  type="button"
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Settings coming soon...');
                    setShowUserMenu(false);
                  }}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button> */}
          {/* <div style={{ 
                  height: '1px', 
                  background: '#f1f5f9', 
                  margin: '8px 0' 
                }} />
                <button 
                  type="button"
                  className="dropdown-item" 
                  style={{ color: '#dc2626' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div> */}
          {/* )} */}
          {/* </div> */}
        </div>
      </div>
    </>
  );
};

export default TopBar;
