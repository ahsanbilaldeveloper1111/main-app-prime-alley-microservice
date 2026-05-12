import React from 'react';
import Link from 'next/link';
import { FiLock, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

interface AccessDeniedProps {
    title?: string;
    message?: string;
    buttonText?: string;
    buttonLink?: string;
    icon?: 'lock' | '404';
    hideCallback?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
    title = "Access Denied",
    message = "You don't have permission to access this page.",
    buttonText = "Back to Home",
    buttonLink = "/dashboard",
    icon = 'lock',
    hideCallback = false,
}) => {
    return (
        <div className="access-denied-wrapper">
            <div className="access-denied-content">
                <div className={`access-denied-icon ${icon === '404' ? 'not-found' : ''}`}>
                    {icon === 'lock' ? <FiLock size={40} /> : <FiAlertCircle size={40} />}
                </div>
                <h2>{title}</h2>
                <p>{message}</p>
                {!hideCallback && (
                    <Link href={buttonLink} className="back-button">
                        <FiArrowLeft size={18} />
                        <span>{buttonText}</span>
                    </Link>
                )}
            </div>
            <style>{`
                .access-denied-wrapper {
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: #f8f9fa;
                }
                
                .access-denied-content {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    width: 100%;
                }
                
                .access-denied-icon {
                    width: 80px;
                    height: 80px;
                    background: #fee2e2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    color: #dc2626;
                }

                .access-denied-icon.not-found {
                    background: #dbeafe;
                    color: #2563eb;
                }
                
                h2 {
                    color: #1f2937;
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 12px;
                }
                
                p {
                    color: #6b7280;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }
                
                .back-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #3b82f6;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .back-button:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
};

export default AccessDenied;
