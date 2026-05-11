import React from "react";

interface APIProgressSectionProps {
    isUpdateMode: boolean;
}

const APIProgressSection: React.FC<APIProgressSectionProps> = ({
    isUpdateMode,
}) => {
    return (
        <div className="api-progress-section mt-4">
            <h5 className="text-primary mb-3">
                <i className="ph-duotone ph-gear-six me-2"></i>
                {isUpdateMode ? "System Update Progress" : "System Processing Progress"}
            </h5>
        </div>
    );
};

export default APIProgressSection;
