import React from 'react';
import AccessDenied from '@components/AccessDenied';
import Layout from '@layout/index';
import type { ReactElement } from 'react';

const AccessDeniedPage = () => {
    return (
        <AccessDenied 
            buttonText="Go to Home"
            buttonLink="/dashboard"
            hideCallback={true}
        />
    );
};

AccessDeniedPage.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default AccessDeniedPage;
