import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import GaugeComponent from 'react-gauge-component';

interface SimpleMetricCardProps {
  title: string;
  value: string;
}

const SimpleMetricCard: React.FC<SimpleMetricCardProps> = ({ title, value }) => {
  const [displayValue, setDisplayValue] = useState<string>('$0');
  
  useEffect(() => {
    // Extract numeric value and format (assumes value like "$6,651,256" or "75.10%")
    const numericValue = parseFloat(value.replace(/[$,% ]/g, ''));
    const hasPercent = value.includes('%');
    const hasDollar = value.includes('$');
    
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const increment = numericValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        const currentValue = increment * currentStep;
        let formatted = '';
        
        if (hasDollar) {
          formatted = '$' + Math.round(currentValue).toLocaleString();
        } else if (hasPercent) {
          formatted = currentValue.toFixed(2) + '%';
        } else {
          formatted = currentValue.toFixed(2);
        }
        
        setDisplayValue(formatted);
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="text-center py-4">
        <h6 className="text-muted mb-3" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {title}
        </h6>
        <h2 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700, color: '#2c3e50' }}>
          {displayValue}
        </h2>
      </Card.Body>
    </Card>
  );
};

interface GaugeMetricCardProps {
  title: string;
  subtitle?: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
}

const GaugeMetricCard: React.FC<GaugeMetricCardProps> = ({ 
  title, 
  subtitle, 
  value, 
  maxValue, 
  color,
  suffix = ''
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  
  useEffect(() => {
    setDisplayValue(0); // Reset to 0 first
    
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(increment * currentStep);
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="text-center py-4">
        <h6 className="text-dark mb-1" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {title}
        </h6>
        {subtitle && (
          <p className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
            {subtitle}
          </p>
        )}
        
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GaugeComponent
            type="radial"
            arc={{
              colorArray: [color, '#d1d5db'],
              padding: 0.02,
              subArcs: [
                { limit: displayValue },
                { limit: maxValue }
              ],
              width: 0.3,
              cornerRadius: 0,
            }}
            pointer={{
              type: "needle",
              animationDelay: 0,
              elastic: true,
              color: '#464A4F',
              length: 0.75,
              width: 20,
            }}
            labels={{
              valueLabel: {
                formatTextValue: (val) => val.toFixed(2) + suffix,
                style: { 
                  fontSize: '32px', 
                  fill: '#2c3e50', 
                  fontWeight: 'bold',
                }
              },
              tickLabels: {
                type: 'inner',
                defaultTickValueConfig: {
                  formatTextValue: (val) => val.toString(),
                  style: { fontSize: '12px', fill: '#6c757d' }
                },
                ticks: [
                  { value: 0 },
                  { value: maxValue }
                ],
              }
            }}
            value={displayValue}
            minValue={0}
            maxValue={maxValue}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

interface FinancialMetricsDashboardProps {
  moduleId?: string;
  dayIndex?: number;
}

const FinancialMetricsDashboard: React.FC<FinancialMetricsDashboardProps> = ({ 
  moduleId = 'crm', 
  dayIndex = 0 
}) => {
  // Generate dynamic values based on module and day
  const getDynamicMetrics = () => {
    // Base values per module
    const moduleBaseValues: Record<string, any> = {
      crm: { ar: 6651256, ap: 2651256, equity: 75.10, debt: 1.10, ratio: 1.86, dsi: 10, dso: 7, dpo: 28 },
      billing: { ar: 8200000, ap: 3100000, equity: 82.50, debt: 0.85, ratio: 2.15, dsi: 8, dso: 5, dpo: 32 },
      tickets: { ar: 3500000, ap: 1800000, equity: 68.20, debt: 1.45, ratio: 1.42, dsi: 15, dso: 12, dpo: 22 },
      vendor: { ar: 5200000, ap: 2200000, equity: 72.80, debt: 1.22, ratio: 1.68, dsi: 12, dso: 9, dpo: 25 },
      reseller: { ar: 4800000, ap: 1950000, equity: 78.90, debt: 0.95, ratio: 1.92, dsi: 9, dso: 6, dpo: 30 },
      automation: { ar: 7100000, ap: 2850000, equity: 80.40, debt: 0.88, ratio: 2.05, dsi: 7, dso: 4, dpo: 35 },
      gsm: { ar: 6900000, ap: 2750000, equity: 76.30, debt: 1.05, ratio: 1.78, dsi: 11, dso: 8, dpo: 27 }
    };

    // Day multipliers for variation
    const dayMultipliers = [1.0, 0.96, 1.04, 0.98, 1.07, 1.02, 0.94];
    const multiplier = dayMultipliers[dayIndex % 7];

    const base = moduleBaseValues[moduleId] || moduleBaseValues.crm;

    return {
      ar: Math.round(base.ar * multiplier),
      ap: Math.round(base.ap * multiplier),
      equity: (base.equity * multiplier).toFixed(2),
      debt: (base.debt * multiplier).toFixed(2),
      ratio: (base.ratio * multiplier).toFixed(2),
      dsi: Math.round(base.dsi * multiplier),
      dso: Math.round(base.dso * multiplier),
      dpo: Math.round(base.dpo * multiplier)
    };
  };

  const metrics = getDynamicMetrics();

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
          <h6 className="mb-0" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontWeight: 600, color: '#1f2937' }}>
            Financial Metrics Overview
          </h6>
        </div>

        {/* Top Row - Simple Metrics */}
        <Row className="g-3 mb-3">
          <Col xs={12} sm={6} lg={3}>
            <SimpleMetricCard
              title="Total Accounts Receivable"
              value={`$${metrics.ar.toLocaleString()}`}
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <SimpleMetricCard
              title="Total Accounts Payable"
              value={`$${metrics.ap.toLocaleString()}`}
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <SimpleMetricCard
              title="Equity Ratio"
              value={`${metrics.equity}%`}
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <SimpleMetricCard
              title="Debt Equity"
              value={`${metrics.debt}%`}
            />
          </Col>
        </Row>

        {/* Bottom Row - Gauge Metrics */}
        <Row className="g-3">
          <Col xs={12} sm={6} lg={3}>
            <GaugeMetricCard
              title="Current Ratio"
              subtitle="(Current Assets / Current Liabilities)"
              value={parseFloat(metrics.ratio)}
              maxValue={3}
              color="#5b8ff9"
              suffix="%"
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <GaugeMetricCard
              title="DSI"
              subtitle="(Days Sales Inventory)"
              value={metrics.dsi}
              maxValue={91}
              color="#5b8ff9"
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <GaugeMetricCard
              title="DSO"
              subtitle="(Days Sales Outstanding)"
              value={metrics.dso}
              maxValue={91}
              color="#5dd39e"
            />
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <GaugeMetricCard
              title="DPO"
              subtitle="(Days Payable Outstanding)"
              value={metrics.dpo}
              maxValue={91}
              color="#ffc53d"
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default FinancialMetricsDashboard;