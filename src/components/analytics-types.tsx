import React from 'react';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Target, Users, Package, Building2, MapPin, Flag, UserPlus, Coffee, UserCheck } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

// Helper Components
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, trend, trendUp }) => (
  <div className="bg-white rounded-3 shadow-sm p-2">
    <div className="d-flex align-items-center mb-2">
      <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-2" style={{ width: '36px', height: '36px' }}>
        <div className="text-primary">{icon}</div>
      </div>
    </div>
    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{title}</div>
    <div className="fs-5 fw-bold text-dark mb-1">{value}</div>
    <div className={`d-flex align-items-center ${trendUp ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
      {trendUp ? <TrendingUp size={14} className="me-1" /> : <TrendingDown size={14} className="me-1" />}
      <span>{trend}</span>
    </div>
  </div>
);

interface StatusBarProps {
  label: string;
  percentage: number;
  color: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ label, percentage, color }) => (
  <div className="mb-3">
    <div className="d-flex justify-content-between align-items-center mb-2">
      <span className="small text-white">{label}</span>
      <span className="small fw-bold text-white">{percentage}%</span>
    </div>
    <div className="bg-white bg-opacity-25 rounded-pill" style={{ height: '8px', overflow: 'hidden' }}>
      <div className="bg-white rounded-pill h-100" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

interface FinanceCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}

const FinanceCard: React.FC<FinanceCardProps> = ({ icon, title, value, color }) => {
  const colorMap: { [key: string]: string } = {
    green: 'success',
    red: 'danger',
    blue: 'primary',
    orange: 'warning'
  };
  const bootstrapColor = colorMap[color] || 'primary';
  
  return (
    <div className="bg-white rounded-3 shadow-sm p-2">
      <div className={`d-inline-flex align-items-center justify-content-center bg-${bootstrapColor} bg-opacity-10 rounded-2 mb-2`} style={{ width: '36px', height: '36px' }}>
        <div className={`text-${bootstrapColor}`}>{icon}</div>
      </div>
      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{title}</div>
      <div className="fs-5 fw-bold text-dark">{value}</div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, color }) => {
  const colorMap: { [key: string]: string } = {
    green: 'success',
    red: 'danger',
    blue: 'primary',
    blue2: 'info'
  };
  const bootstrapColor = colorMap[color] || 'primary';
  
  return (
    <div className="bg-white rounded-3 shadow-sm p-2">
      <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>{title}</div>
      <div className="d-flex align-items-end justify-content-between">
        <div className="fs-5 fw-bold text-dark">{value}</div>
        <div className={`fw-semibold ${isPositive ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
          {change}
        </div>
      </div>
      <div className="mt-2">
        <div className={`bg-${bootstrapColor}`} style={{ height: '3px', borderRadius: '2px' }}></div>
      </div>
    </div>
  );
};

interface MarketingItemProps {
  label: string;
  value: string;
  color: string;
}

const MarketingItem: React.FC<MarketingItemProps> = ({ label, value, color }) => (
  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
    <div className="d-flex align-items-center gap-2">
      <div className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: color }}></div>
      <span className="small text-muted">{label}</span>
    </div>
    <span className="small fw-semibold text-dark">{value}</span>
  </div>
);

// Helper Components
interface MetricCardWithIconProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  bgColor: string;
}

