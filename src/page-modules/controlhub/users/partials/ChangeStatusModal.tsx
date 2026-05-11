import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { GetUserById, updateUserProfileData, DeleteUser } from '@utils/tms/tmsUserManagement';

interface ChangeStatusModalProps {
    show: boolean;
    onHide: () => void;
    row: { username?: string; name?: string; encId?: string } | null;
    newStatus: string | null;
    onSuccess?: () => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
    show,
    onHide,
    row,
    newStatus,
    onSuccess,
}) => {
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tmsUserId, setTmsUserId] = useState<number | null>(null);

    useEffect(() => {
        if (!show || !row?.username) {
            setTmsUserId(null);
            setRemarks('');
            return;
        }
        let cancelled = false;
        setLoading(true);
        GetUserById(row.username)
            .then((res: any) => {
                if (cancelled) return;
                if (res?.success && res?.data?.id != null) {
                    setTmsUserId(Number(res.data.id));
                } else {
                    setTmsUserId(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTmsUserId(null);
                    toast.error('Failed to load user data.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [show, row?.username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tmsUserId == null || !newStatus) return;
        setSubmitting(true);
        try {
            if (newStatus.toLowerCase() === 'deleted') {
                await DeleteUser(tmsUserId);
                toast.success('User deleted successfully.');
            } else {
                await updateUserProfileData(tmsUserId, { status: newStatus, remarks });
                toast.success('Status updated successfully.');
            }
            onSuccess?.();
            onHide();
            setRemarks('');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update status.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRemarks('');
        setTmsUserId(null);
        onHide();
    };

    const userName = row?.name || row?.username || 'this user';

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Change user status</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {loading ? (
                        <p className="text-muted">Loading user data...</p>
                    ) : (
                        <>
                            <p className="mb-3">
                                You are changing the status of user <strong>{userName}</strong> to{' '}
                                <strong>{newStatus}</strong>.
                            </p>
                            <Form.Group className="mb-0">
                                <Form.Label>Remarks</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter remarks (optional)"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    disabled={submitting}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || submitting || tmsUserId == null}
                    >
                        {submitting ? 'Updating...' : 'Confirm'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ChangeStatusModal;
