import React,{ReactElement, useEffect, useState,useRef} from 'react'
import Layout from '@layout/index'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import "@assets/scss/dashboard.scss";
import "@assets/scss/common.scss";
import { HEADER_CONSTANTS } from '@constants/headerConstants';
const { BASE_URL, MENU_LABELS, SUBMENU_LABELS, ICONS, PERMISSIONS } = HEADER_CONSTANTS;



import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import KPIMeter from '@components/kpis-meter';
import { 
  Users, 
  Ticket, 
  ShoppingCart, 
  UserPlus, 
  Zap, 
  Smartphone,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';




import "@assets/scss/ticketsnew.scss";
  import { Analytics1, Analytics2, Analytics3, Analytics4, Analytics5, Analytics6, Analytics7 } from '@components/analytics-types';

// Module type definition
interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  disabled?: boolean;
  stats: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    trend: number;
    revenue?: string;
  };
}

// Week day interface
interface WeekDay {
  day: string;
  date: string;
  fullDate: string;
}

// Animated KPI Card Component with Count-Up Effect
interface AnimatedKPICardProps {
  label: string;
  value: number;
  trend: number;
  color: string;
  isTransitioning: boolean;
}

const AnimatedKPICard: React.FC<AnimatedKPICardProps> = ({ label, value, trend, color, isTransitioning }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    setIsAnimating(true);
    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(Math.round(increment * currentStep));
      } else {
        setDisplayValue(value);
        setIsAnimating(false);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div 
      className="bg-white rounded-3 shadow-sm p-3 h-100"
      style={{
        transition: 'all 0.4s ease',
        opacity: isTransitioning ? 0.7 : 1,
        transform: isTransitioning ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {label}
        </span>
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ 
            width: '32px', 
            height: '32px', 
            backgroundColor: `${color}15`,
            transition: 'all 0.3s ease'
          }}
        >
          <Activity size={16} style={{ color }} />
        </div>
      </div>
      <div className="mb-2">
        <h3 
          className="mb-0 fw-bold"
          style={{ 
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: '#1f2937',
            transition: 'all 0.3s ease'
          }}
        >
          {displayValue.toLocaleString()}
        </h3>
      </div>
      <div className="d-flex align-items-center gap-1">
        {trend > 0 ? (
          <TrendingUp size={14} className="text-success" />
        ) : (
          <TrendingDown size={14} className="text-danger" />
        )}
        <span 
          className={trend > 0 ? 'text-success' : 'text-danger'}
          style={{ fontSize: '0.813rem', fontWeight: 600 }}
        >
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
        </span>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
          vs last week
        </span>
      </div>
    </div>
  );
};