const MetricCardWithIcon: React.FC<MetricCardWithIconProps> = ({ icon, title, value, change, isPositive, bgColor }) => (
  <div className={`${bgColor} rounded-3 shadow-sm p-3`}>
    <div className="d-flex justify-content-between align-items-start mb-3">
      <div>
        <div className="text-muted small mb-1">{title}</div>
        <div className="fs-3 fw-bold text-dark">{value}</div>
        <div className={`small d-flex align-items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{change}</span>
        </div>
      </div>
      <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
        {icon}
      </div>
    </div>
  </div>
);
// Analytics 1: Sales & Orders Overview
export const Analytics1 = () => {
  const salesData = [
    { month: 'Jan', income: 48000, expenses: 32000 },
    { month: 'Feb', income: 52000, expenses: 34000 },
    { month: 'Mar', income: 45000, expenses: 36000 },
    { month: 'Apr', income: 58000, expenses: 38000 },
    { month: 'May', income: 62000, expenses: 42000 },
    { month: 'Jun', income: 55000, expenses: 44000 },
    { month: 'Jul', income: 48000, expenses: 40000 },
    { month: 'Aug', income: 65000, expenses: 45000 },
    { month: 'Sep', income: 72000, expenses: 43000 },
    { month: 'Oct', income: 68000, expenses: 41000 },
    { month: 'Nov', income: 58000, expenses: 38000 },
    { month: 'Dec', income: 62000, expenses: 40000 }
  ];

  const countryData = [
    { country: 'America', products: 4265, flag: '🇺🇸' },
    { country: 'China', products: 3740, flag: '🇨🇳' },
    { country: 'Germany', products: 2980, flag: '🇩🇪' },
    { country: 'Japan', products: 1640, flag: '🇯🇵' }
  ];

  return (
    <div className="w-100  p-4 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6 col-lg-3">
            <StatCard
              icon={<DollarSign size={24} />}
              title="Total Earning"
              value="$12,354"
              trend="+12.4%"
              trendUp={true}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <StatCard
              icon={<ShoppingCart size={24} />}
              title="Total Orders"
              value="10,654"
              trend="+18.2%"
              trendUp={true}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <StatCard
              icon={<TrendingUp size={24} />}
              title="Revenue Growth"
              value="+18.5%"
              trend="+5.2%"
              trendUp={true}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <StatCard
              icon={<Target size={24} />}
              title="Conversion Rate"
              value="7.6%"
              trend="-2.1%"
              trendUp={false}
            />
          </div>
        </div>

        <div className="row g-2">
          {/* Sales Report */}
          <div className="col-12 col-md-6 col-lg-6">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-5 fw-bold text-dark">Sales Report</h3>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light px-3 py-2">Today</button>
                  <button className="btn btn-sm btn-outline-light px-3 py-2">Week</button>
                  <button className="btn btn-sm btn-outline-light px-3 py-2">Month</button>
                </div>
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <p className="small text-muted">Average Income</p>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-3 fw-bold text-dark">$87,352</span>
                    <span className="small text-primary">50</span>
                  </div>
                  <span className="small text-success">+12.4%</span>
                </div>
                <div className="col-6">
                  <p className="small text-muted">Average Expenses</p>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-3 fw-bold text-dark">$97,500</span>
                    <span className="small text-danger">50</span>
                  </div>
                  <span className="small text-danger">-7.3%</span>
                </div>
              </div>            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2585f8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2585f8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#2585f8" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Column 2: Monthly Target */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <h3 className="fs-6 fw-bold text-dark mb-3">Monthly Target</h3>
              <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{ width: '120px', height: '120px' }}>
                  <svg className="w-100 h-100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                    <circle cx="60" cy="60" r="50" stroke="#2585f8" strokeWidth="10" fill="none"
                      strokeDasharray="314" strokeDashoffset="76" strokeLinecap="round" />
                  </svg>
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center">
                    <span className="fs-4 fw-bold text-dark">75.7%</span>
                    <span style={{ fontSize: '0.7rem' }} className="text-muted">32,500 Sales</span>
                  </div>
                </div>
              </div>
              <div className="bg-primary rounded-2 p-2 mb-2">
                <StatusBar label="Paid" percentage={75} color="#2585f8" />
                <StatusBar label="Cancelled" percentage={22} color="#2585f8" />
                <StatusBar label="Refunded" percentage={3} color="#2585f8" />
              </div>
            </div>
          </div>

          {/* Column 3: Sales by Country */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">Sales by Country</h3>
              </div>
              <p className="fs-5 fw-bold text-dark mb-1">$45,314</p>
              <p className="small text-success mb-3">+8.2% vs last month</p>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {countryData.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-5">{item.flag}</span>
                      <span className="small fw-medium text-dark">{item.country}</span>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold text-dark small">{item.products.toLocaleString()}</span>
                      <p style={{ fontSize: '0.65rem' }} className="text-muted mb-0">PRODUCTS</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 2: Financial Overview
export const Analytics2 = () => {
  const revenueData = [
    { month: 'Jan', revenue: 100000, expenses: 300000 },
    { month: 'Feb', revenue: 200000, expenses: 150000 },
    { month: 'Mar', revenue: 300000, expenses: 350000 },
    { month: 'May', revenue: 250000, expenses: 300000 },
    { month: 'Jun', revenue: 200000, expenses: 200000 },
    { month: 'July', revenue: 400000, expenses: 500000 },
    { month: 'Aug', revenue: 350000, expenses: 400000 },
    { month: 'Sep', revenue: 250000, expenses: 230000 }
  ];

  const expenseBreakdown = [
    { name: 'Salaries', value: 40, color: '#2585f8' },
    { name: 'Rent', value: 30, color: '#2585f8' },
    { name: 'Software', value: 20, color: '#2585f8' },
    { name: 'Marketing', value: 10, color: '#2585f8' }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-4 col-lg-3">
            <FinanceCard icon={<DollarSign size={20} />} title="Total Revenue" value="$120,540" color="green" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <FinanceCard icon={<ShoppingCart size={20} />} title="Total Expenses" value="$84,320" color="red" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <FinanceCard icon={<TrendingUp size={20} />} title="Net Profit" value="$36,220" color="blue" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <FinanceCard icon={<Package size={20} />} title="Pending Invoices" value="12" color="orange" />
          </div>
        </div>

        <div className="row g-2" style={{marginTop: '35px'}}>
          {/* Revenue vs Expenses */}
          <div className="col-12 col-md-6 col-lg-6">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-5 fw-bold text-dark">Revenue vs Expenses</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>This Year</option>
                </select>
              </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2585f8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Column 2: Expense Breakdown */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <h3 className="fs-6 fw-bold text-dark mb-3">Expense Breakdown</h3>
              <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{ width: '140px', height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center">
                    <span className="fs-5 fw-bold text-dark">2000</span>
                    <span style={{ fontSize: '0.7rem' }} className="text-muted">Sources</span>
                  </div>
                </div>
              </div>
              <div>
                {expenseBreakdown.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: item.color }}></div>
                      <span className="small text-muted">{item.name}</span>
                    </div>
                    <span className="small fw-semibold text-dark">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Monthly Target */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="rounded-3 shadow-sm p-3 text-white h-100" style={{ background: 'linear-gradient(135deg, #2585f8 0%, #1a6fd1 100%)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold">Monthly Target</h3>
              </div>
              
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="fs-3 fw-bold">92%</span>
                <span style={{ fontSize: '0.7rem' }} className="bg-white bg-opacity-25 px-2 py-1 rounded">+15%</span>
              </div>

              <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{ width: '100px', height: '100px' }}>
                  <svg className="w-100 h-100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="8" fill="none"
                      strokeDasharray="283" strokeDashoffset="23" strokeLinecap="round" />
                  </svg>
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center">
                    <span className="fs-5 fw-bold">75K</span>
                    <span style={{ fontSize: '0.65rem' }} className="opacity-75">673 Orders</span>
                  </div>
                </div>
              </div>

              <p className="text-center" style={{ fontSize: '0.7rem', marginBottom: '0.75rem', opacity: 0.85 }}>
                You earn <span className="fw-bold">$7540</span> today!
              </p>

              <div className="bg-white rounded-2 p-2">
                <div className="row g-2 text-center">
                  <div className="col-4">
                    <p className="small fw-bold text-dark mb-0">$75K</p>
                    <p style={{ fontSize: '0.65rem' }} className="text-muted mb-0">Target</p>
                  </div>
                  <div className="col-4">
                    <p className="small fw-bold text-dark mb-0">$15k</p>
                    <p style={{ fontSize: '0.65rem' }} className="text-muted mb-0">Revenue</p>
                  </div>
                  <div className="col-4">
                    <p className="small fw-bold text-dark mb-0">$8.5k</p>
                    <p style={{ fontSize: '0.65rem' }} className="text-muted mb-0">Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 3: Business Metrics
export const Analytics3 = () => {
  const marginData = [
    { month: 'JAN', revenue: 32000, margin: 23 },
    { month: 'FEB', revenue: 36000, margin: 42 },
    { month: 'MAR', revenue: 31000, margin: 35 },
    { month: 'APR', revenue: 44000, margin: 27 },
    { month: 'MAY', revenue: 21000, margin: 43 },
    { month: 'JUN', revenue: 31000, margin: 22 },
    { month: 'JUL', revenue: 20000, margin: 17 },
    { month: 'AUG', revenue: 28000, margin: 31 },
    { month: 'SEP', revenue: 48000, margin: 22 },
    { month: 'OCT', revenue: 26000, margin: 22 },
    { month: 'NOV', revenue: 12000, margin: 12 },
    { month: 'DEC', revenue: 24000, margin: 16 }
  ];

  const marketingData = [
    { name: 'Email Marketing', value: 183, color: '#3b82f6' },
    { name: 'Influencer', value: 387, color: '#60a5fa' },
    { name: 'Google Ads', value: 13, color: '#2585f8' },
    { name: 'Social Media', value: 54, color: '#10b981' },
    { name: 'Back Links', value: 1, color: '#84cc16' },
    { name: 'Event Sponsorship', value: 81.6, color: '#f59e0b' },
    { name: 'Ad Campaign', value: 7.1, color: '#f97316' },
    { name: 'Revenue', value: 91.6, color: '#ef4444' },
    { name: 'Audit Report', value: 8.7, color: '#06b6d4' }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        {/* Top Metrics */}
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-4 col-lg-3">
            <MetricCard title="Profit & Loss" value="$ 25.6K" change="+4.75%" isPositive={true} color="green" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <MetricCard title="Cash Flow" value="$ 31.5K" change="-1.25%" isPositive={false} color="red" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <MetricCard title="Sales" value="$ 13.5K" change="+1.55%" isPositive={true} color="blue" />
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <MetricCard title="Payment" value="$ 15.32K" change="-0.15%" isPositive={false} color="blue" />
          </div>
        </div>

        <div className="row g-2">
          {/* Revenue vs Operating Margin */}
          <div className="col-12 col-md-6 col-lg-9">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-5 fw-bold text-dark">Revenue Vs Operating Margin</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>This Year</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={324}>
                <ComposedChart data={marginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2585f8" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Marketing Expenses */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">Marketing Expenses</h3>
              </div>

              <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{ width: '140px', height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {marketingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center">
                    <span className="fs-5 fw-bold text-dark">1.1 M</span>
                  </div>
                </div>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '200px' }}>
                <div style={{ fontSize: '0.75rem' }} className="fw-semibold text-dark mb-2">Digital Marketing</div>
                {marketingData.slice(0, 4).map((item, idx) => (
                  <MarketingItem key={idx} label={item.name} value={`$${item.value}K`} color={item.color} />
                ))}
                <div style={{ fontSize: '0.75rem' }} className="fw-semibold text-dark mt-2 mb-2">Offline Marketing</div>
                {marketingData.slice(6).map((item, idx) => (
                  <MarketingItem key={idx} label={item.name} value={`$${item.value}K`} color={item.color} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// Analytics 4: Support Tickets Dashboard
export const Analytics4 = () => {
  const ticketData = [
    { day: 'Mon', low: 310, medium: 220, high: 145, urgent: 95 },
    { day: 'Tue', low: 330, medium: 180, high: 230, urgent: 75 },
    { day: 'Wed', low: 295, medium: 190, high: 195, urgent: 95 },
    { day: 'Thu', low: 335, medium: 230, high: 145, urgent: 95 },
    { day: 'Fri', low: 390, medium: 285, high: 185, urgent: 40 },
    { day: 'Sat', low: 295, medium: 195, high: 135, urgent: 80 },
    { day: 'Sun', low: 275, medium: 175, high: 105, urgent: 55 }
  ];

  const satisfactionData = [
    { name: 'Highly Satisfied', value: 55, color: '#06b6d4' },
    { name: 'Satisfied', value: 30, color: '#3b82f6' },
    { name: 'Unsatisfied', value: 15, color: '#2585f8' }
  ];

  const responseTimeData = [
    { time: '1', value: 80 }, { time: '2', value: 70 }, { time: '3', value: 90 },
    { time: '4', value: 65 }, { time: '5', value: 85 }, { time: '6', value: 95 },
    { time: '7', value: 75 }, { time: '8', value: 110 }
  ];

  const resolutionTimeData = [
    { time: '1', value: 50 }, { time: '2', value: 30 }, { time: '3', value: 60 },
    { time: '4', value: 80 }, { time: '5', value: 70 }, { time: '6', value: 110 },
    { time: '7', value: 45 }, { time: '8', value: 65 }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Tickets Open</div>
              <div className="fs-5 fw-bold text-dark mb-1">2.75K</div>
              <div className="d-flex align-items-center text-success" style={{ fontSize: '0.7rem' }}>
                <TrendingUp size={12} className="me-1" />
                <span>20.05% This Week</span>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Tickets In Progress</div>
              <div className="fs-5 fw-bold text-dark mb-1">1.25K</div>
              <div className="d-flex align-items-center text-success" style={{ fontSize: '0.7rem' }}>
                <TrendingUp size={12} className="me-1" />
                <span>5.75% This Week</span>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Tickets Resolved</div>
              <div className="fs-5 fw-bold text-dark mb-1">753</div>
              <div className="d-flex align-items-center text-danger" style={{ fontSize: '0.7rem' }}>
                <TrendingDown size={12} className="me-1" />
                <span>7.25% This Week</span>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2">
              <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Tickets Closed</div>
              <div className="fs-5 fw-bold text-dark mb-1">487</div>
              <div className="d-flex align-items-center text-danger" style={{ fontSize: '0.7rem' }}>
                <TrendingDown size={12} className="me-1" />
                <span>4.01% This Week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-2" style={{marginTop: '50px'}}>
          {/* New Tickets Created */}
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">New Tickets Created</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>This Week</option>
                </select>
              </div>

              <div className="d-flex gap-3 mb-3" style={{ fontSize: '0.7rem' }}>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '10px', height: '10px', backgroundColor: '#22d3ee' }}></div>
                  <span>Low</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6' }}></div>
                  <span>Medium</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '10px', height: '10px', backgroundColor: '#fb923c' }}></div>
                  <span>High</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '10px', height: '10px', backgroundColor: '#ef4444' }}></div>
                  <span>Urgent</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={263}>
                <BarChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <Tooltip />
                  <Bar dataKey="low" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medium" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="high" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="urgent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-12 col-lg-4">
            <div className="row g-2">
              {/* Response Times */}
              <div className="col-12">
                <div className="bg-white rounded-3 shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="fs-6 fw-bold text-dark">First Response Time</h3>
                    <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '0.7rem' }}>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <p className="fs-5 fw-bold text-dark mb-2">1 hrs : 22 mins</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={responseTimeData}>
                      <defs>
                        <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#fb923c" strokeWidth={2} fillOpacity={1} fill="url(#colorResponse)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resolution Time */}
              <div className="col-12">
                <div className="bg-white rounded-3 shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="fs-6 fw-bold text-dark">Ave Resolution Time</h3>
                    <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '0.7rem' }}>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <p className="fs-5 fw-bold text-dark mb-2">10 hrs : 30 mins</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={resolutionTimeData}>
                      <defs>
                        <linearGradient id="colorResolution" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2585f8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2585f8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#2585f8" strokeWidth={2} fillOpacity={1} fill="url(#colorResolution)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer Satisfaction */}
              {/* <div className="col-12">
                <div className="bg-white rounded-3 shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="fs-6 fw-bold text-dark">Customer Satisfaction</h3>
                    <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '0.7rem' }}>
                      <option>This Week</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-center mb-3">
                    <div style={{ width: '140px', height: '140px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={satisfactionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={60}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            {satisfactionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center flex-wrap gap-2" style={{ fontSize: '0.7rem' }}>
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#06b6d4' }}></div>
                      <span>Highly Satisfied</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6' }}></div>
                      <span>Satisfied</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#2585f8' }}></div>
                      <span>Unsatisfied</span>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 5: CRM & Leads Dashboard
export const Analytics5 = () => {
  const pipelineData = [
    { month: 'Jan', value: 40000 },
    { month: 'Feb', value: 28000 },
    { month: 'Mar', value: 45000 },
    { month: 'Apr', value: 80000 },
    { month: 'May', value: 85000 },
    { month: 'Jun', value: 88000 },
    { month: 'Jul', value: 80000 },
    { month: 'Aug', value: 78000 },
    { month: 'Sep', value: 75000 },
    { month: 'Oct', value: 82000 },
    { month: 'Nov', value: 15000 },
    { month: 'Dec', value: 78000 }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2 border-start border-warning border-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="bg-warning bg-opacity-10 rounded-2 p-2">
                  <span>⚠️</span>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Total No of Leads</div>
                  <div className="fs-5 fw-bold text-dark">6000</div>
                </div>
              </div>
              <div className="text-danger" style={{ fontSize: '0.7rem' }}>↘ -4.01% from last week</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2 border-start border-info border-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="bg-info bg-opacity-10 rounded-2 p-2">
                  <span>📦</span>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>No of New Leads</div>
                  <div className="fs-5 fw-bold text-dark">120</div>
                </div>
              </div>
              <div className="text-success" style={{ fontSize: '0.7rem' }}>↗ +20.01% from last week</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2 border-start border-danger border-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="bg-danger bg-opacity-10 rounded-2 p-2">
                  <span>🔧</span>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>No of Lost Leads</div>
                  <div className="fs-5 fw-bold text-dark">30</div>
                </div>
              </div>
              <div className="text-success" style={{ fontSize: '0.7rem' }}>↗ +55% from last week</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white rounded-3 shadow-sm p-2 border-start border-primary border-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="bg-primary bg-opacity-10 rounded-2 p-2">
                  <span>👥</span>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>No of Total Customers</div>
                  <div className="fs-5 fw-bold text-dark">9895</div>
                </div>
              </div>
              <div className="text-success" style={{ fontSize: '0.7rem' }}>↗ +55% from last week</div>
            </div>
          </div>
        </div>

        <div className="row g-2" style={{marginTop: '60px'}}>
          {/* Pipeline Stages */}
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">Pipeline Stages</h3>
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>📅</span>
                  <span>2023 - 2024</span>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col">
                  <div className="small text-warning mb-1">● Contacted</div>
                  <div className="fs-6 fw-bold text-dark">50000</div>
                </div>
                <div className="col">
                  <div className="small text-warning mb-1">● Opportunity</div>
                  <div className="fs-6 fw-bold text-dark">25985</div>
                </div>
                <div className="col">
                  <div className="small text-warning mb-1">● Not Contacted</div>
                  <div className="fs-6 fw-bold text-dark">12566</div>
                </div>
                <div className="col">
                  <div className="small text-warning mb-1">● Closed</div>
                  <div className="fs-6 fw-bold text-dark">8965</div>
                </div>
                <div className="col">
                  <div className="small text-warning mb-1">● Lost</div>
                  <div className="fs-6 fw-bold text-dark">2452</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#fb923c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Leads Heatmap */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">New Leads</h3>
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>📅</span>
                  <span>This Week</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="row g-1 mb-2" style={{ fontSize: '0.65rem' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={idx} className="col text-center text-muted fw-medium">{day}</div>
                  ))}
                </div>
                
                {/* Week 1 */}
                <div className="row g-1 mb-1">
                  {[22, 24, 20, 32, 32, 32, 12].map((val, idx) => (
                    <div key={idx} className="col">
                      <div className="bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center" style={{ aspectRatio: '1/1', fontSize: '0.65rem', fontWeight: '500' }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week 2 */}
                <div className="row g-1 mb-1">
                  {[22, 25, 20, 32, 32, 32, 12].map((val, idx) => (
                    <div key={idx} className="col">
                      <div className="bg-warning bg-opacity-25 rounded d-flex align-items-center justify-content-center" style={{ aspectRatio: '1/1', fontSize: '0.65rem', fontWeight: '500' }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week 3 */}
                <div className="row g-1 mb-1">
                  {[22, 25, 20, 32, 32, 32, 12].map((val, idx) => (
                    <div key={idx} className="col">
                      <div className="bg-warning bg-opacity-50 rounded d-flex align-items-center justify-content-center" style={{ aspectRatio: '1/1', fontSize: '0.65rem', fontWeight: '500' }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week 4 with highlight */}
                <div className="row g-1">
                  {[22, 75, 20, 32, 32, 32, 12].map((val, idx) => (
                    <div key={idx} className="col">
                      <div 
                        className={`${idx === 1 ? 'bg-warning' : 'bg-secondary bg-opacity-25'} rounded d-flex align-items-center justify-content-center`} 
                        style={{ aspectRatio: '1/1', fontSize: '0.65rem', fontWeight: '500', color: idx === 1 ? 'white' : 'inherit' }}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




// Analytics 3: User & Subscription Dashboard
export const Analytics6 = () => {
  const salesData = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 18000 },
    { month: 'Mar', value: 12000 },
    { month: 'Apr', value: 24000 },
    { month: 'May', value: 30000 },
    { month: 'Jun', value: 36000 },
    { month: 'Jul', value: 18000 },
    { month: 'Aug', value: 30000 },
    { month: 'Sep', value: 12000 },
    { month: 'Oct', value: 24000 },
    { month: 'Nov', value: 12000 },
    { month: 'Dec', value: 27000 }
  ];

  const subscriberData = [
    { day: 'Sun', value: 800 },
    { day: 'Mon', value: 850 },
    { day: 'Tue', value: 920 },
    { day: 'Wed', value: 980 },
    { day: 'Thu', value: 1020 },
    { day: 'Fri', value: 1070 },
    { day: 'Sat', value: 1100 }
  ];

  const userOverviewData = [
    { name: 'New', value: 500, color: '#3b82f6' },
    { name: 'Subscribed', value: 300, color: '#fb923c' }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<Users size={24} className="text-primary" />}
              title="Total Users"
              value="20,000"
              change="+5000 Last 30 days users"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<UserPlus size={24} style={{ color: '#2585f8' }} />}
              title="Total Subscription"
              value="15,000"
              change="-800 Last 30 days subscription"
              isPositive={false}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<Users size={24} className="text-info" />}
              title="Total Free Users"
              value="5,000"
              change="+200 Last 30 days users"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<DollarSign size={24} className="text-success" />}
              title="Total Income"
              value="$42,000"
              change="+$20,000 Last 30 days income"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
        </div>

        <div className="row g-2" style={{marginTop: '60px'}}>
          {/* Sales Statistic */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-6 fw-bold text-dark">Sales Statistic</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Yearly</option>
                </select>
              </div>
              
              <div className="mb-2">
                <div className="fs-4 fw-bold text-dark">$27,200</div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success text-success">10%</span>
                  <span className="small text-muted">+ $1500 Per Day</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={195}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Subscriber */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <h3 className="fs-6 fw-bold text-dark mb-2">Total Subscriber</h3>
              
              <div className="mb-2">
                <div className="fs-4 fw-bold text-dark">5,000</div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger text-danger">10%</span>
                  <span className="small text-muted">- 20 Per Day</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={subscriberData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="#93c5fd" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Users Overview */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-6 fw-bold text-dark">Users Overview</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Today</option>
                </select>
              </div>

              <div className="d-flex justify-content-center align-items-center" style={{ height: '220px' }}>
                <div className="position-relative" style={{ width: '160px', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userOverviewData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {userOverviewData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="row g-2 text-center mt-2">
                <div className="col-6">
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6' }}></div>
                    <span className="small text-muted">New: 500</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#fb923c' }}></div>
                    <span className="small text-muted">Subscribed: 300</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 4: Revenue & Products Dashboard
export const Analytics7 = () => {
  const revenueData = [
    { month: 'Jan', earning: 18000, expense: 14000 },
    { month: 'Feb', earning: 16000, expense: 16000 },
    { month: 'Mar', earning: 12000, expense: 18000 },
    { month: 'Apr', earning: 22000, expense: 20000 },
    { month: 'May', earning: 45000, expense: 35000 },
    { month: 'Jun', earning: 20000, expense: 18000 },
    { month: 'Jul', earning: 28000, expense: 10000 },
    { month: 'Aug', earning: 12000, expense: 12000 },
    { month: 'Sep', earning: 25000, expense: 25000 },
    { month: 'Oct', earning: 0, expense: 0 },
    { month: 'Nov', earning: 18000, expense: 15000 },
    { month: 'Dec', earning: 22000, expense: 18000 }
  ];

  const customerData = [
    { name: 'Male', value: 20000, color: '#3b82f6' },
    { name: 'Female', value: 25000, color: '#fb923c' }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        <div className="row g-2">
          {/* Revenue Report */}
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-6 fw-bold text-dark">Revenue Report</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Yearly</option>
                </select>
              </div>

              <div className="d-flex gap-3 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6' }}></div>
                  <span className="small text-muted">Earning: $500,00,000.00</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#fb923c' }}></div>
                  <span className="small text-muted">Expense: $20,000.00</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={390}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <Tooltip />
                  <Bar dataKey="earning" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column - Cards */}
          <div className="col-12 col-lg-4">
            <div className="row g-2">
              {/* Total Products */}
              <div className="col-12 col-md-6 col-lg-6" style={{ marginTop: '80px', marginBottom: '70px' }}>
                <div className="bg-white rounded-3 shadow-sm p-2 text-center">
                  <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3 mb-1" style={{ width: '40px', height: '40px' }}>
                    <Package size={20} className="text-primary" />
                  </div>
                  <div className="fw-semibold text-muted small mb-1" style={{ fontSize: '0.7rem' }}>Total Products</div>
                  <div className="fs-5 fw-bold text-dark mb-1">300</div>
                  <div className="small text-success" style={{ fontSize: '0.65rem' }}>Increase by <strong>+200</strong> this week</div>
                </div>
              </div>

              {/* Total Customer */}
              <div className="col-12 col-md-6 col-lg-6" style={{ marginTop: '80px', marginBottom: '70px' }}>
                <div className="bg-white rounded-3 shadow-sm p-2 text-center">
                  <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-3 mb-1" style={{ width: '40px', height: '40px' }}>
                    <Users size={20} className="text-warning" />
                  </div>
                  <div className="fw-semibold text-muted small mb-1" style={{ fontSize: '0.7rem' }}>Total Customer</div>
                  <div className="fs-5 fw-bold text-dark mb-1">50,000</div>
                  <div className="small text-danger" style={{ fontSize: '0.65rem' }}>Increase by <strong>-5k</strong> this week</div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="col-12 col-md-6 col-lg-6" style={{ marginTop: '80px', marginBottom: '70px' }}>
                <div className="bg-white rounded-3 shadow-sm p-2 text-center">
                  <div className="d-inline-flex align-items-center justify-content-center bg-dark bg-opacity-10 rounded-3 mb-1" style={{ width: '40px', height: '40px' }}>
                    <ShoppingCart size={20} className="text-dark" />
                  </div>
                  <div className="fw-semibold text-muted small mb-1" style={{ fontSize: '0.7rem' }}>Total Orders</div>
                  <div className="fs-5 fw-bold text-dark mb-1">1500</div>
                  <div className="small text-success" style={{ fontSize: '0.65rem' }}>Increase by <strong>+1k</strong> this week</div>
                </div>
              </div>

              {/* Total Sales */}
              <div className="col-12 col-md-6 col-lg-6" style={{ marginTop: '80px', marginBottom: '70px' }}>
                <div className="bg-white rounded-3 shadow-sm p-2 text-center">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-1" style={{ width: '40px', height: '40px', backgroundColor: '#fce7f3' }}>
                    <DollarSign size={20} style={{ color: '#ec4899' }} />
                  </div>
                  <div className="fw-semibold text-muted small mb-1" style={{ fontSize: '0.7rem' }}>Total Sales</div>
                  <div className="fs-5 fw-bold text-dark mb-1">$25,00,000.00</div>
                  <div className="small text-success" style={{ fontSize: '0.65rem' }}>Increase by <strong>+$10k</strong> this week</div>
                </div>
              </div>

              {/* Customers Statistics */}
              {/* <div className="col-12">
                <div className="bg-white rounded-3 shadow-sm p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="fs-6 fw-bold text-dark">Customers Statistics</h3>
                    <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                      <option>Yearly</option>
                    </select>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <div className="position-relative" style={{ width: '110px', height: '110px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={customerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {customerData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center">
                        <span className="fs-6 fw-bold text-success">+30%</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6' }}></div>
                          <span className="small text-muted">Male: 20,000</span>
                        </div>
                        <div className="ms-4">
                          <span className="fs-6 fw-bold text-dark">+25%</span>
                        </div>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: '#fb923c' }}></div>
                          <span className="small text-muted">Female: 25,000</span>
                        </div>
                        <div className="ms-4">
                          <span className="fs-6 fw-bold text-dark">+30%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 8: Sales & Marketing Dashboard
export const Analytics8 = () => {
  const salesDifferenceData = [
    { year: '2010', siteA: 20, siteB: 10 },
    { year: '2011', siteA: 80, siteB: 60 },
    { year: '2012', siteA: 70, siteB: 100 },
    { year: '2013', siteA: 150, siteB: 180 },
    { year: '2014', siteA: 160, siteB: 160 },
    { year: '2015', siteA: 120, siteB: 200 },
    { year: '2016', siteA: 220, siteB: 180 }
  ];

  const statsCards = [
    { icon: '📊', value: '90%', label: 'Store Traffic', color: '#2585f8' },
    { icon: '👍', value: '41,410', label: 'User Likes', color: '#10b981' },
    { icon: '🛍️', value: '760', label: 'Monthly Sales', color: '#3b82f6' },
    { icon: '👥', value: '2,000', label: 'Join Members', color: '#ec4899' }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">

        {/* Top Stats */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<Users size={24} className="text-primary" />}
              title="Total Users"
              value="20,000"
              change="+5000 Last 30 days users"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<UserPlus size={24} style={{ color: '#2585f8' }} />}
              title="Total Subscription"
              value="15,000"
              change="-800 Last 30 days subscription"
              isPositive={false}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<Users size={24} className="text-info" />}
              title="Total Free Users"
              value="5,000"
              change="+200 Last 30 days users"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <MetricCardWithIcon
              icon={<DollarSign size={24} className="text-success" />}
              title="Total Income"
              value="$42,000"
              change="+$20,000 Last 30 days income"
              isPositive={true}
              bgColor="bg-white"
            />
          </div>
        </div>
        <div className="row g-2">
          {/* Left Column - Social Cards */}
          

          {/* Middle Column - Sales Difference */}
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-6 fw-bold text-dark">Sales Difference</h3>
                <div className="d-flex gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#2585f8' }}></div>
                    <span className="small text-muted">Site A View</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ec4899' }}></div>
                    <span className="small text-muted">Site B View</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesDifferenceData}>
                  <defs>
                    <linearGradient id="colorSiteA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2585f8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2585f8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorSiteB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="siteA" stroke="#2585f8" strokeWidth={2} fillOpacity={1} fill="url(#colorSiteA)" />
                  <Area type="monotone" dataKey="siteB" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorSiteB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column - Stats Cards */}
          <div className="col-12 col-lg-5">
            <div className="d-flex flex-column gap-2">
              {statsCards.map((card, idx) => (
                <div key={idx} className="bg-white rounded-3 shadow-sm p-3" style={{marginBottom: '8px'}}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 d-flex align-items-center justify-content-center" 
                         style={{ width: '60px', height: '60px', backgroundColor: card.color + '20' }}>
                      <span className="fs-4">{card.icon}</span>
                    </div>
                    <div>
                      <div className="fs-5 fw-bold text-dark">{card.value}</div>
                      <div className="small text-muted">{card.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




// Analytics 9: Sales & Deals Dashboard
export const Analytics9 = () => {
  const forecastData = [
    { name: 'Goal', value: 37000, color: '#4f46e5' },
    { name: 'Pending', value: 12000, color: '#10b981' },
    { name: 'Revenue', value: 18000, color: '#f59e0b' }
  ];

  const dealTypeData = [
    { year: '2016', pending: 100, loss: 0, won: 0 },
    { year: '2017', pending: 70, loss: 30, won: 80 },
    { year: '2018', pending: 50, loss: 70, won: 40 },
    { year: '2019', pending: 0, loss: 0, won: 0 },
    { year: '2020', pending: 80, loss: 50, won: 30 },
    { year: '2021', pending: 60, loss: 40, won: 50 }
  ];

  const balanceData = [
    { month: 'Jan', revenue: 5000, expenses: 4500 },
    { month: 'Feb', revenue: 8000, expenses: 9000 },
    { month: 'Mar', revenue: 15000, expenses: 18000 },
    { month: 'Apr', revenue: 45000, expenses: 40000 },
    { month: 'May', revenue: 52000, expenses: 50000 },
    { month: 'Jun', revenue: 85000, expenses: 82000 },
    { month: 'Jul', revenue: 104000, expenses: 100000 },
    { month: 'Aug', revenue: 156000, expenses: 145000 },
    { month: 'Sep', revenue: 208000, expenses: 195000 },
    { month: 'Oct', revenue: 220000, expenses: 205000 },
    { month: 'Nov', revenue: 240000, expenses: 225000 },
    { month: 'Dec', revenue: 260000, expenses: 240000 }
  ];

  return (
    <div className="w-100  p-4 overflow-auto">
      <div className="container-fluid">
        {/* Top Stats */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted small mb-1">CAMPAIGN SENT</div>
                  <div className="fs-4 fw-bold text-dark">197</div>
                </div>
                <div className="text-success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                </div>
              </div>
              {/* <div className="text-muted" style={{ fontSize: '1.5rem' }}>🔔</div> */}
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted small mb-1">ANNUAL PROFIT</div>
                  <div className="fs-4 fw-bold text-dark">$489.4k</div>
                </div>
                <div className="text-success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                </div>
              </div>
              {/* <div className="text-muted" style={{ fontSize: '1.5rem' }}>💰</div> */}
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted small mb-1">LEAD CONVERSATION</div>
                  <div className="fs-4 fw-bold text-dark">32.89%</div>
                </div>
                <div className="text-danger">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M8 12l4 4 4-4M12 8v8"/>
                  </svg>
                </div>
              </div>
              {/* <div className="text-muted" style={{ fontSize: '1.5rem' }}>📈</div> */}
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted small mb-1">DAILY AVERAGE INCOME</div>
                  <div className="fs-4 fw-bold text-dark">$1,596.5</div>
                </div>
                <div className="text-success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                </div>
              </div>
              {/* <div className="text-muted" style={{ fontSize: '1.5rem' }}>🏆</div> */}
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="text-muted small mb-1">ANNUAL DEALS</div>
                  <div className="fs-4 fw-bold text-dark">2,659</div>
                </div>
                <div className="text-warning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                </div>
              </div>
              {/* <div className="text-muted" style={{ fontSize: '1.5rem' }}>💎</div> */}
            </div>
          </div>
        </div>

        <div className="row g-3">
          {/* Sales Forecast */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-6 fw-bold text-dark">Sales Forecast</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Nov 2021</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={212}>
                <BarChart data={forecastData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={0} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {forecastData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="text-center mt-3 mb-3">
                <div className="small text-muted mb-1">Total Forecasted Value</div>
              </div>

              <div className="d-flex justify-content-center gap-3">
                {forecastData.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2">
                    <div className="rounded-2" style={{ width: '12px', height: '12px', backgroundColor: item.color }}></div>
                    <span className="small text-muted">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deal Type */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-6 fw-bold text-dark">Deal Type</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Monthly</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <svg viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
                  {/* Radar chart - simplified representation */}
                  <g transform="translate(150, 150)">
                    {/* Background grid */}
                    <circle cx="0" cy="0" r="120" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="80" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    
                    {/* Axis lines */}
                    <line x1="0" y1="0" x2="0" y2="-120" stroke="#f0f0f0" strokeWidth="1"/>
                    <line x1="0" y1="0" x2="104" y2="60" stroke="#f0f0f0" strokeWidth="1"/>
                    <line x1="0" y1="0" x2="104" y2="-60" stroke="#f0f0f0" strokeWidth="1"/>
                    <line x1="0" y1="0" x2="-104" y2="60" stroke="#f0f0f0" strokeWidth="1"/>
                    <line x1="0" y1="0" x2="-104" y2="-60" stroke="#f0f0f0" strokeWidth="1"/>
                    <line x1="0" y1="0" x2="0" y2="120" stroke="#f0f0f0" strokeWidth="1"/>
                    
                    {/* Data polygons */}
                    <polygon points="0,-100 80,40 60,100 -60,100 -80,40" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="2"/>
                    <polygon points="0,-60 50,20 40,80 -40,80 -50,20" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="2"/>
                    <polygon points="0,-90 70,30 90,90 -90,60 -70,30" fill="#10b981" fillOpacity="0.4" stroke="#10b981" strokeWidth="2"/>
                    
                    {/* Year labels */}
                    <text x="0" y="-135" textAnchor="middle" fontSize="10" fill="#94a3b8">2016</text>
                    <text x="120" y="70" textAnchor="middle" fontSize="10" fill="#94a3b8">2017</text>
                    <text x="0" y="140" textAnchor="middle" fontSize="10" fill="#94a3b8">2019</text>
                    <text x="-120" y="70" textAnchor="middle" fontSize="10" fill="#94a3b8">2018</text>
                    <text x="-120" y="-70" textAnchor="middle" fontSize="10" fill="#94a3b8">2020</text>
                    <text x="120" y="-70" textAnchor="middle" fontSize="10" fill="#94a3b8">2021</text>
                  </g>
                </svg>
              </ResponsiveContainer>

              <div className="d-flex justify-content-center gap-3 mt-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b' }}></div>
                  <span className="small text-muted">Pending</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ef4444' }}></div>
                  <span className="small text-muted">Loss</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#10b981' }}></div>
                  <span className="small text-muted">Won</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Overview */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">Balance Overview</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                  <option>Current Year</option>
                </select>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <div>
                  <div className="fs-5 fw-bold text-dark">$584k</div>
                  <div className="small text-muted">Revenue</div>
                </div>
                <div>
                  <div className="fs-5 fw-bold text-dark">$497k</div>
                  <div className="small text-muted">Expenses</div>
                </div>
                <div>
                  <div className="fs-5 fw-bold text-dark">3.6%</div>
                  <div className="small text-muted">Profit Ratio</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={202}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.65rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.65rem' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <div className="d-flex justify-content-center gap-3 mt-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#10b981' }}></div>
                  <span className="small text-muted">Revenue</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ef4444' }}></div>
                  <span className="small text-muted">Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




// Analytics 10: Companies & Revenue Dashboard
export const Analytics10 = () => {
    const companiesWeekData = [
      { day: 'M', value: 50, bg: 95 },
      { day: 'T', value: 105, bg: 95 },
      { day: 'W', value: 45, bg: 95 },
      { day: 'T', value: 195, bg: 95 },
      { day: 'F', value: 65, bg: 95 },
      { day: 'S', value: 80, bg: 95 },
      { day: 'S', value: 90, bg: 95 }
    ];
  
    const revenueData = [
      { month: 'Jan', revenue: 40000, bg: 100000 },
      { month: 'Feb', revenue: 30000, bg: 100000 },
      { month: 'Mar', revenue: 45000, bg: 100000 },
      { month: 'Apr', revenue: 75000, bg: 100000 },
      { month: 'May', revenue: 85000, bg: 100000 },
      { month: 'Jun', revenue: 90000, bg: 100000 },
      { month: 'Jul', revenue: 80000, bg: 100000 },
      { month: 'Aug', revenue: 85000, bg: 100000 },
      { month: 'Sep', revenue: 85000, bg: 100000 },
      { month: 'Oct', revenue: 85000, bg: 100000 },
      { month: 'Nov', revenue: 20000, bg: 100000 },
      { month: 'Dec', revenue: 85000, bg: 100000 }
    ];
  
    const plansData = [
      { name: 'Basic', value: 60, color: '#3b82f6' },
      { name: 'Premium', value: 20, color: '#fbbf24' },
      { name: 'Enterprise', value: 20, color: '#ef4444' }
    ];
  
    return (
      <div className="w-100  p-4 overflow-auto">
        <div className="container-fluid">
          {/* Top Stats */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="bg-white rounded-3 shadow-sm p-3 position-relative" style={{ borderTop: '3px solid #ef4444' }}>
                <div className="position-absolute top-0 end-0 m-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2', border: '2px solid #ef4444' }}>
                    <Building2 size={20} className="text-danger" />
                  </div>
                </div>
                <div className="text-muted small mb-1">Total Companies</div>
                <div className="fs-3 fw-bold text-dark mb-1">5468</div>
                <div className="small text-success">↑ 5.62% from last month</div>
              </div>
            </div>
  
            <div className="col-6 col-md-3">
              <div className="bg-white rounded-3 shadow-sm p-3 position-relative" style={{ borderTop: '3px solid #10b981' }}>
                <div className="position-absolute top-0 end-0 m-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '40px', height: '40px', backgroundColor: '#d1fae5', border: '2px solid #10b981' }}>
                    <ShoppingCart size={20} className="text-success" />
                  </div>
                </div>
                <div className="text-muted small mb-1">Active Companies</div>
                <div className="fs-3 fw-bold text-dark mb-1">4598</div>
                <div className="small text-danger">↓ 12% from last month</div>
              </div>
            </div>
  
            <div className="col-6 col-md-3">
              <div className="bg-white rounded-3 shadow-sm p-3 position-relative" style={{ borderTop: '3px solid #f59e0b' }}>
                <div className="position-absolute top-0 end-0 m-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
                    <Users size={20} className="text-warning" />
                  </div>
                </div>
                <div className="text-muted small mb-1">Total Subscribers</div>
                <div className="fs-3 fw-bold text-dark mb-1">5468</div>
                <div className="small text-success">↑ 6% from last month</div>
              </div>
            </div>
  
            <div className="col-6 col-md-3">
              <div className="bg-white rounded-3 shadow-sm p-3 position-relative" style={{ borderTop: '3px solid #ef4444' }}>
                <div className="position-absolute top-0 end-0 m-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2', border: '2px solid #ef4444' }}>
                    <DollarSign size={20} className="text-danger" />
                  </div>
                </div>
                <div className="text-muted small mb-1">Total Earnings</div>
                <div className="fs-3 fw-bold text-dark mb-1">$89,878,58</div>
                <div className="small text-danger">↓ 16% from last month</div>
              </div>
            </div>
          </div>
  
          <div className="row g-3" style={{marginTop: '30px'}}>
            {/* Companies Chart */}
            <div className="col-12 col-lg-4">
              <div className="bg-white rounded-3 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-6 fw-bold text-dark">Companies</h3>
                  <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                    <option>This Week</option>
                  </select>
                </div>
  
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={companiesWeekData}>
                    <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="bg" fill="#f1f5f9" radius={[4, 4, 4, 4]} />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
  
                <div className="text-center mt-3">
                  <span className="small text-success">↑ 12.5% from last month</span>
                </div>
              </div>
            </div>
  
            {/* Revenue Chart */}
            <div className="col-12 col-lg-5">
              <div className="bg-white rounded-3 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-6 fw-bold text-dark">Revenue</h3>
                  <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                    <option>2025</option>
                  </select>
                </div>
  
                <div className="mb-3">
                  <div className="fs-4 fw-bold text-dark">$89,878,58</div>
                  <div className="small text-success">↑ 40% increased from last year</div>
                </div>
  
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444' }}></div>
                  <span className="small text-muted">Revenue</span>
                </div>
  
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={revenueData}>
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <Tooltip />
                    <Bar dataKey="bg" fill="#f1f5f9" radius={[4, 4, 4, 4]} />
                    <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            {/* Top Plans */}
            <div className="col-12 col-lg-3">
              <div className="bg-white rounded-3 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-6 fw-bold text-dark">Top Plans</h3>
                  <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                    <option>Last 30 Days</option>
                  </select>
                </div>
  
                <div className="d-flex justify-content-center mb-4">
                  <div className="position-relative" style={{ width: '200px', height: '168px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={plansData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {plansData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
  
                <div>
                  {plansData.map((plan, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: plan.color }}></div>
                        <span className="small text-dark">{plan.name}</span>
                      </div>
                      <span className="small fw-bold text-dark">{plan.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Analytics 11: Sales & Audience Dashboard
  export const Analytics11 = () => {
    const salesOverviewData = [
      { month: 'Jan', sale1: 35000, sale2: 25000 },
      { month: 'Feb', sale1: 42000, sale2: 32000 },
      { month: 'Mar', sale1: 38000, sale2: 30000 },
      { month: 'Apr', sale1: 65000, sale2: 60000 },
      { month: 'May', sale1: 68000, sale2: 62000 },
      { month: 'Jun', sale1: 95000, sale2: 88000 },
      { month: 'Jul', sale1: 105000, sale2: 95000 }
    ];
  
    const audienceData = [
      { name: 'Segment1', value: 33, color: '#2585f8' },
      { name: 'Segment2', value: 25, color: '#2585f8' },
      { name: 'Segment3', value: 22, color: '#10b981' },
      { name: 'Segment4', value: 20, color: '#3b82f6' }
    ];
  
    return (
      <div className="w-100  p-2 overflow-auto">
        <div className="container-fluid">
          <div className="row g-2">
            
  
            {/* Metric Cards Grid */}
            <div className="col-12 col-lg-7">
              <div className="row g-2">
                <div className="col-6" style={{marginTop: '37px'}}>
                  <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f8f9ff' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff' }}>
                        <Package size={20} className="text-primary" />
                      </div>
                      <button className="btn btn-sm p-0" style={{ fontSize: '0.7rem' }}>⋮</button>
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Total Order</div>
                    <div className="fs-6 fw-bold text-dark mb-1">$84.00K</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +17.5% Than Last Week</div>
                  </div>
                </div>
  
                <div className="col-6" style={{marginTop: '37px'}}>
                  <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f8f9ff' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff' }}>
                        <ShoppingCart size={20} className="text-primary" />
                      </div>
                      <button className="btn btn-sm p-0" style={{ fontSize: '0.7rem' }}>⋮</button>
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Product Views</div>
                    <div className="fs-6 fw-bold text-dark mb-1">3.00M</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +17.5% Than Last Week</div>
                  </div>
                </div>
  
                <div className="col-6" style={{marginTop: '37px'}}>
                  <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f8f9ff' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff' }}>
                        <Coffee size={20} className="text-primary" />
                      </div>
                      <button className="btn btn-sm p-0" style={{ fontSize: '0.7rem' }}>⋮</button>
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Total Customers</div>
                    <div className="fs-6 fw-bold text-dark mb-1">12.00K</div>
                    <div className="text-danger" style={{ fontSize: '0.65rem' }}>↓ +17.5% Than Last Week</div>
                  </div>
                </div>
  
                <div className="col-6" style={{marginTop: '37px'}}>
                  <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f8f9ff' }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff' }}>
                        <span style={{ fontSize: '1.2rem' }}>😊</span>
                      </div>
                      <button className="btn btn-sm p-0" style={{ fontSize: '0.7rem' }}>⋮</button>
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Total Income</div>
                    <div className="fs-6 fw-bold text-dark mb-1">$59.00K</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +17.5% Than Last Week</div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Audience */}
            <div className="col-12 col-lg-5">
              <div className="bg-white rounded-3 shadow-sm p-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="fs-6 fw-bold text-dark">Audience</h3>
                  <button className="btn btn-sm p-0" style={{ fontSize: '0.7rem' }}>⋮</button>
                </div>
  
                <div className="d-flex justify-content-center mb-2">
                  <div className="position-relative" style={{ width: '140px', height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={audienceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {audienceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center">
                      <span className="fs-6 fw-semibold text-success">Overview</span>
                    </div>
                  </div>
                </div>
  
                <div className="text-center mb-2">
                  <div className="d-flex justify-content-center gap-2 mb-1">
                    <div>
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#2585f8' }}></div>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>Total Subscribed</span>
                      </div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>279M</div>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#10b981' }}></div>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>New User</span>
                      </div>
                      <div className="fw-bold text-danger" style={{ fontSize: '0.8rem' }}>8900K</div>
                    </div>
                  </div>
  
                  <div className="d-flex justify-content-center gap-1 mt-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="rounded-circle" style={{ width: '24px', height: '24px', backgroundColor: i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : i === 3 ? '#fbbf24' : '#06b6d4', border: '2px solid white' }}></div>
                    ))}
                  </div>
                </div>
  
                <div className="text-end">
                  <button className="btn btn-sm btn-light rounded-circle" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>⚙️</button>
                </div>
              </div>
            </div>


          </div>

          <div className="row g-2" style={{marginTop: '30px'}}>
                    {/* Sales Overview */}
            <div className="col-12 col-lg-12">
              <div className="bg-white rounded-3 shadow-sm p-2">
                {/* <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h3 className="fs-6 fw-bold text-dark mb-2">Sales Overview</h3>
                    <div className="d-flex gap-3 mb-2">
                      <div>
                        <div className="fs-6 fw-bold text-dark">$5900.00</div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                          <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#2585f8' }}></div>
                          <span className="text-muted">Sale Today</span>
                          <span className="text-success">8.5%</span>
                        </div>
                      </div>
                      <div>
                        <div className="fs-6 fw-bold text-dark">$5900.00</div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                          <div className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#06b6d4' }}></div>
                          <span className="text-muted">Sale Today</span>
                          <span className="text-danger">8.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-dark rounded-pill px-2" style={{ fontSize: '0.65rem' }}>1W</button>
                    <button className="btn btn-sm btn-light rounded-pill px-2" style={{ fontSize: '0.65rem' }}>1M</button>
                    <button className="btn btn-sm btn-light rounded-pill px-2" style={{ fontSize: '0.65rem' }}>1Y</button>
                  </div>
                </div> */}
  
                {/* <button className="btn btn-sm btn-outline-secondary rounded-pill mb-2" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
                  <span className="me-1">⬇</span> Download Report
                </button> */}
  
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={salesOverviewData}>
                    <defs>
                      <linearGradient id="colorSale1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2585f8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2585f8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSale2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sale1" stroke="#2585f8" strokeWidth={2} fillOpacity={1} fill="url(#colorSale1)" />
                    <Area type="monotone" dataKey="sale2" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSale2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
// Analytics 12: HR & Department Dashboard
export const Analytics12 = () => {
    const departmentData = [
      { dept: 'UI/UX', employees: 120 },
      { dept: 'Development', employees: 125 },
      { dept: 'Management', employees: 100 },
      { dept: 'HR', employees: 25 },
      { dept: 'Testing', employees: 85 },
      { dept: 'Marketing', employees: 122 },
      { dept: 'HR', employees: 25 },
      { dept: 'Testing', employees: 85 },
      { dept: 'Marketing', employees: 122 }
    ];

    return (
      <div className="w-100  p-2 overflow-auto">
        <div className="container-fluid">
          <div className="row g-2">
            {/* Left Side - 8 Metric Cards in 2 Rows */}
            <div className="col-12 col-lg-6">
              <div className="row g-2 mb-2">
                {/* First Row - 4 Metric Cards */}
                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#ef4444' }}>
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Profit This Week</div>
                    <div className="fs-6 fw-bold text-dark mb-1">$5,544</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +2.1%</div>
                  </div>
                </div>
  
                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#10b981' }}>
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Job Applicants</div>
                    <div className="fs-6 fw-bold text-dark mb-1">98</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +2.1%</div>
                  </div>
                </div>
  
                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#1f2937' }}>
                      <UserCheck size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>New Hire</div>
                    <div className="fs-6 fw-bold text-dark mb-1">45/48</div>
                    <div className="text-danger" style={{ fontSize: '0.65rem' }}>↓ 11.2%</div>
                  </div>
                </div>

                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#3b82f6' }}>
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Total Employees</div>
                    <div className="fs-6 fw-bold text-dark mb-1">1,245</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +5.3%</div>
                  </div>
                </div>

                {/* Second Row - 4 Metric Cards */}
                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#2585f8' }}>
                      <DollarSign size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Revenue</div>
                    <div className="fs-6 fw-bold text-dark mb-1">$89,432</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +12.5%</div>
                  </div>
                </div>

                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#f59e0b' }}>
                      <Package size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Total Orders</div>
                    <div className="fs-6 fw-bold text-dark mb-1">2,847</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +8.2%</div>
                  </div>
                </div>

                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#06b6d4' }}>
                      <ShoppingCart size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Active Projects</div>
                    <div className="fs-6 fw-bold text-dark mb-1">156</div>
                    <div className="text-success" style={{ fontSize: '0.65rem' }}>↑ +3.7%</div>
                  </div>
                </div>

                <div className="col-6 col-lg-6">
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-1" 
                         style={{ width: '36px', height: '36px', backgroundColor: '#14b8a6' }}>
                      <TrendingDown size={20} className="text-white" />
                    </div>
                    <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Expenses</div>
                    <div className="fs-6 fw-bold text-dark mb-1">$34,210</div>
                    <div className="text-danger" style={{ fontSize: '0.65rem' }}>↓ -2.4%</div>
                  </div>
                </div>
              </div>
            </div>
{/* Right Side - Employees By Department Bar Chart */}
<div className="col-12 col-lg-6">
              <div className="bg-white rounded-3 shadow-sm p-2 h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="fs-6 fw-bold text-dark">Employees By Department</h3>
                  <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                    <option>This Week</option>
                  </select>
                </div>

                <div className="mb-2">
                  {departmentData.map((item, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{item.dept}</span>
                      </div>
                      <div className="progress" style={{ height: '14px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{ width: `${(item.employees / 130) * 100}%` }}
                          aria-valuenow={item.employees} 
                          aria-valuemin={0} 
                          aria-valuemax={130}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center" style={{ fontSize: '0.7rem' }}>
                  <span className="text-muted">No of Employees increased by </span>
                  <span className="fw-bold text-warning">+20%</span>
                  <span className="text-muted"> from last Week</span>
                </div>
              </div>
            </div>
           
          </div>

          
        </div>
      </div>
    );
  };

  // Analytics 13: Sales Funnel & Pipeline
export const Analytics13 = () => {
  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        <div className="row g-2">
          {/* Left Column - Stats Cards */}
          <div className="col-12 col-lg-5">
            <div className="row g-2">
              {/* Total Deals */}
              <div className="col-6" style={{marginTop: '30px', marginBottom: '60px', }}>
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #fb923c' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <span className="text-warning" style={{ fontSize: '0.9rem' }}>🔺</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Total Deals</div>
                  <div className="fs-6 fw-bold text-dark mb-1">$45,221,45</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-danger" style={{ fontSize: '0.6rem' }}>↘ -4.01% from last week</div>
                </div>
              </div>

              {/* Total Customers */}
              <div className="col-6" style={{marginTop: '30px', marginBottom: '60px', }}>
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #2585f8' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#2585f820' }}>
                      <span style={{ fontSize: '0.9rem', color: '#2585f8' }}>👥</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Total Customers</div>
                  <div className="fs-6 fw-bold text-dark mb-1">9895</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar" style={{ width: '85%', backgroundColor: '#a855f7' }}></div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.6rem' }}>↗ +55% from last week</div>
                </div>
              </div>

              {/* Deal Value */}
              <div className="col-6" style={{marginTop: '30px', marginBottom: '60px', }}>
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #14b8a6' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <span className="text-info" style={{ fontSize: '0.9rem' }}>💎</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Deal Value</div>
                  <div className="fs-6 fw-bold text-dark mb-1">$12,545,68</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar bg-info" style={{ width: '70%' }}></div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.6rem' }}>↗ +20.01% from last week</div>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="col-6" style={{marginTop: '30px', marginBottom: '60px', }}>
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #3b82f6' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <span className="text-primary" style={{ fontSize: '0.9rem' }}>🎯</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Conversion Rate</div>
                  <div className="fs-6 fw-bold text-dark mb-1">51.96%</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '52%' }}></div>
                  </div>
                  <div className="text-danger" style={{ fontSize: '0.6rem' }}>↘ -6.01% from last week</div>
                </div>
              </div>

              {/* Revenue this month */}
              <div className="col-6">
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #ec4899' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#fce7f3' }}>
                      <span style={{ fontSize: '0.9rem' }}>💰</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Revenue this month</div>
                  <div className="fs-6 fw-bold text-dark mb-1">$46,548,48</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar" style={{ width: '78%', backgroundColor: '#ec4899' }}></div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.6rem' }}>↗ +55% from last week</div>
                </div>
              </div>

              {/* Active Customers */}
              <div className="col-6">
                <div className="bg-white rounded-3 shadow-sm p-2 position-relative" style={{ borderLeft: '3px solid #eab308' }}>
                  <div className="position-absolute top-0 end-0 m-1">
                    <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <span className="text-warning" style={{ fontSize: '0.9rem' }}>⭐</span>
                    </div>
                  </div>
                  <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>Active Customers</div>
                  <div className="fs-6 fw-bold text-dark mb-1">8987</div>
                  <div className="progress mb-1" style={{ height: '3px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '65%' }}></div>
                  </div>
                  <div className="text-danger" style={{ fontSize: '0.6rem' }}>↘ -3.22% from last week</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pipeline */}
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-3 shadow-sm p-2 h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-6 fw-bold text-dark">Pipeline Stages</h3>
                <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.65rem' }}>
                  <span>📅</span>
                  <span>This Week</span>
                </div>
              </div>

              {/* Funnel Chart */}
              <div className="mb-2">
                <div className="d-flex flex-column align-items-center gap-1">
                  <div className="w-100 text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Marketing : 7,898</span>
                  </div>
                  <div className="text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', opacity: 0.9, width: '92%', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Sales : 4658</span>
                  </div>
                  <div className="text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', opacity: 0.8, width: '84%', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Email : 2898</span>
                  </div>
                  <div className="text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', opacity: 0.7, width: '76%', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Chat : 789</span>
                  </div>
                  <div className="text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', opacity: 0.6, width: '68%', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Operational : 655</span>
                  </div>
                  <div className="text-white text-center py-2 rounded-2" style={{ backgroundColor: '#fb923c', opacity: 0.5, width: '60%', fontSize: '0.75rem' }}>
                    <span className="fw-semibold">Calls : 451</span>
                  </div>
                </div>
              </div>

              {/* Leads Values */}
              <div style={{marginTop: '80px'}}>
                <h4 className="fs-6 fw-bold text-dark mb-2" style={{ fontSize: '0.85rem' }}>Leads Values By Stages</h4>
                <div className="row g-2">
                  <div className="col">
                    <div className="text-center">
                      <div className="text-warning mb-1" style={{ fontSize: '0.65rem' }}>● Marketing</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>$5,221,45</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="text-center">
                      <div className="text-warning mb-1" style={{ fontSize: '0.65rem' }}>● Sales</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>$30,424</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="text-center">
                      <div className="text-warning mb-1" style={{ fontSize: '0.65rem' }}>● Email</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>$21,135</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="text-center">
                      <div className="text-warning mb-1" style={{ fontSize: '0.65rem' }}>● Chat</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>$15,235</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="text-center">
                      <div className="text-warning mb-1" style={{ fontSize: '0.65rem' }}>● Operational</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>$10,557</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 14: User Metrics Dashboard
export const Analytics14 = () => {
  const revenueGrowthData = [
    { month: 'Jan', value: 30000 },
    { month: 'Feb', value: 32000 },
    { month: 'Mar', value: 35000 },
    { month: 'Apr', value: 33000 },
    { month: 'May', value: 38000 },
    { month: 'Jun', value: 42000 },
    { month: 'Jul', value: 40000 },
    { month: 'Aug', value: 45000 },
    { month: 'Sep', value: 43000 },
    { month: 'Oct', value: 48000 },
    { month: 'Nov', value: 46000 },
    { month: 'Dec', value: 50000 }
  ];

  const miniChartData = [
    { x: 1, y: 20 }, { x: 2, y: 40 }, { x: 3, y: 30 }, { x: 4, y: 50 }, { x: 5, y: 45 }, { x: 6, y: 60 }
  ];

  return (
    <div className="w-100  p-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '100%' }}>
        <div className="row g-2" style={{ margin: 0 }}>
          {/* Left Column - Metric Cards */}
          <div className="col-12 col-lg-12">
            <div className="row g-2">
              {/* New Users */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <Users size={20} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>New Users</div>
                        <div className="fs-6 fw-bold text-dark">15,000</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">+200</span> this week</div>
                </div>
              </div>

              {/* Active Users */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f0fdf4' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <Users size={20} className="text-success" />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Active Users</div>
                        <div className="fs-6 fw-bold text-dark">8,000</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">+200</span> this week</div>
                </div>
              </div>

              {/* Total Sales */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#fff7ed' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-warning bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <ShoppingCart size={20} className="text-warning" />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Total Sales</div>
                        <div className="fs-6 fw-bold text-dark">$5,00,000</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-danger" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">-$10k</span> this week</div>
                </div>
              </div>

              {/* Conversion */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#f5f3ff' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e9d5ff' }}>
                        <Target size={20} style={{ color: '#a855f7' }} />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Conversion</div>
                        <div className="fs-6 fw-bold text-dark">25%</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#a855f7" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">+5%</span> this week</div>
                </div>
              </div>

              {/* Leads */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#fce7f3' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fbcfe8' }}>
                        <Users size={20} style={{ color: '#ec4899' }} />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Leads</div>
                        <div className="fs-6 fw-bold text-dark">250</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#ec4899" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">+20</span> this week</div>
                </div>
              </div>

              {/* Total Profit */}
              <div className="col-12 col-md-6">
                <div className="bg-white rounded-3 shadow-sm p-2" style={{ backgroundColor: '#cffafe' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-info bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <DollarSign size={20} className="text-info" />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>Total Profit</div>
                        <div className="fs-6 fw-bold text-dark">$3,00,700</div>
                      </div>
                    </div>
                    <div style={{ width: '60px', height: '30px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniChartData}>
                          <Line type="monotone" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '0.65rem' }}>Increase by <span className="fw-semibold">+$15k</span> this week</div>
                </div>
              </div>
            </div>
          </div>

          
        </div>

        <div className="row g-2">
            {/* Right Column - Revenue Growth */}
          <div className="col-12 col-lg-12">
            <div className="bg-white rounded-3 shadow-sm p-2 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h3 className="fs-6 fw-bold text-dark mb-1">Revenue Growth</h3>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Weekly Report</div>
                </div>
                <div className="text-end">
                  <div className="fs-6 fw-bold text-dark">$50,000.00</div>
                  <div className="badge bg-success" style={{ fontSize: '0.65rem' }}>$10k</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueGrowthData}>
                  <defs>
                    <linearGradient id="colorRevenue8" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue8)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics 15: Cryptocurrency Portfolio
export const Analytics15 = () => {
  const portfolioData = [
    { name: 'Bitcoin', value: 35, color: '#2585f8' },
    { name: 'Ethereum', value: 30, color: '#3b82f6' },
    { name: 'Litecoin', value: 20, color: '#f59e0b' },
    { name: 'Dash', value: 15, color: '#10b981' }
  ];

  const miniChartData = [
    { x: 1, y: 20 }, { x: 2, y: 40 }, { x: 3, y: 30 }, { x: 4, y: 50 }, { x: 5, y: 45 }, { x: 6, y: 60 }
  ];

  const cryptoAssets = [
    { name: 'Bitcoin', symbol: 'BTC', amount: 'BTC 0.00584875', value: '$19,405.12', icon: '₿', color: '#f59e0b' },
    { name: 'Ethereum', symbol: 'ETH', amount: 'ETH 2.25842108', value: '$40552.18', icon: 'Ξ', color: '#2585f8' },
    { name: 'Litecoin', symbol: 'LTC', amount: 'LTC 10.58963217', value: '$15824.58', icon: 'Ł', color: '#94a3b8' },
    { name: 'Dash', symbol: 'DASH', amount: 'DASH 204.28565885', value: '$30635.84', icon: 'Đ', color: '#06b6d4' }
  ];

  const cryptoCards = [
    { name: 'Bitcoin', value: '$1,523,647', change: '+13.11%', ticker: '(BTC)', color: '#f59e0b', positive: true },
    { name: 'Litecoin', value: '$2,145,687', change: '+15.08%', ticker: '(LTC)', color: '#94a3b8', positive: true },
    { name: 'Ethereum', value: '$3,312,870', change: '+08.57%', ticker: '(ETC)', color: '#10b981', positive: true },
    // { name: 'Binance', value: '$1,820,045', change: '-09.21%', ticker: '(BNB)', color: '#f59e0b', positive: false },
    // { name: 'Dash', value: '$9,458,153', change: '+12.07%', ticker: '(DASH)', color: '#06b6d4', positive: true }
  ];

  return (
    <div className="w-100  p-2 overflow-auto">
      <div className="container-fluid">
        <div className="row g-2">
          {/* Left Column - Portfolio */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-6 fw-bold text-dark">My Portfolio</h3>
                <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '0.75rem' }}>
                  <option>BTC</option>
                </select>
              </div>

              <div className="d-flex justify-content-center mb-4">
                <div className="position-relative" style={{ width: '180px', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center">
                    <span className="small text-muted">Total value</span>
                    <span className="fs-4 fw-bold text-dark">$106416</span>
                  </div>
                </div>
              </div>

              <div className="border-top pt-3">
                {cryptoAssets.map((crypto, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: `${crypto.color}20` }}>
                        <span style={{ color: crypto.color, fontSize: '1.2rem', fontWeight: 'bold' }}>{crypto.icon}</span>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark small">{crypto.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>● {crypto.symbol}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="small fw-semibold text-dark">{crypto.amount}</div>
                      <div className="text-success" style={{ fontSize: '0.7rem' }}>{crypto.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Market Graph */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-2">
              {/* Top Stats */}
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <div className="border rounded-2 p-2">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>TOTAL INVESTED</div>
                    <div className="fs-5 fw-bold text-dark">$2,390.68</div>
                    <div className="badge bg-success" style={{ fontSize: '0.65rem' }}>+ 6.24%</div>
</div>
</div>
<div className="col-4">
<div className="border rounded-2 p-2">
<div className="text-muted" style={{ fontSize: '0.7rem' }}>TOTAL CHANGE</div>
<div className="fs-5 fw-bold text-dark">$19,523.25</div>
<div className="badge bg-success" style={{ fontSize: '0.65rem' }}>+ 3.67%</div>
</div>
</div>
<div className="col-4">
<div className="border rounded-2 p-2">
<div className="text-muted" style={{ fontSize: '0.7rem' }}>DAY CHANGE</div>
<div className="fs-5 fw-bold text-dark">$14,799.44</div>
<div className="badge bg-danger" style={{ fontSize: '0.65rem' }}>- 4.80%</div>
</div>
</div>
</div>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="fs-6 fw-bold text-dark">Market Graph</h3>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-light">1H</button>
                <button className="btn btn-sm btn-light">7D</button>
                <button className="btn btn-sm btn-light">1M</button>
                <button className="btn btn-sm btn-light">1Y</button>
                <button className="btn btn-sm btn-primary">ALL</button>
              </div>
            </div>

            <div className="d-flex gap-3 mb-2" style={{ fontSize: '0.75rem' }}>
              <div>
                <span className="fw-bold text-dark">0.014756</span>
                <span className="text-success ms-2">$75.69 +1.89%</span>
              </div>
              <div>
                <span className="text-muted">High</span>
                <span className="fw-semibold text-dark ms-1">0.014578</span>
              </div>
              <div>
                <span className="text-muted">Low</span>
                <span className="fw-semibold text-dark ms-1">0.0175489</span>
              </div>
            </div>
          </div>

          <div style={{ height: '165px', backgroundColor: '#f8f9fa', borderRadius: '8px' }} className="mb-3 d-flex align-items-center justify-content-center">
            <span className="text-muted">Candlestick Chart Placeholder</span>
          </div>

          <div className="text-end mb-3">
            <div className="d-flex justify-content-end gap-4">
              <div>
                <span className="text-muted small">Total Balance</span>
                <div className="fw-bold text-dark">$72.8k</div>
              </div>
              <div>
                <span className="text-muted small">Profit</span>
                <div className="fw-bold text-success">+$49.7k</div>
              </div>
              <div>
                <span className="text-muted small">Loss</span>
                <div className="fw-bold text-danger">-$23.1k</div>
              </div>
            </div>
          </div>

          {/* Crypto Cards */}
          <div className="row g-2">
            {cryptoCards.map((crypto, idx) => (
              <div key={idx} className="col-6 col-md-4 col-lg">
                <div className="border rounded-2 p-2 text-center">
                  <div className="small text-muted mb-1">{crypto.name}</div>
                  <div className="fw-bold text-dark small">{crypto.value}</div>
                  <div className={`small ${crypto.positive ? 'text-success' : 'text-danger'}`}>
                    {crypto.change} <span className="text-muted">{crypto.ticker}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Additional Cryptos */}
      <div className="col-12 col-lg-4">
        <div className="row g-2">
          {cryptoCards.map((crypto, idx) => (
            <div key={idx} className="col-12">
              <div className="bg-white rounded-3 shadow-sm p-3">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: `${crypto.color}20` }}>
                    <span style={{ fontSize: '1.2rem' }}>₿</span>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold text-dark">{crypto.name}</div>
                    <div className="fs-5 fw-bold text-dark">{crypto.value}</div>
                  </div>
                  <button className="btn btn-sm">⋯</button>
                </div>
                <div className={`small ${crypto.positive ? 'text-success' : 'text-danger'}`}>
                  {crypto.change} <span className="text-muted">{crypto.ticker}</span>
                </div>
                <div style={{ height: '50px', marginTop: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miniChartData}>
                      <Line type="monotone" dataKey="y" stroke={crypto.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
);
};