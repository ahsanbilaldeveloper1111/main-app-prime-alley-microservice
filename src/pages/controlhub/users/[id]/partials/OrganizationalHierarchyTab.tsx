import React, { useState, useEffect } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { Users, Layers } from 'lucide-react';
import { getUserAccessLevelSummary } from '@utils/users';

interface OrganizationalHierarchyTabProps {
    currentUser: any;
}

const OrganizationalHierarchyTab: React.FC<OrganizationalHierarchyTabProps> = ({
    currentUser
}) => {
    const [accessLevelSummary, setAccessLevelSummary] = useState<any>(null);

    // Fetch user access level summary for Organizational Hierarchy
    useEffect(() => {
        const fetchAccessSummary = async () => {
            if (!currentUser?.id) return;
            try {
                const data = await getUserAccessLevelSummary(currentUser.id.toString(), true);
                if (data) {
                    setAccessLevelSummary(data);
                }
            } catch (error) {
                console.error('Error fetching access level summary:', error);
            }
        };
        fetchAccessSummary();
    }, [currentUser]);

    // Show component if there's a group OR if there are teams (even without a group)
    if (!accessLevelSummary || (!accessLevelSummary.group && (!accessLevelSummary.teams || accessLevelSummary.teams.length === 0))) {
        return null;
    }

    const renderPersonNode = (person: any, color: string, index: number, total: number) => {
        return (
            <div key={person.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {/* Vertical line from main vertical line to this person's horizontal line */}
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '2px',
                    height: '10px',
                    backgroundColor: '#000',
                    zIndex: 1
                }}></div>
                
                {/* Horizontal line to person node */}
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    left: '50%',
                    transform: 'translateX(-100%)',
                    width: '60px',
                    height: '2px',
                    backgroundColor: '#000',
                    zIndex: 1
                }}></div>
                
                <div style={{
                    backgroundColor: color,
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    fontWeight: '500',
                    fontSize: '12px',
                    minWidth: '160px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div>{person.name || (color === '#6f42c1' ? 'Owner' : 'Member')}</div>
                    {person.phone && (
                        <div style={{
                            fontSize: '10px',
                            marginTop: '4px',
                            opacity: 0.9
                        }}>
                            Extension: {person.phone}
                        </div>
                    )}
                    {person.email && color === '#6f42c1' && (
                        <div style={{
                            fontSize: '10px',
                            marginTop: '2px',
                            opacity: 0.8
                        }}>
                            {person.email}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Row className="mt-3">
            <Col md={12}>
                <Card className="shadow-sm">
                    <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <div className="d-flex align-items-center gap-2">
                            <Users size={20} />
                            <h5 className="mb-0">Organizational Hierarchy</h5>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <div className="org-chart-container" style={{ overflowX: 'auto', padding: '20px 0' }}>
                            <div className="org-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'fit-content' }}>
                                {/* Level 1: Group */}
                                {accessLevelSummary.group && (
                                    <>
                                        <div className="org-node org-node-level-1" style={{
                                            backgroundColor: '#0d6efd',
                                            color: 'white',
                                            padding: '15px 30px',
                                            borderRadius: '8px',
                                            marginBottom: '15px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            minWidth: '200px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            fontSize: '16px'
                                        }}>
                                            {accessLevelSummary.group.name || 'Group'}
                                        </div>
                                        
                                        {/* Group Modules */}
                                        {accessLevelSummary.group.modules && accessLevelSummary.group.modules.length > 0 && (
                                            <>
                                                <div style={{
                                                    width: '2px',
                                                    height: '15px',
                                                    backgroundColor: '#000',
                                                    marginBottom: '5px'
                                                }}></div>
                                                <div style={{
                                                    marginBottom: '15px',
                                                    padding: '10px',
                                                    backgroundColor: '#e7f3ff',
                                                    borderRadius: '6px',
                                                    minWidth: '200px',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        color: '#0d6efd',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <Layers size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                                        Modules ({accessLevelSummary.group.modules.length})
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '4px',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {accessLevelSummary.group.modules.map((module: any) => (
                                                            <span key={module.id} style={{
                                                                backgroundColor: '#0d6efd',
                                                                color: 'white',
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '10px',
                                                                fontWeight: '500'
                                                            }}>
                                                                {module.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        {/* Connecting Line to Teams */}
                                        {accessLevelSummary.teams && accessLevelSummary.teams.length > 0 && (
                                            <div style={{
                                                width: '2px',
                                                height: '30px',
                                                backgroundColor: '#000',
                                                marginBottom: '10px'
                                            }}></div>
                                        )}
                                    </>
                                )}

                                {/* Level 2: Teams */}
                                {accessLevelSummary.teams && accessLevelSummary.teams.length > 0 && (
                                    <div className="org-level-2" style={{
                                        display: 'flex',
                                        gap: '60px',
                                        marginBottom: '30px',
                                        position: 'relative',
                                        justifyContent: 'center'
                                    }}>
                                        {/* Horizontal connecting line for teams */}
                                        {accessLevelSummary.group && accessLevelSummary.teams.length > 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-30px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: `${(accessLevelSummary.teams.length - 1) * 300}px`,
                                                height: '2px',
                                                backgroundColor: '#000'
                                            }}></div>
                                        )}
                                        
                                        {accessLevelSummary.teams.map((team: any, index: number) => {
                                            const hasOwners = team.owners && Array.isArray(team.owners) && team.owners.length > 0;
                                            const hasMembers = team.members && Array.isArray(team.members) && team.members.length > 0;
                                            const hasBoth = hasOwners && hasMembers;
                                            
                                            return (
                                                <div key={team.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    {/* Vertical line from horizontal line to team */}
                                                    {accessLevelSummary.group && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-30px',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: '2px',
                                                            height: '30px',
                                                            backgroundColor: '#000'
                                                        }}></div>
                                                    )}
                                                    
                                                    {/* Team Node */}
                                                    <div className="org-node org-node-level-2" style={{
                                                        backgroundColor: '#198754',
                                                        color: 'white',
                                                        padding: '12px 25px',
                                                        borderRadius: '8px',
                                                        marginBottom: '15px',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                        minWidth: '180px',
                                                        textAlign: 'center',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        position: 'relative'
                                                    }}>
                                                        {team.name || 'Team'}
                                                    </div>

                                                    {/* Team Modules */}
                                                    {team.modules && team.modules.length > 0 && (
                                                        <>
                                                            <div style={{
                                                                width: '2px',
                                                                height: '15px',
                                                                backgroundColor: '#000',
                                                                marginBottom: '5px'
                                                            }}></div>
                                                            <div style={{
                                                                marginBottom: '15px',
                                                                padding: '8px',
                                                                backgroundColor: '#d1f2eb',
                                                                borderRadius: '6px',
                                                                minWidth: '180px',
                                                                textAlign: 'center'
                                                            }}>
                                                                <div style={{
                                                                    fontSize: '10px',
                                                                    fontWeight: '600',
                                                                    color: '#198754',
                                                                    marginBottom: '6px'
                                                                }}>
                                                                    <Layers size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                                                    Modules ({team.modules.length})
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    gap: '3px',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    {team.modules.map((module: any) => (
                                                                        <span key={module.id} style={{
                                                                            backgroundColor: '#198754',
                                                                            color: 'white',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '10px',
                                                                            fontSize: '9px',
                                                                            fontWeight: '500'
                                                                        }}>
                                                                            {module.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Owners and Members Section */}
                                                    {(hasOwners || hasMembers) && (
                                                        <>
                                                            {/* Connecting Line from Team Modules to Owners/Members */}
                                                            <div style={{
                                                                width: '2px',
                                                                height: '30px',
                                                                backgroundColor: '#000',
                                                                marginBottom: '10px'
                                                            }}></div>

                                                            {/* Owners and Members Container - Side by Side */}
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '40px',
                                                                position: 'relative',
                                                                alignItems: 'flex-start'
                                                            }}>
                                                                {/* Horizontal connecting line - only show if both owners and members exist */}
                                                                {hasBoth && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '-30px',
                                                                        left: '0',
                                                                        right: '0',
                                                                        height: '2px',
                                                                        backgroundColor: '#000'
                                                                    }}></div>
                                                                )}

                                                                {/* Owners Node */}
                                                                {hasOwners && (
                                                                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
                                                                        {/* Vertical line to Owners */}
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-30px',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            width: '2px',
                                                                            height: '30px',
                                                                            backgroundColor: '#000'
                                                                        }}></div>
                                                                        
                                                                        {/* Owners Header Node */}
                                                                        <div style={{
                                                                            backgroundColor: '#6f42c1',
                                                                            color: 'white',
                                                                            padding: '10px 20px',
                                                                            borderRadius: '8px',
                                                                            marginBottom: '0px',
                                                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                                            minWidth: '180px',
                                                                            textAlign: 'center',
                                                                            fontWeight: '600',
                                                                            fontSize: '13px',
                                                                            position: 'relative',
                                                                            zIndex: 1
                                                                        }}>
                                                                            Owners ({team.owners.length})
                                                                        </div>
                                                                        
                                                                        {/* Vertical line from header bottom */}
                                                                        {team.owners.length > 0 && (
                                                                            <div style={{
                                                                                width: '2px',
                                                                                height: '10px',
                                                                                backgroundColor: '#000',
                                                                                marginBottom: '0px',
                                                                                zIndex: 0
                                                                            }}></div>
                                                                        )}

                                                                        {/* Owners List with connecting lines */}
                                                                        {team.owners.length > 0 && (
                                                                            <div style={{
                                                                                position: 'relative',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: '10px',
                                                                                width: '100%',
                                                                                alignItems: 'center',
                                                                                marginTop: '0px'
                                                                            }}>
                                                                                {/* Vertical line from header bottom through all owners */}
                                                                                {team.owners.length > 0 && (
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: '0px',
                                                                                        left: '50%',
                                                                                        transform: 'translateX(-50%)',
                                                                                        width: '2px',
                                                                                        height: team.owners.length > 1 
                                                                                            ? `${(team.owners.length - 1) * 70 + 20}px` 
                                                                                            : '20px',
                                                                                        backgroundColor: '#000',
                                                                                        zIndex: 0
                                                                                    }}></div>
                                                                                )}
                                                                                
                                                                                {team.owners.map((owner: any, ownerIndex: number) => 
                                                                                    renderPersonNode(owner, '#6f42c1', ownerIndex, team.owners.length)
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Members Node */}
                                                                {hasMembers && (
                                                                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
                                                                        {/* Vertical line to Members */}
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-30px',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            width: '2px',
                                                                            height: '30px',
                                                                            backgroundColor: '#000'
                                                                        }}></div>
                                                                        
                                                                        {/* Members Header Node */}
                                                                        <div style={{
                                                                            backgroundColor: '#fd7e14',
                                                                            color: 'white',
                                                                            padding: '10px 20px',
                                                                            borderRadius: '8px',
                                                                            marginBottom: '0px',
                                                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                                            minWidth: '180px',
                                                                            textAlign: 'center',
                                                                            fontWeight: '600',
                                                                            fontSize: '13px',
                                                                            position: 'relative',
                                                                            zIndex: 1
                                                                        }}>
                                                                            Members ({team.members.length})
                                                                        </div>
                                                                        
                                                                        {/* Vertical line from header bottom */}
                                                                        {team.members.length > 0 && (
                                                                            <div style={{
                                                                                width: '2px',
                                                                                height: '10px',
                                                                                backgroundColor: '#000',
                                                                                marginBottom: '0px',
                                                                                zIndex: 0
                                                                            }}></div>
                                                                        )}

                                                                        {/* Members List with connecting lines */}
                                                                        {team.members.length > 0 && (
                                                                            <div style={{
                                                                                position: 'relative',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: '10px',
                                                                                width: '100%',
                                                                                alignItems: 'center',
                                                                                marginTop: '0px'
                                                                            }}>
                                                                                {/* Vertical line from header bottom through all members */}
                                                                                {team.members.length > 0 && (
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: '0px',
                                                                                        left: '50%',
                                                                                        transform: 'translateX(-50%)',
                                                                                        width: '2px',
                                                                                        height: team.members.length > 1 
                                                                                            ? `${(team.members.length - 1) * 70 + 20}px` 
                                                                                            : '20px',
                                                                                        backgroundColor: '#000',
                                                                                        zIndex: 0
                                                                                    }}></div>
                                                                                )}
                                                                                
                                                                                {team.members.map((member: any, memberIndex: number) => 
                                                                                    renderPersonNode(member, '#fd7e14', memberIndex, team.members.length)
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default OrganizationalHierarchyTab;
