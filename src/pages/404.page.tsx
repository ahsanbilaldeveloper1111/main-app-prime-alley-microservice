import React from 'react';
import Layout from '@layout/index';
import type { ReactElement } from 'react';
import AccessDenied from '@components/AccessDenied';

const NotFoundPage = () => {
    return (
        <AccessDenied
            title="Page Not Found"
            message="The page you are looking for doesn't exist or has been moved."
            buttonText="Go to Home"
            buttonLink="/dashboard"
            icon="404"
            hideCallback={true}
        />
    );
};

NotFoundPage.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default NotFoundPage;