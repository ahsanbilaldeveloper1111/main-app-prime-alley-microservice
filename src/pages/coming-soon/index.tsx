import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import { useSession } from 'next-auth/react';
import ComingSoon from '@components/ComingSoon';


const Accounts = () => {
    const { data:session, status } = useSession();
   
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
   
    
    return (
        <React.Fragment>
            <ComingSoon 
                title="Coming Soon"
                description="This feature is under development and will be available soon."
                icon="ph-duotone ph-clock"
            />
        </React.Fragment>
    );
};

Accounts.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Accounts;
