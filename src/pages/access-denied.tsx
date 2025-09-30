import React from 'react';
import { useRouter } from 'next/router';
import AccessDenied from '@components/AccessDenied';
import Layout from '@layout/index';
import type { ReactElement } from 'react';

const AccessDeniedPage = () => {
    const router = useRouter();
    const { callbackUrl } = router.query;

    return (
        <AccessDenied 
            buttonText={callbackUrl ? "Try Again" : "Go to Dashboard"}
            buttonLink={callbackUrl as string || "/dashboard"}
        />
    );
};

AccessDeniedPage.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default AccessDeniedPage;
