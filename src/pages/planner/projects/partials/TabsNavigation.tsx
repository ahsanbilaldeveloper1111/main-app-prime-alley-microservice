import React from 'react';

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabsNavigation: React.FC<TabsNavigationProps> = ({ activeTab, onTabChange }) => {
  const styles = {
    tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
    tabsInner: { margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
    tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const }
  };

  return (
    <div style={styles.tabsContainer}>
      <div style={styles.tabsInner}>
        {['Overview', 'Board', 'List', 'Members', 'Statuses', 'Labels'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab.toLowerCase())}
            style={{
              ...styles.tab,
              color: activeTab === tab.toLowerCase() ? '#4680FF' : '#6B7280',
              borderBottom: activeTab === tab.toLowerCase() ? '2px solid #4680FF' : '2px solid transparent'
            } as React.CSSProperties}
            onMouseOver={(e) => {
              if (activeTab !== tab.toLowerCase()) {
                e.currentTarget.style.color = '#4680FF';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab.toLowerCase()) {
                e.currentTarget.style.color = '#6B7280';
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabsNavigation;
