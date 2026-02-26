import React from 'react';
import FormModal from '@pages/partial/FormModal';

interface SyncLdapUsersModalProps {
    show: boolean;
    onHide: () => void;
    loading: boolean;
    responseData: any;
}

const SyncLdapUsersModal: React.FC<SyncLdapUsersModalProps> = ({
    show,
    onHide,
    loading,
    responseData
}) => {
    return (
        <FormModal
            show={show}
            onHide={onHide}
            title="Synced Users"
            desc=""
            formHtml={
                loading ? (
                    <p>Syncing users...</p>
                ) : responseData ? (
                    <table className="table table-bordered table-align-center">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Total Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>New</td>
                                <td>{responseData?.count_new_user}</td>
                            </tr>
                            <tr>
                                <td>Updated</td>
                                <td>{responseData?.count_updated_user}</td>
                            </tr>
                            <tr>
                                <td>Removed</td>
                                <td>{responseData?.count_removed_user}</td>
                            </tr>
                            <tr>
                                <td>Errors</td>
                                <td>{responseData?.count_errors}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <></>
                )
            }
            submitButtonText="Close"
            cancelButtonText="Close"
            onSubmit={onHide}
            ShowSubmitButton={false}
            submitButtonVariant="primary"
        />
    );
};

export default SyncLdapUsersModal;

