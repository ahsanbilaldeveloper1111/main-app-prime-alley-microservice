import React, { useState, useRef } from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';
import { FiMoreVertical,FiArrowDown,FiArrowUp, FiChevronDown } from 'react-icons/fi';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface DatatableActionButtonProps {
  actions: ActionItem[];
  placement?: 'left' | 'right' | 'top' | 'bottom';
}

const DatatableActionButton: React.FC<DatatableActionButtonProps> = ({ 
  actions, 
  placement = 'left' 
}) => {
  const [show, setShow] = useState(false);
  const target = useRef(null);

  return (
    <div className="table-action-dropdown">
      <Button
        ref={target}
        className="app-button gap-0"
        variant="outline-secondary"
        size="sm"
        onClick={() => setShow(!show)}
      >
         Actions
         <FiChevronDown />
      </Button>

      <Overlay
        show={show}
        target={target.current}
        placement={placement}
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover className="action-menu-popover">
          <Popover.Body className="p-0">
            <div className="action-menu">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={`action-item ${action.className || ''}`}
                  onClick={() => {
                    action.onClick();
                    setShow(false);
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
};

export default DatatableActionButton;
