import React, { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'react-bootstrap';

const MAIN_CONTENT_SELECTOR = '.main-content-wrapper';
const MOBILE_MAX_WIDTH_PX = 575.98;

type RankPermissionsMobileSaveBarProps = {
    onSave: () => void;
};

/** Fixed save bar aligned to main content (mobile only). */
export const RankPermissionsMobileSaveBar: React.FC<RankPermissionsMobileSaveBarProps> = ({
    onSave,
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [anchorStyle, setAnchorStyle] = useState<CSSProperties>({ visibility: 'hidden' });

    useEffect(() => {
        const media = globalThis.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
        const syncMobile = () => setIsMobile(media.matches);
        syncMobile();
        media.addEventListener('change', syncMobile);
        return () => media.removeEventListener('change', syncMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) return;

        const updatePosition = () => {
            const main = document.querySelector(MAIN_CONTENT_SELECTOR);
            if (!main) return;
            const rect = main.getBoundingClientRect();
            setAnchorStyle({
                position: 'fixed',
                bottom: 0,
                left: rect.left,
                width: rect.width,
                zIndex: 1020,
                visibility: 'visible',
                boxSizing: 'border-box',
            });
        };

        updatePosition();
        globalThis.addEventListener('resize', updatePosition);
        globalThis.addEventListener('scroll', updatePosition, true);

        const main = document.querySelector(MAIN_CONTENT_SELECTOR);
        const contentArea = document.querySelector('.app-content-area');
        contentArea?.addEventListener('transitionend', updatePosition);

        const resizeObserver =
            main && typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(updatePosition)
                : null;
        if (main) {
            resizeObserver?.observe(main);
        }

        return () => {
            globalThis.removeEventListener('resize', updatePosition);
            globalThis.removeEventListener('scroll', updatePosition, true);
            contentArea?.removeEventListener('transitionend', updatePosition);
            resizeObserver?.disconnect();
        };
    }, [isMobile]);

    if (!isMobile) return null;

    return createPortal(
        <div
            className="rank-permissions-page__mobile-sticky-bar rank-permissions-page__mobile-sticky-bar--fixed"
            style={anchorStyle}
        >
            <Button variant="primary" onClick={onSave}>
                Update Permissions
            </Button>
        </div>,
        document.body
    );
};
