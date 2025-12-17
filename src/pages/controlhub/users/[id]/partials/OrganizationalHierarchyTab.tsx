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

    if (!accessLevelSummary || (!accessLevelSummary.group && (!accessLevelSummary.teams || accessLevelSummary.teams.length === 0))) {
        return null;
    }

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
                                        )}
                                        
                                        {/* Connecting Line */}
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
                                        
                                        {accessLevelSummary.teams.map((team: any, index: number) => (
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
                                                    {team.role && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            marginTop: '4px',
                                                            opacity: 0.9
                                                        }}>
                                                            ({team.role})
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Team Modules */}
                                                {team.modules && team.modules.length > 0 && (
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
                                                )}

                                                {/* Connecting Line to Members */}
                                                {team.is_owner && team.members && team.members.length > 0 && (
                                                    <>
                                                        <div style={{
                                                            width: '2px',
                                                            height: '30px',
                                                            backgroundColor: '#000',
                                                            marginBottom: '10px'
                                                        }}></div>

                                                        {/* Level 3: Team Members */}
                                                        <div className="org-level-3" style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '15px',
                                                            position: 'relative'
                                                        }}>
                                                            {/* Vertical line for members */}
                                                            {team.members.length > 1 && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '-30px',
                                                                    left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    width: '2px',
                                                                    height: `${(team.members.length - 1) * 75}px`,
                                                                    backgroundColor: '#000'
                                                                }}></div>
                                                            )}
                                                            
                                                            {team.members.map((member: any, memberIndex: number) => (
                                                                <div key={member.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                    {/* Horizontal line to member */}
                                                                    {team.members.length > 1 && memberIndex > 0 && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-30px',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            width: '120px',
                                                                            height: '2px',
                                                                            backgroundColor: '#000'
                                                                        }}></div>
                                                                    )}
                                                                    
                                                                    {/* Member Node */}
                                                                    <div className="org-node org-node-level-3" style={{
                                                                        backgroundColor: '#fd7e14',
                                                                        color: 'white',
                                                                        padding: '10px 20px',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                                        minWidth: '160px',
                                                                        textAlign: 'center',
                                                                        fontWeight: '500',
                                                                        fontSize: '13px'
                                                                    }}>
                                                                        <div>{member.name || 'Member'}</div>
                                                                        {member.email && (
                                                                            <div style={{
                                                                                fontSize: '11px',
                                                                                marginTop: '4px',
                                                                                opacity: 0.9
                                                                            }}>
                                                                                Extension: {member.phone}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
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

