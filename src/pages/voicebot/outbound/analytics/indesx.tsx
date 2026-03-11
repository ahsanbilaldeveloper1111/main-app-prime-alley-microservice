import '@assets/scss/datatable-style.scss';
import { ReactElement } from 'react';
import Layout from '@layout/index';
import ComingSoon from '@components/ComingSoon';

const Accounts = () => {
    return (
        <ComingSoon
            title="Coming Soon"
            description="This feature is under development and will be available soon."
            icon="ph-duotone ph-clock"
        />
    );
};

Accounts.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Accounts;