const DashboardUnifiedWorkspace = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // State management
  const [selectedModule, setSelectedModule] = useState<string>('crm');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [autoSlide, setAutoSlide] = useState<boolean>(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth >= 1200);
  const [activeScreen, setActiveScreen] = useState<string>('manager-dashboard');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const carouselRef = useRef<NodeJS.Timeout | null>(null);
  const dashboardContentRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await dashboardContentRef.current?.requestFullscreen();
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Handle window resize to manage sidebar state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modules data
  const modules: Module[] = [
    {
      id: 'crm',
      name: 'CRM',
      icon: <Users size={24} />,
      color: '#4F46E5',
      bgColor: 'rgba(79, 70, 229, 0.1)',
      stats: {
        total: 1247,
        active: 892,
        pending: 268,
        completed: 328,
        trend: 18.5,
        revenue: '$2.4M'
      }
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: <DollarSign size={24} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      stats: {
        total: 856,
        active: 642,
        pending: 124,
        completed: 690,
        trend: 24.3,
        revenue: '$3.8M'
      }
    },
    {
      id: 'tickets',
      name: 'Tickets',
      icon: <Ticket size={24} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      stats: {
        total: 432,
        active: 186,
        pending: 98,
        completed: 246,
        trend: -5.2,
        revenue: '$0.5M'
      }
    },
    {
      id: 'vendor',
      name: 'Vendor',
      icon: <ShoppingCart size={24} />,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      disabled: true,
      stats: {
        total: 124,
        active: 98,
        pending: 18,
        completed: 108,
        trend: 12.8,
        revenue: '$1.2M'
      }
    },
    {
      id: 'reseller',
      name: 'Reseller',
      icon: <UserPlus size={24} />,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      stats: {
        total: 67,
        active: 52,
        pending: 8,
        completed: 59,
        trend: 8.4,
        revenue: '$890K'
      }
    },
    {
      id: 'automation',
      name: 'Automation',
      icon: <Zap size={24} />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      stats: {
        total: 245,
        active: 198,
        pending: 32,
        completed: 213,
        trend: 32.6,
        revenue: '$650K'
      }
    },
    {
      id: 'gsm',
      name: 'GSM',
      icon: <Smartphone size={24} />,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      stats: {
        total: 534,
        active: 412,
        pending: 86,
        completed: 448,
        trend: 15.7,
        revenue: '$1.9M'
      }
    }
  ];

  // Get current week days
  const getWeekDays = (): WeekDay[] => {
    const days = [];
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
        date: date.getDate().toString(),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Set default selected day to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDay(today);
  }, []);

  // Carousel auto-slide logic - cycles through days then modules (no slide, just active state change)
  useEffect(() => {
    if (autoSlide && !isPaused) {
      carouselRef.current = setInterval(() => {
        setCurrentDayIndex((prevDayIndex) => {
          const nextDayIndex = (prevDayIndex + 1) % 7;
          
          // Update selected day to match the day index
          const newDay = weekDays[nextDayIndex];
          setSelectedDay(newDay.fullDate);
          
          // When we complete all 7 days (wrap back to 0), switch to next module
          if (nextDayIndex === 0) {
            setSelectedModule((prevSelectedId) => {
              const currentIndex = modules.findIndex(m => m.id === prevSelectedId);
              let nextIndex = (currentIndex + 1) % modules.length;
              let nextModule = modules[nextIndex];
              
              // Skip disabled modules in auto-slide
              while (nextModule.disabled) {
                nextIndex = (nextIndex + 1) % modules.length;
                nextModule = modules[nextIndex];
                // Prevent infinite loop if all modules are disabled
                if (nextIndex === currentIndex) break;
              }
              
              // NO carousel sliding - cards stay in place, only active state changes
              
              return nextModule.id;
            });
          }
          
          return nextDayIndex;
        });
      }, 5000); // 5 seconds per day (increased from 3 seconds)

      return () => {
        if (carouselRef.current) {
          clearInterval(carouselRef.current);
        }
      };
    } else {
      if (carouselRef.current) {
        clearInterval(carouselRef.current);
      }
    }
  }, [autoSlide, isPaused, modules.length, weekDays]);

  // Get visible modules for carousel (show 4 at a time on desktop, adjust for responsive)
  const getVisibleModules = () => {
    const visible = [];
    for (let i = 0; i < modules.length; i++) {
      const index = (currentSlideIndex + i) % modules.length;
      visible.push(modules[index]);
    }
    return visible;
  };

  const visibleModules = getVisibleModules();
  const currentModule = modules.find(m => m.id === selectedModule);

  // Handle module click
  const handleModuleClick = (moduleId: string) => {
    const moduleItem = modules.find(m => m.id === moduleId);
    if (moduleItem?.disabled) return; // Don't allow clicking disabled modules
    setSelectedModule(moduleId);
    setAutoSlide(false);
  };

  // Auto-scroll carousel to keep active module visible
  useEffect(() => {
    const activeIndex = modules.findIndex(m => m.id === selectedModule);
    if (activeIndex !== -1) {
      // If active card is beyond the 6th visible position, slide forward
      if (activeIndex >= currentSlideIndex + 6) {
        setCurrentSlideIndex(Math.max(0, Math.min(activeIndex - 5, modules.length - 6)));
      }
      // If active card is before the visible range, slide backward
      else if (activeIndex < currentSlideIndex) {
        setCurrentSlideIndex(activeIndex);
      }
    }
  }, [selectedModule, modules, currentSlideIndex]);

  // Trigger transition animation when module or day changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [selectedModule, currentDayIndex]);

  // Generate dynamic KPI data based on selected module and current day
  const getModuleKPIData = () => {
    if (!currentModule) return [];
    
    // Base multiplier changes per day (simulating daily variations)
    const dayMultipliers = [1.0, 0.95, 1.05, 0.98, 1.08, 1.02, 0.92];
    const dayMultiplier = dayMultipliers[currentDayIndex];
    
    // Generate dynamic values based on module and day
    const baseTotal = currentModule.stats.total;
    const baseActive = currentModule.stats.active;
    const basePending = currentModule.stats.pending;
    const baseCompleted = currentModule.stats.completed;
    
    return [
      {
        label: 'Total Records',
        value: Math.round(baseTotal * dayMultiplier),
        trend: currentModule.stats.trend,
        color: currentModule.color
      },
      {
        label: 'Active',
        value: Math.round(baseActive * dayMultiplier),
        trend: currentModule.stats.trend + (currentDayIndex * 2),
        color: '#10b981'
      },
      {
        label: 'Pending',
        value: Math.round(basePending * dayMultiplier * 0.9),
        trend: currentModule.stats.trend - (currentDayIndex * 1.5),
        color: '#f59e0b'
      },
      {
        label: 'Completed',
        value: Math.round(baseCompleted * dayMultiplier * 1.1),
        trend: currentModule.stats.trend + (currentDayIndex * 3),
        color: '#3b82f6'
      }
    ];
  };

  const moduleKPIData = getModuleKPIData();

  // Map each module to its unique analytics component
  const getAnalyticsComponent = () => {
    const moduleAnalyticsMap: Record<string, React.ReactNode> = {
      'crm': <Analytics1 />,
      'billing': <Analytics2 />,
      'tickets': <Analytics3 />,
      'vendor': <Analytics4 />,
      'reseller': <Analytics5 />,
      'automation': <Analytics6 />,
      'gsm': <Analytics7 />
    };
    return moduleAnalyticsMap[selectedModule] || <Analytics1 />;
  };

    return (
        <React.Fragment>
{/* Main Content Area */}

      <div 
        ref={dashboardContentRef}
        
        style={{
          backgroundColor: isFullScreen ? '#f8f9fa' : 'transparent',
          overflow: isFullScreen ? 'auto' : 'visible'
        }}
      >
        <Container fluid className="" style={{marginTop: isFullScreen ? '24px' : '0px', maxWidth: '100%', overflowX: 'hidden'}}>
          {/* Header */}
          <Row className="mb-3 mb-md-4 g-3" style={{ display: isFullScreen ? 'none' : 'flex' }}>
            <Col xs={12} md={6} lg={7} xl={8}>
              <h2 className="mb-1 fw-bold" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: '#1f2937' }}>Manager Dashboard</h2>
              <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.813rem, 1.5vw, 0.875rem)' }}>Monitor and analyze all modules performance</p>
            </Col>
            <Col xs={12} md={6} lg={5} xl={4} className="d-flex align-items-center justify-content-md-end">
              <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">
                <div className="d-flex align-items-center" style={{ minWidth: 'fit-content' }}>
                  <Form.Check 
                    type="switch"
                    id="auto-slide-switch"
                    label="Auto Slide"
                    checked={autoSlide}
                    onChange={(e) => setAutoSlide(e.target.checked)}
                    style={{ fontSize: '0.875rem' }}
                    className="mb-0"
                  />
                </div>
                <Button 
                  onClick={toggleFullScreen}
                  className="btn-icon-text"
                  style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    border: isFullScreen ? 'none' : '1px solid #e0e6ed',
                    borderRadius: '0.375rem',
                    background: isFullScreen ? 'linear-gradient(60deg, #ef5350, #e53935)' : '#ffffff',
                    color: isFullScreen ? '#ffffff' : '#4c5667',
                    boxShadow: isFullScreen ? '0 4px 20px 0 rgba(239, 83, 80, 0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minWidth: 'fit-content'
                  }}
                  onMouseEnter={(e) => {
                    if (!isFullScreen) {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#d0d5dd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isFullScreen) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e0e6ed';
                    }
                  }}
                >
                  {isFullScreen ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      </svg>
                      <span>Exit Full Screen</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                      <span>Full Screen</span>
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Section 1: Module Carousel with Navigation Arrows */}
          <style>{`
            * {
              box-sizing: border-box;
            }
            .container-fluid {
              overflow-x: hidden !important;
            }
            .row {
              margin-left: -0.75rem;
              margin-right: -0.75rem;
            }
            .row > * {
              padding-left: 0.75rem;
              padding-right: 0.75rem;
            }
            @media (max-width: 576px) {
              .row {
                margin-left: -0.5rem;
                margin-right: -0.5rem;
              }
              .row > * {
                padding-left: 0.5rem;
                padding-right: 0.5rem;
              }
            }
            .carousel-slide .card-body {
              padding: 10px 16px !important;
            }
            @media (max-width: 768px) {
              .carousel-slide .card-body {
                padding: 0.75rem !important;
              }
            }
            .module-card {
              transition: all 0.3s ease;
              cursor: pointer;
            }
            .module-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
            }
            .module-card-active {
              border: 1px solid #1a73e8 !important;
              background: #e8f0fe !important;
              
              box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2) !important;
            }
            .module-card-disabled {
              background: #f5f5f5 !important;
              opacity: 0.6;
              cursor: not-allowed !important;
              pointer-events: none;
            }
            .module-card-disabled:hover {
              transform: none !important;
              box-shadow: none !important;
            }
            .module-card-disabled .text-muted,
            .module-card-disabled h2,
            .module-card-disabled span {
              color: #9e9e9e !important;
            }
            @media (max-width: 992px) {
              .module-card .card-body {
                padding: 0.75rem !important;
              }
              .module-card h2 {
                font-size: 1.5rem !important;
              }
            }
            @media (max-width: 576px) {
              .module-card .card-body {
                padding: 1rem !important;
              }
              .module-card h2 {
                font-size: 1.75rem !important;
              }
            }
            .timeline {
              list-style: none;
              padding-left: 30px;
              position: relative;
            }
            .timeline::before {
              content: '';
              position: absolute;
              left: 8px;
              top: 0;
              bottom: 0;
              width: 2px;
              background: #dee2e6;
            }
            .timeline-item {
              position: relative;
              padding-left: 30px;
              transition: all 0.3s ease;
              margin-bottom: 3.6rem !important;
            }
            .timeline-item::before {
              content: '';
              position: absolute;
              left: -30px;
              top: 5px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: white;
              border: 2px solid #dee2e6;
              z-index: 1;
              transition: all 0.3s ease;
            }
            .timeline-item:hover::before {
              border-color: #0d6efd;
              transform: scale(1.2);
            }
            .timeline-item.active::before {
              background: #0d6efd;
              border-color: #0d6efd;
              box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25);
            }
            .timeline-item.active h6 {
              color: #0d6efd;
            }
            .carousel-container {
              position: relative;
              overflow: hidden;
              width: 100%;
            }
            .carousel-track {
              display: flex;
              flex-wrap: nowrap;
              
              transform: translateX(0);
              transition: transform 0.5s ease-in-out;
            }
            .carousel-slide {
              flex: 0 0 calc((100% - 5rem) / 6);
              min-width: calc((100% - 5rem) / 6);
              max-width: calc((100% - 5rem) / 6);
            }
            @media (max-width: 1400px) {
              .carousel-slide {
                flex: 0 0 calc((100% - 4rem) / 5);
                min-width: calc((100% - 4rem) / 5);
                max-width: calc((100% - 4rem) / 5);
              }
            }
            @media (max-width: 1200px) {
              .carousel-slide {
                flex: 0 0 calc((100% - 3rem) / 4);
                min-width: calc((100% - 3rem) / 4);
                max-width: calc((100% - 3rem) / 4);
              }
            }
            .carousel-nav-btn {
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              z-index: 10;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: white;
              border: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .carousel-nav-btn:hover {
              background: #f3f4f6;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .carousel-nav-btn:disabled {
              opacity: 0.4;
              cursor: not-allowed;
            }
            .carousel-nav-btn:disabled:hover {
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .carousel-nav-btn-left {
              left: -20px;
            }
            .carousel-nav-btn-right {
              right: -20px;
            }
            .progress-tracker {
              position: relative;
              padding: 0.75rem 0;
              background-color: transparent;
              height: 1.5rem;
            }
            .progress-tracker-line {
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 2px;
              background-color: #dee2e6;
              border-radius: 2px;
              transform: translateY(-50%);
            }
            .progress-points-container {
              position: relative;
              height: 100%;
              z-index: 10;
            }
            .progress-point {
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: white;
              border: 2px solid #dee2e6;
              cursor: pointer;
              transition: all 0.3s ease;
              z-index: 1;
            }
            .progress-point:hover {
              border-color: #0d6efd;
              transform: translate(-50%, -50%) scale(1.2);
            }
            .progress-point.active {
              background-color: #0d6efd;
              border-color: #0d6efd;
              box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25);
            }
            .analytics-carousel-container {
              position: relative;
              width: 100%;
              height: auto;
              overflow: visible;
            }
            .analytics-view {
              min-width: 100%;
              max-width: 100%;
              width: 100%;
              flex-shrink: 0;
              box-sizing: border-box;
              opacity: 1;
              transform: translateY(0);
              transition: opacity 0.4s ease, transform 0.4s ease;
            }
            .analytics-view.transitioning {
              opacity: 0;
              transform: translateY(10px);
            }
            .analytics-view * {
              box-sizing: border-box;
            }
            @keyframes countUp {
              from { opacity: 0; transform: translateY(5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-count {
              animation: countUp 0.5s ease;
            }
            
            /* Chart Animation Styles */
            .analytics-view .recharts-wrapper {
              animation: chartFadeIn 0.6s ease;
            }
            
            @keyframes chartFadeIn {
              from {
                opacity: 0;
                transform: scale(0.98);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            .analytics-view .recharts-bar,
            .analytics-view .recharts-line,
            .analytics-view .recharts-area,
            .analytics-view .recharts-pie {
              animation: chartElementDraw 0.8s ease;
            }
            
            @keyframes chartElementDraw {
              from {
                opacity: 0;
                transform: scaleY(0);
                transform-origin: bottom;
              }
              to {
                opacity: 1;
                transform: scaleY(1);
              }
            }
            
            /* Smooth transitions for all chart elements */
            .analytics-view .recharts-bar rect,
            .analytics-view .recharts-line path,
            .analytics-view .recharts-area path {
              transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

          `}</style>
          <div className="mb-3 mb-md-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                  <h6 className="mb-0" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontWeight: 600, color: '#1f2937' }}>
                    Business Modules Overview
                  </h6>
                  <div className="d-flex gap-2 align-items-center">
                    <span style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.813rem)', color: '#6b7280' }}>
                      {currentSlideIndex + 1} - {Math.min(currentSlideIndex + 6, modules.length)} of {modules.length}
                    </span>
                  </div>
                </div>
                <div style={{ position: 'relative', padding: '0 5px' }} className="px-lg-4">
              {/* Left Arrow */}
              <button
                className="carousel-nav-btn carousel-nav-btn-left d-none d-lg-flex"
                onClick={() => {
                  setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                  setAutoSlide(false);
                }}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft size={20} color="#1f2937" />
              </button>

              {/* Carousel Content - Desktop (Smooth sliding with 6 visible cards) */}
              <div className="carousel-container d-none d-lg-block">
                <div 
                  className="carousel-track"
                  style={{
                    justifyContent: 'flex-start',
                    gap: '1rem',
                    transform: `translateX(-${currentSlideIndex * (100 / 6)}%)`,
                    transition: 'transform 0.5s ease-in-out'
                  }}
                >
                  {modules.map((module) => (
                    <div 
                      key={module.id}
                      className="carousel-slide"
                      onClick={() => handleModuleClick(module.id)}
                      style={{ cursor: module.disabled ? 'not-allowed' : 'pointer' }}
                    >
                      <Card 
                        className={`shadow-sm module-card ${selectedModule === module.id && !module.disabled ? 'module-card-active' : ''} ${module.disabled ? 'module-card-disabled' : ''}`}
                      >
                        <Card.Body>
                          <div className="d-flex align-items-end justify-content-between mb-3">
                            <div style={{ color: module.disabled ? '#9e9e9e' : module.color }}>
                              {module.icon}
                            </div>
                            <div className="text-end">
                              <p 
                                className="text-muted text-uppercase small mb-1" 
                                style={{ fontSize: '0.75rem', fontWeight: 500 }}
                              >
                                {module.name} {selectedModule === module.id }
                              </p>
                            </div>
                          </div>
                          <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                            {module.stats.total.toLocaleString()}
                          </h2>
                          <div className="d-flex align-items-center justify-content-end mt-2">
                            {module.stats.trend > 0 && (
                              <TrendingUp 
                                size={16} 
                                className="text-success" 
                                style={{ marginRight: '0.25rem' }}
                              />
                            )}
                            <span 
                              className={`small ${module.stats.trend > 0 ? 'text-success' : 'text-danger'}`} 
                              style={{ fontSize: '0.8rem', fontWeight: 500 }}
                            >
                              {module.stats.trend > 0 ? '+' : ''}{module.stats.trend}%
                            </span>
                            <span 
                              className="text-muted small ms-1" 
                              style={{ fontSize: '0.8rem' }}
                            >
                              {module.stats.revenue}
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile/Tablet version - Show all with proper grid */}
              <Row className="g-3 d-lg-none">
                {modules.map((module) => (
                  <Col 
                    key={`mobile-${module.id}`}
                    xs={12} 
                    sm={6} 
                    md={4}
                    onClick={() => handleModuleClick(module.id)}
                    style={{ cursor: module.disabled ? 'not-allowed' : 'pointer' }}
                  >
                    <Card 
                      className={`shadow-sm module-card ${selectedModule === module.id && !module.disabled ? 'module-card-active' : ''} ${module.disabled ? 'module-card-disabled' : ''}`}
                    >
                      <Card.Body>
                        <div className="d-flex align-items-end justify-content-between mb-3">
                          <div style={{ color: module.disabled ? '#9e9e9e' : module.color }}>
                            {module.icon}
                          </div>
                          <div className="text-end">
                            <p 
                              className="text-muted text-uppercase small mb-1" 
                              style={{ fontSize: '1rem', fontWeight: 500 }}
                            >
                              {module.name} {selectedModule === module.id }
                            </p>
                          </div>
                        </div>
                        <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                          {module.stats.total.toLocaleString()}
                        </h2>
                        <div className="d-flex align-items-center justify-content-end mt-2">
                          {module.stats.trend > 0 && (
                            <TrendingUp 
                              size={16} 
                              className="text-success" 
                              style={{ marginRight: '0.25rem' }}
                            />
                          )
                          }
                          <span 
                            className={`small ${module.stats.trend > 0 ? 'text-success' : 'text-danger'}`} 
                            style={{ fontSize: '0.9rem', fontWeight: 500 }}
                          >
                            {module.stats.trend > 0 ? '+' : ''}{module.stats.trend}%
                          </span>
                          <span 
                            className="text-muted small ms-1" 
                            style={{ fontSize: '0.9rem' }}
                          >
                            {module.stats.revenue}
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Right Arrow */}
              <button
                className="carousel-nav-btn carousel-nav-btn-right d-none d-lg-flex"
                onClick={() => {
                  setCurrentSlideIndex((prev) => Math.min(modules.length - 6, prev + 1));
                  setAutoSlide(false);
                }}
                disabled={currentSlideIndex >= modules.length - 6}
              >
                <ChevronRight size={20} color="#1f2937" />
              </button>
            </div>
            
            {/* Horizontal Separator */}
            <hr style={{ margin: '1.4rem 0px 0.8rem 0', border: 'none', borderTop: '1px solid #dadce0' }} />
            
            {/* Horizontal Progress Tracker Timeline - Desktop only */}
            <div className="progress-tracker d-none d-lg-block" style={{ marginTop: '0.5rem' }}>
              <div className="progress-tracker-line"></div>
              <div className="progress-points-container">
                {modules.map((module, index) => {
                  // Calculate percentage-based positions to span full width
                  const percentage = ((index + 1) / (modules.length + 1)) * 100;
                  
                  const currentIndex = modules.findIndex(m => m.id === selectedModule);
                  const isActive = index <= currentIndex;
                  
                  return (
                    <div
                      key={`progress-${module.id}`}
                      className={`progress-point ${isActive ? 'active' : ''}`}
                      style={{ left: `${percentage}%` }}
                      onClick={() => {
                        handleModuleClick(module.id);
                        // Scroll carousel to show the clicked module in view
                        const newSlideIndex = Math.max(0, Math.min(index, modules.length - 6));
                        setCurrentSlideIndex(newSlideIndex);
                      }}
                    />
                  );
                })}
              </div>
            </div>
              </Card.Body>
            </Card>
          </div>

        {/* Modern Week Navigation Cards */}
        <div className="mb-3">
          <style>{`
            .week-nav-container {
              position: relative;
              background: #f8f9fa;
              border-radius: 50px;
              padding: 4px;
              display: flex;
              gap: 4px;
            }
            .week-nav-track {
              position: absolute;
              top: 4px;
              bottom: 4px;
              background: #3b82f6;
              border-radius: 46px;
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
              z-index: 1;
            }
            .week-nav-card {
              position: relative;
              cursor: pointer;
              transition: all 0.3s ease;
              background: transparent;
              border: none;
              overflow: visible;
              z-index: 2;
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0.75rem 0.5rem;
              border-radius: 46px;
            }
            .week-nav-card:hover .day-name {
              transform: scale(1.05);
            }
            .week-nav-card.active .day-name {
              color: white !important;
              font-weight: 700;
            }
            .week-nav-card.completed .completion-badge {
              opacity: 1;
              transform: scale(1);
            }
            .completion-badge {
              position: absolute;
              top: 2px;
              right: 2px;
              width: 14px;
              height: 14px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transform: scale(0);
              transition: all 0.3s ease;
              z-index: 3;
            }
            .day-name {
              font-size: 0.8rem;
              font-weight: 600;
              color: #6b7280;
              transition: all 0.3s ease;
              text-align: center;
              white-space: nowrap;
            }
            .week-progress-bar {
              height: 4px;
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 0.75rem;
            }
            .week-progress-fill {
              height: 100%;
              background: #3b82f6;
              border-radius: 4px;
              transition: width 0.4s ease;
            }
            @media (max-width: 768px) {
              .week-nav-container {
                flex-wrap: wrap;
              }
              .week-nav-card {
                flex: 0 0 calc(33.333% - 4px);
                min-width: calc(33.333% - 4px);
              }
              .day-name {
                font-size: 0.7rem;
              }
            }
          `}</style>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3 p-md-4">
              <div className="flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2" style={{ display: isFullScreen ? 'none' : 'flex' }}>
                <h6 className="mb-0" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontWeight: 600, color: '#1f2937' }}>
                  Week Navigation
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 'clamp(0.688rem, 1.5vw, 0.75rem)', fontWeight: 600, color: '#3b82f6' }}>
                    Day {currentDayIndex + 1}/7
                  </span>
                  <span style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.7rem)', color: '#9ca3af' }}>•</span>
                  <span style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.7rem)', color: '#6b7280' }}>
                    {Math.round(((currentDayIndex + 1) / 7) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="week-nav-container d-none d-md-flex">
                {/* Moving capsule track */}
                <div 
                  className="week-nav-track"
                  style={{
                    left: `calc(${(currentDayIndex / 7) * 100}% + 4px)`,
                    width: `calc(${100 / 7}% - 4px)`
                  }}
                />
                
                {/* Day cards */}
                {weekDays.map((day, index) => {
                  const isActive = index === currentDayIndex;
                  const isCompleted = index < currentDayIndex;
                  
                  return (
                    <div 
                      key={day.fullDate}
                      className={`week-nav-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => {
                        setSelectedDay(day.fullDate);
                        setCurrentDayIndex(index);
                        setAutoSlide(false);
                      }}
                    >
                      {isCompleted && (
                        <div className="completion-badge">
                          <CheckCircle size={8} color="white" />
                        </div>
                      )}
                      <div className="day-name">{day.day}</div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile version - Grid layout */}
              <Row className="g-2 d-md-none mb-2">
                {weekDays.map((day, index) => {
                  const isActive = index === currentDayIndex;
                  const isCompleted = index < currentDayIndex;
                  
                  return (
                    <Col key={day.fullDate} xs={4}>
                      <div 
                        className="week-nav-card"
                        style={{
                          background: isActive ? '#3b82f6' : '#f8f9fa',
                          borderRadius: '12px',
                          padding: '0.75rem 0.5rem'
                        }}
                        onClick={() => {
                          setSelectedDay(day.fullDate);
                          setCurrentDayIndex(index);
                          setAutoSlide(false);
                        }}
                      >
                        {isCompleted && (
                          <div className="completion-badge">
                            <CheckCircle size={8} color="white" />
                          </div>
                        )}
                        <div className="day-name" style={{ color: isActive ? 'white' : '#6b7280' }}>{day.day}</div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              
              {/* Progress Bar */}
              <div className="week-progress-bar" style={{ display: isFullScreen ? 'none' : 'block' }}>
                <div 
                  className="week-progress-fill"
                  style={{ width: `${((currentDayIndex + 1) / 7) * 100}%` }}
                />
              </div>
            </Card.Body>
          </Card>
        </div>
        

        {/* Display Screen */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card 
              className="border shadow-sm" 
              style={{ 
                borderRadius: '0.8rem',
                background: '#ffffff',
                borderColor: '#dadce0',
                position: 'relative'
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                  <h6 className="fw-bold mb-0" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#202124' }}>
                    {currentModule?.name} Analytics Dashboard
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                      {weekDays[currentDayIndex]?.day} - Day {currentDayIndex + 1}/7
                    </Badge>
                  </div>
                </div>
                <div className="analytics-carousel-container">
                  {/* Direct Analytics Display - Mapped to Active Module */}
                  <div 
                    key={`${selectedModule}-${currentDayIndex}`}
                    className={`analytics-view ${isTransitioning ? 'transitioning' : ''}`}
                  >
                    {getAnalyticsComponent()}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>


        {/* KPI Gauge Meter Section */}
        <Row className="mb-4">
            <Col xs={12} lg={12}>
                <div 
                  key={`kpi-meter-${selectedModule}-${currentDayIndex}`}
                  style={{
                    transition: 'all 0.4s ease',
                    opacity: isTransitioning ? 0.7 : 1,
                    transform: isTransitioning ? 'scale(0.98)' : 'scale(1)'
                  }}
                >
                  <KPIMeter moduleId={selectedModule} dayIndex={currentDayIndex} />
                </div>
            </Col>
        </Row>
   

      
        </Container>
      </div>
        </React.Fragment>
    )
}

DashboardUnifiedWorkspace.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};
  
export default DashboardUnifiedWorkspace
