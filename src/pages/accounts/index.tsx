import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import ComingSoon from '@components/ComingSoon';


const Accounts = () => {
    const { data:session, status } = useSession();
   
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
   
    
    return (
        <React.Fragment>
            <ComingSoon 
                title="Billing"
                description="Billing features are under development and will be available soon."
                icon="ph-duotone ph-users"
            />
        </React.Fragment>
    );
};

Accounts.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Accounts;
