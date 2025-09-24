import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Button } from 'react-bootstrap';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export interface DonutSeries {
  name: string;
  data: number[];
}

export interface ChartDonutProps {
  series: number[];
  labels: string[];
  colors?: string[];
  height?: number;
  width?: number | string;
  title?: string;
  loading?: boolean;
  showFullScreenButton?: boolean;
  onFullScreenClick?: () => void;
  className?: string;
  dataType?: 'calls' | 'time' | 'cost' | 'percentage' | 'custom';
  customTooltipFormatter?: (value: number, seriesName: string) => string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showDataLabels?: boolean;
  dataLabelsFormatter?: (value: number) => string;
  donutWidth?: string;
  strokeWidth?: number;
  customColors?: boolean;
  animateOnMount?: boolean;
}

const ChartDonut: React.FC<ChartDonutProps> = ({
  series,
  labels,
  colors = ['#00E396', '#FF4560', '#775DD0', '#FEB019', '#546E7A', '#26a69a'],
  height = 280,
  width = '100%',
  title,
  loading = false,
  showFullScreenButton = false,
  onFullScreenClick,
  className = '',
  dataType = 'custom',
  customTooltipFormatter,
  showLegend = true,
  legendPosition = 'right',
  showDataLabels = true,
  dataLabelsFormatter,
  donutWidth = '60%',
  strokeWidth = 0,
  customColors = false,
  animateOnMount = true
}) => {
  // Helper function to convert seconds to minutes and seconds format
  const formatTimeFromSeconds = (seconds: number): string => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '0s';
    }
    
    if (seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // Default tooltip formatter based on data type
  const getDefaultTooltipFormatter = (value: number, seriesName: string): string => {
    switch (dataType) {
      case 'calls':
        return `${value} calls`;
      case 'time':
        return formatTimeFromSeconds(value);
      case 'cost':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return customTooltipFormatter ? customTooltipFormatter(value, seriesName) : value.toString();
    }
  };

  // Default data labels formatter
  const getDefaultDataLabelsFormatter = (value: number): string => {
    if (dataLabelsFormatter) {
      return dataLabelsFormatter(value);
    }
    
    switch (dataType) {
      case 'percentage':
        return `${value.toFixed(0)}%`;
      case 'calls':
        return `${value}`;
      case 'time':
        return formatTimeFromSeconds(value);
      case 'cost':
        return `$${value.toFixed(0)}`;
      default:
        return `${value}`;
    }
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      animations: {
        enabled: animateOnMount,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    labels: labels,
    colors: customColors ? colors : undefined,
    plotOptions: {
      pie: {
        donut: {
          size: donutWidth,
          labels: {
            show: false,
            name: {
              show: false
            },
            value: {
              show: false
            }
          }
        }
      }
    },
    stroke: {
      width: strokeWidth,
      colors: ['#fff']
    },
    legend: {
      show: showLegend,
      position: legendPosition,
      fontSize: '12px',
      fontFamily: 'inherit',
      markers: {
        size: 12
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: ['#fff'],
        fontSize: '12px',
        fontWeight: 'bold',
      },
      dropShadow: {
        enabled: false
      },
      formatter: function (val: number) {
        return getDefaultDataLabelsFormatter(val);
      }
    },
    tooltip: {
      enabled: true,
      y: {
        title: {
          formatter: function(seriesName: string) {
            return seriesName;
          }
        },
        formatter: function(value: number, { seriesIndex, w }: any) {
          try {
            const seriesName = w?.globals?.labels?.[seriesIndex] || `Series ${seriesIndex + 1}`;
            return getDefaultTooltipFormatter(value, seriesName);
          } catch (error) {
            console.warn('Error in tooltip formatter:', error);
            return getDefaultTooltipFormatter(value, `Series ${seriesIndex + 1}`);
          }
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200,
          height: 150
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  if (loading) {
    return (
      <div className={`chart-container ${className}`}>
        {title && <h5 className="mb-3">{title}</h5>}
        <div className="d-flex align-items-center justify-content-center" style={{ height: `${height}px` }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading chart...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!series || series.length === 0 || !labels || labels.length === 0) {
    return (
      <div className={`chart-container ${className}`}>
        {title && <h5 className="mb-3">{title}</h5>}
        <div className="d-flex align-items-center justify-content-center" style={{ height: `${height}px` }}>
          <p className="text-muted mb-0">No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart-container ${className}`}>
      {title && <h5 className="mb-3">{title}</h5>}
      <div className="position-relative">
        {showFullScreenButton && onFullScreenClick && (
          <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 10 }}>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={onFullScreenClick}
            >
              <i className="material-icons-two-tone me-1">fullscreen</i>
              View Full Size
            </Button>
          </div>
        )}
        <ReactApexChart 
          options={chartOptions} 
          series={series} 
          type="donut" 
          height={height}
          width={width}
        />
      </div>
    </div>
  );
};

export default ChartDonut; 