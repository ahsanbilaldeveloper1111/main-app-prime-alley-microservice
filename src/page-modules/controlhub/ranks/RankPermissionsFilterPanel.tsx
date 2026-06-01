import React, { ReactNode } from 'react';

type RankPermissionsFilterPanelProps = {
    label: string;
    ariaLabel: string;
    inline?: boolean;
    children: ReactNode;
};

const FilterChips: React.FC<{ ariaLabel: string; children: ReactNode }> = ({ ariaLabel, children }) => (
    <div className="rank-permissions-page__filter-chips" aria-label={ariaLabel}>
        {children}
    </div>
);

/** Filter label + chip row; use `inline` beside bulk actions on assign page toolbar */
export const RankPermissionsFilterPanel: React.FC<RankPermissionsFilterPanelProps> = ({
    label,
    ariaLabel,
    inline = false,
    children,
}) => {
    if (inline) {
        return (
            <div className="rank-permissions-page__filter-inline">
                <span className="rank-permissions-page__filter-label">{label}</span>
                <FilterChips ariaLabel={ariaLabel}>{children}</FilterChips>
            </div>
        );
    }

    return (
        <fieldset className="rank-permissions-page__filter-panel">
            <legend className="rank-permissions-page__filter-label">{label}</legend>
            <FilterChips ariaLabel={ariaLabel}>{children}</FilterChips>
        </fieldset>
    );
};
