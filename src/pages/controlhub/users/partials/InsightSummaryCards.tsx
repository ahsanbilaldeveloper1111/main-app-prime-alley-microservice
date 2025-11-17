import React from 'react';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';

const InsightSummaryCards: React.FC = () => {
    const cards: SummaryCard[] = [
        {
            id: 'peak-activity',
            title: 'Peak Activity ',
            value: 100,
            description: 'Peak activity hours/day(s)',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'lowest-activity',
            title: 'Lowest Activity',
            value: 100,
            description: 'Lowest activity (hours/days)',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'weekend-activity',
            title: 'Total Weekend Login',
            value: 100,
            description: 'Total Weekend Logins',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        }
    ];

    return <PageSummaryGrid cards={cards} />;
};

export default InsightSummaryCards;

