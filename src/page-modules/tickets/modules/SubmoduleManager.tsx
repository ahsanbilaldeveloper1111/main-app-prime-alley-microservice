import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { 
    ListSubmodules, 
    CreateSubmodule, 
    UpdateSubmodule, 
    DeleteSubmodule, 
    ListSubmoduleChildren, 
    CreateSubmoduleChild, 
    UpdateSubmoduleChild, 
    DeleteSubmoduleChild 
} from '@utils/ticket-module';

interface SubmoduleManagerProps {
    show: boolean;
    onHide: () => void;
    module: any;
    extensions: any[];
}

const SubmoduleManager: React.FC<SubmoduleManagerProps> = ({ show, onHide, module, extensions }) => {
    const [submodules, setSubmodules] = useState<any[]>([]);
    const [submoduleChildren, setSubmoduleChildren] = useState<any[]>([]);
    
    // Submodule form states
    const [newSubmoduleName, setNewSubmoduleName] = useState<string>("");
    const [newSubmoduleDescription, setNewSubmoduleDescription] = useState<string>("");
    const [newSubmoduleColor, setNewSubmoduleColor] = useState<string>("#000000");
    const [newSubmoduleUserExtension, setNewSubmoduleUserExtension] = useState<any>(null);
    
    // Submodule child form states
    const [newSubmoduleChildName, setNewSubmoduleChildName] = useState<string>("");
    const [newSubmoduleChildDescription, setNewSubmoduleChildDescription] = useState<string>("");
    const [newSubmoduleChildColor, setNewSubmoduleChildColor] = useState<string>("#000000");
    const [newSubmoduleChildUserExtension, setNewSubmoduleChildUserExtension] = useState<any>(null);
    const [selectedSubmoduleForChildren, setSelectedSubmoduleForChildren] = useState<any>(null);
    
    // Edit states for submodules
    const [editingSubmodule, setEditingSubmodule] = useState<any>(null);
    const [editSubmoduleName, setEditSubmoduleName] = useState<string>("");
    const [editSubmoduleDescription, setEditSubmoduleDescription] = useState<string>("");
    const [editSubmoduleColor, setEditSubmoduleColor] = useState<string>("");
    const [editSubmoduleUserExtension, setEditSubmoduleUserExtension] = useState<any>(null);
    
    // Edit states for submodule children
    const [editingSubmoduleChild, setEditingSubmoduleChild] = useState<any>(null);
    const [editSubmoduleChildName, setEditSubmoduleChildName] = useState<string>("");
    const [editSubmoduleChildDescription, setEditSubmoduleChildDescription] = useState<string>("");
    const [editSubmoduleChildColor, setEditSubmoduleChildColor] = useState<string>("");
    const [editSubmoduleChildUserExtension, setEditSubmoduleChildUserExtension] = useState<any>(null);
    const [editSubmoduleChildSubmoduleId, setEditSubmoduleChildSubmoduleId] = useState<string>("");

    const fetchSubmodules = useCallback(async () => {
        if (!module?.id) return;
        try {
            const response = await ListSubmodules({ filters: { module_id: module.id } });
            if (response?.data) {
                setSubmodules(response.data);
            }
        } catch (error) {
            console.error('Error fetching submodules:', error);
        }
    }, [module?.id]);

    const fetchSubmoduleChildren = useCallback(async (submoduleId: string) => {
        try {
            const response = await ListSubmoduleChildren({ filters: { submodule_id: submoduleId } });
            if (response?.data) {
                setSubmoduleChildren(response.data);
            }
        } catch (error) {
            console.error('Error fetching submodule children:', error);
        }
    }, []);

    useEffect(() => {
        if (show && module?.id) {
            fetchSubmodules();
        }
    }, [show, module?.id, fetchSubmodules]);

    const resetSubmoduleForms = useCallback(() => {
        setNewSubmoduleName("");
        setNewSubmoduleDescription("");
        setNewSubmoduleColor("#000000");
        setNewSubmoduleUserExtension(null);
    }, []);

    const resetSubmoduleChildForms = useCallback(() => {
        setNewSubmoduleChildName("");
        setNewSubmoduleChildDescription("");
        setNewSubmoduleChildColor("#000000");
        setNewSubmoduleChildUserExtension(null);
        setSelectedSubmoduleForChildren(null);
    }, []);

    const handleCreateSubmodule = useCallback(async () => {
        if (!newSubmoduleName.trim() || !module?.id) return;
        
        const response = await CreateSubmodule(
            newSubmoduleName,
            newSubmoduleDescription,
            module.id,
            newSubmoduleColor,
            // newSubmoduleUserExtension
        );
        
        if (response) {
            resetSubmoduleForms();
            fetchSubmodules();
        }
    }, [newSubmoduleName, newSubmoduleDescription, newSubmoduleColor, newSubmoduleUserExtension, module?.id, resetSubmoduleForms, fetchSubmodules]);

    const handleCreateSubmoduleChild = useCallback(async () => {
        if (!newSubmoduleChildName.trim() || !selectedSubmoduleForChildren) return;
        
        const response = await CreateSubmoduleChild(
            newSubmoduleChildName,
            newSubmoduleChildDescription,
            selectedSubmoduleForChildren.id,
            newSubmoduleChildColor,
            newSubmoduleChildUserExtension
        );
        
        if (response) {
            resetSubmoduleChildForms();
            fetchSubmoduleChildren(selectedSubmoduleForChildren.id);
        }
    }, [newSubmoduleChildName, newSubmoduleChildDescription, newSubmoduleChildColor, newSubmoduleChildUserExtension, selectedSubmoduleForChildren, resetSubmoduleChildForms, fetchSubmoduleChildren]);

    const handleEditSubmodule = useCallback((submodule: any) => {
        setEditingSubmodule(submodule);
        setEditSubmoduleName(submodule.name);
        setEditSubmoduleDescription(submodule.description);
        setEditSubmoduleColor(submodule.color);
        setEditSubmoduleUserExtension(submodule.user_extension);
    }, []);

    const handleUpdateSubmodule = useCallback(async () => {
        if (!editingSubmodule || !editSubmoduleName.trim()) return;
        
        const response = await UpdateSubmodule(
            editingSubmodule.id,
            editSubmoduleName,
            editSubmoduleDescription,
            module.id,
            editSubmoduleColor,
            editSubmoduleUserExtension
        );
        
        if (response) {
            setEditingSubmodule(null);
            fetchSubmodules();
        }
    }, [editingSubmodule, editSubmoduleName, editSubmoduleDescription, editSubmoduleColor, editSubmoduleUserExtension, module?.id, fetchSubmodules]);

    const handleDeleteSubmodule = useCallback(async (submodule: any) => {
        if (window.confirm(`Are you sure you want to delete submodule "${submodule.name}"?`)) {
            const response = await DeleteSubmodule(submodule.id);
            if (response) {
                fetchSubmodules();
            }
        }
    }, [fetchSubmodules]);

    const handleEditSubmoduleChild = useCallback((child: any) => {
        setEditingSubmoduleChild(child);
        setEditSubmoduleChildName(child.name);
        setEditSubmoduleChildDescription(child.description);
        setEditSubmoduleChildColor(child.color);
        setEditSubmoduleChildUserExtension(child.user_extension);
        setEditSubmoduleChildSubmoduleId(child.submodule_id);
    }, []);

    const handleUpdateSubmoduleChild = useCallback(async () => {
        if (!editingSubmoduleChild || !editSubmoduleChildName.trim()) return;
        
        const response = await UpdateSubmoduleChild(
            editingSubmoduleChild.id,
            editSubmoduleChildName,
            editSubmoduleChildDescription,
            editSubmoduleChildSubmoduleId,
            editSubmoduleChildColor,
            editSubmoduleChildUserExtension
        );
        
        if (response) {
            setEditingSubmoduleChild(null);
            fetchSubmoduleChildren(editingSubmoduleChild.submodule_id);
        }
    }, [editingSubmoduleChild, editSubmoduleChildName, editSubmoduleChildDescription, editSubmoduleChildColor, editSubmoduleChildUserExtension, editSubmoduleChildSubmoduleId, fetchSubmoduleChildren]);

    const handleDeleteSubmoduleChild = useCallback(async (child: any) => {
        if (window.confirm(`Are you sure you want to delete submodule child "${child.name}"?`)) {
            const response = await DeleteSubmoduleChild(child.id);
            if (response) {
                fetchSubmoduleChildren(child.submodule_id);
            }
        }
    }, [fetchSubmoduleChildren]);

    const handleSubmoduleSelect = useCallback((submodule: any) => {
        setSelectedSubmoduleForChildren(submodule);
        fetchSubmoduleChildren(submodule.id);
    }, [fetchSubmoduleChildren]);

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Manage Submodules - {module?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col md={6}>
                        <h5>Submodules sw</h5>
                        <div className="mb-3">
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newSubmoduleName}
                                    onChange={(e) => setNewSubmoduleName(e.target.value)}
                                    placeholder="Submodule Name"
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    value={newSubmoduleDescription}
                                    onChange={(e) => setNewSubmoduleDescription(e.target.value)}
                                    placeholder="Description"
                                    rows={2}
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Color</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="color"
                                        value={newSubmoduleColor}
                                        onChange={(e) => setNewSubmoduleColor(e.target.value)}
                                        style={{ width: '50px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={newSubmoduleColor}
                                        onChange={(e) => setNewSubmoduleColor(e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>User Extension (Optional)</Form.Label>
                                <Select
                                    value={newSubmoduleUserExtension ? {
                                        value: newSubmoduleUserExtension,
                                        label: extensions.find(ext => ext.id === newSubmoduleUserExtension)?.display_name || ""
                                    } : null}
                                    onChange={(option) => setNewSubmoduleUserExtension(option?.value || null)}
                                    options={extensions.map(ext => ({
                                        value: ext.id,
                                        label: ext.display_name
                                    }))}
                                    placeholder="Select User Extension"
                                    isClearable
                                    isSearchable
                                />
                            </Form.Group>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="mt-2"
                                onClick={handleCreateSubmodule}
                                disabled={!newSubmoduleName.trim()}
                            >
                                Create Submodule
                            </Button>
                        </div>

                        <div className="submodules-list">
                            {submodules.map((submodule) => (
                                <div key={submodule.id} className="card mb-2">
                                    <div className="card-body p-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span 
                                                    className="badge me-2" 
                                                    style={{ 
                                                        backgroundColor: submodule.color,
                                                        width: '15px',
                                                        height: '15px',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                                <strong>{submodule.name}</strong>
                                                {submodule.description && (
                                                    <small className="text-muted d-block">{submodule.description}</small>
                                                )}
                                            </div>
                                            <div className="btn-group btn-group-sm">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleEditSubmodule(submodule)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteSubmodule(submodule)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>

                    <Col md={6}>
                        <h5>Submodule Children</h5>
                        <div className="mb-3">
                            <Form.Group>
                                <Form.Label>Select Submodule</Form.Label>
                                <Select
                                    value={selectedSubmoduleForChildren ? {
                                        value: selectedSubmoduleForChildren.id,
                                        label: selectedSubmoduleForChildren.name
                                    } : null}
                                    onChange={(option) => {
                                        const submodule = submodules.find(s => s.id === option?.value);
                                        handleSubmoduleSelect(submodule);
                                    }}
                                    options={submodules.map(s => ({
                                        value: s.id,
                                        label: s.name
                                    }))}
                                    placeholder="Select Submodule"
                                    isClearable
                                />
                            </Form.Group>
                            
                            {selectedSubmoduleForChildren && (
                                <>
                                    <Form.Group className="mt-2">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newSubmoduleChildName}
                                            onChange={(e) => setNewSubmoduleChildName(e.target.value)}
                                            placeholder="Child Name"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mt-2">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            value={newSubmoduleChildDescription}
                                            onChange={(e) => setNewSubmoduleChildDescription(e.target.value)}
                                            placeholder="Description"
                                            rows={2}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mt-2">
                                        <Form.Label>Color</Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="color"
                                                value={newSubmoduleChildColor}
                                                onChange={(e) => setNewSubmoduleChildColor(e.target.value)}
                                                style={{ width: '50px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={newSubmoduleChildColor}
                                                onChange={(e) => setNewSubmoduleChildColor(e.target.value)}
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </Form.Group>
                                    <Form.Group className="mt-2">
                                        <Form.Label>User Extension (Optional)</Form.Label>
                                        <Select
                                            value={newSubmoduleChildUserExtension ? {
                                                value: newSubmoduleChildUserExtension,
                                                label: extensions.find(ext => ext.id === newSubmoduleChildUserExtension)?.display_name || ""
                                            } : null}
                                            onChange={(option) => setNewSubmoduleChildUserExtension(option?.value || null)}
                                            options={extensions.map(ext => ({
                                                value: ext.id,
                                                label: ext.display_name
                                            }))}
                                            placeholder="Select User Extension"
                                            isClearable
                                            isSearchable
                                        />
                                    </Form.Group>
                                    <Button 
                                        variant="success" 
                                        size="sm" 
                                        className="mt-2"
                                        onClick={handleCreateSubmoduleChild}
                                        disabled={!newSubmoduleChildName.trim()}
                                    >
                                        Create Child
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="submodule-children-list">
                            {submoduleChildren.map((child) => (
                                <div key={child.id} className="card mb-2">
                                    <div className="card-body p-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span 
                                                    className="badge me-2" 
                                                    style={{ 
                                                        backgroundColor: child.color,
                                                        width: '15px',
                                                        height: '15px',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                                <strong>{child.name}</strong>
                                                {child.description && (
                                                    <small className="text-muted d-block">{child.description}</small>
                                                )}
                                            </div>
                                            <div className="btn-group btn-group-sm">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleEditSubmoduleChild(child)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteSubmoduleChild(child)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>

                {/* Edit Submodule Modal */}
                {editingSubmodule && (
                    <Modal show={!!editingSubmodule} onHide={() => setEditingSubmodule(null)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Submodule</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editSubmoduleName}
                                    onChange={(e) => setEditSubmoduleName(e.target.value)}
                                    placeholder="Submodule Name"
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    value={editSubmoduleDescription}
                                    onChange={(e) => setEditSubmoduleDescription(e.target.value)}
                                    placeholder="Description"
                                    rows={2}
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Color</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="color"
                                        value={editSubmoduleColor}
                                        onChange={(e) => setEditSubmoduleColor(e.target.value)}
                                        style={{ width: '50px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={editSubmoduleColor}
                                        onChange={(e) => setEditSubmoduleColor(e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>User Extension (Optional)</Form.Label>
                                <Select
                                    value={editSubmoduleUserExtension ? {
                                        value: editSubmoduleUserExtension,
                                        label: extensions.find(ext => ext.id === editSubmoduleUserExtension)?.display_name || ""
                                    } : null}
                                    onChange={(option) => setEditSubmoduleUserExtension(option?.value || null)}
                                    options={extensions.map(ext => ({
                                        value: ext.id,
                                        label: ext.display_name
                                    }))}
                                    placeholder="Select User Extension"
                                    isClearable
                                    isSearchable
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setEditingSubmodule(null)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleUpdateSubmodule}>
                                Update
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}

                {/* Edit Submodule Child Modal */}
                {editingSubmoduleChild && (
                    <Modal show={!!editingSubmoduleChild} onHide={() => setEditingSubmoduleChild(null)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Submodule Child</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editSubmoduleChildName}
                                    onChange={(e) => setEditSubmoduleChildName(e.target.value)}
                                    placeholder="Child Name"
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    value={editSubmoduleChildDescription}
                                    onChange={(e) => setEditSubmoduleChildDescription(e.target.value)}
                                    placeholder="Description"
                                    rows={2}
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Color</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="color"
                                        value={editSubmoduleChildColor}
                                        onChange={(e) => setEditSubmoduleChildColor(e.target.value)}
                                        style={{ width: '50px' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        value={editSubmoduleChildColor}
                                        onChange={(e) => setEditSubmoduleChildColor(e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>User Extension (Optional)</Form.Label>
                                <Select
                                    value={editSubmoduleChildUserExtension ? {
                                        value: editSubmoduleChildUserExtension,
                                        label: extensions.find(ext => ext.id === editSubmoduleChildUserExtension)?.display_name || ""
                                    } : null}
                                    onChange={(option) => setEditSubmoduleChildUserExtension(option?.value || null)}
                                    options={extensions.map(ext => ({
                                        value: ext.id,
                                        label: ext.display_name
                                    }))}
                                    placeholder="Select User Extension"
                                    isClearable
                                    isSearchable
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setEditingSubmoduleChild(null)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleUpdateSubmoduleChild}>
                                Update
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SubmoduleManager;
