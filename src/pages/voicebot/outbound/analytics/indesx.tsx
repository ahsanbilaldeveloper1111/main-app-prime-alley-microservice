import '@assets/scss/datatable-style.scss';
import { ReactElement, useState } from 'react';
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
