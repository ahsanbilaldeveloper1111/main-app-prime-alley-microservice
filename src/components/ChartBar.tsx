import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Button, Modal } from 'react-bootstrap';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartBarProps {
  series: ChartSeries[];
  categories: string[];
  colors?: string[];
  height?: number;
  title?: string;
  loading?: boolean;
  showFullScreenButton?: boolean;
  onFullScreenClick?: () => void;
  className?: string;
  dataType?: 'calls' | 'time' | 'cost' | 'custom';
  customTooltipFormatter?: (value: number, seriesName: string) => string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showDataLabels?: boolean;
  barHeight?: string;
  borderRadius?: number;
  horizontal?: boolean;
  maxDisplayedItems?: number;
  showViewAllButton?: boolean;
  viewAllButtonText?: string;
  yAxisLabel?: string;
  useLogScale?: boolean;
}

const ChartBar: React.FC<ChartBarProps> = ({
  series,
  categories,
  colors = [
    '#fbbc05', //yellow
    '#008ffb', //blue
    '#00e396', //green
    
  ],
  height = 300,
  title,
  loading = false,
  showFullScreenButton = false,
  onFullScreenClick,
  className = '',
  dataType = 'custom',
  customTooltipFormatter,
  showLegend = true,
  legendPosition = 'bottom',
  showDataLabels = false,
  barHeight = '60%',
  borderRadius = 4,
  horizontal = true,
  maxDisplayedItems = 10,
  showViewAllButton = false,
  viewAllButtonText = 'View All',
  yAxisLabel,
  useLogScale = false
}) => {
  const [showAllDataModal, setShowAllDataModal] = useState(false);
  const [chartDataType, setChartDataType] = useState(dataType);

  // Update dataType when prop changes
  useEffect(() => {
    setChartDataType(dataType);
  }, [dataType]);

  // Helper function to convert seconds to minutes and seconds format
  const formatTimeFromSeconds = (seconds: number): string => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00:00';
    }
    
    if (seconds === 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to convert seconds to HH:MM:SS format
  const formatSecondsToHHMMSS = (seconds: number): string => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Default tooltip formatter based on data type
  const getDefaultTooltipFormatter = (value: number, seriesName: string): string => {
    switch (chartDataType) {
      case 'calls':
        return `${value} calls`;
      case 'time':
        return formatTimeFromSeconds(value);
      case 'cost':
        return `$${value.toFixed(2)}`;
      default:
        return customTooltipFormatter ? customTooltipFormatter(value, seriesName) : value.toString();
    }
  };

  // Limit displayed items if maxDisplayedItems is set
  const shouldLimitItems = maxDisplayedItems && categories.length > maxDisplayedItems;
  
  // Function to get indices of top N largest values across all series
  const getTopIndices = (series: ChartSeries[], categories: string[], topN: number): number[] => {
    // Calculate total values for each category across all series
    const categoryTotals = categories.map((_, index) => 
      series.reduce((sum, s) => sum + (s.data[index] || 0), 0)
    );
    
    // Create array of indices with their total values
    const indicesWithValues = categoryTotals.map((total, index) => ({ index, total }));
    
    // Sort by total value in descending order and take top N
    return indicesWithValues
      .sort((a, b) => b.total - a.total)
      .slice(0, topN)
      .map(item => item.index)
      .sort((a, b) => a - b); // Sort indices back to original order for display
  };

  const displayedCategories = shouldLimitItems 
    ? getTopIndices(series, categories, maxDisplayedItems).map(i => categories[i])
    : categories;
    
  const displayedSeries = shouldLimitItems 
    ? series.map(s => ({
        ...s,
        data: getTopIndices(series, categories, maxDisplayedItems).map(i => s.data[i])
      }))
    : series;

  // Normalize data if useLogScale is enabled to make all bars visible
  const normalizeData = (data: number[]): number[] => {
    if (!useLogScale || data.length === 0) return data;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data.filter(v => v > 0)); // Get smallest non-zero value
    if (maxValue === 0) return data;
    
    // Use a more balanced approach that maintains better visual proportions
    // Scale based on the ratio of values while ensuring minimum visibility
    return data.map(value => {
      if (value === 0) return 0;
      
      // Calculate the ratio relative to the maximum value
      const ratio = value / maxValue;
      
      // Use a power function to compress the range while maintaining proportions
      // This will make smaller values more visible while keeping larger values dominant
      const compressedRatio = Math.pow(ratio, 0.3); // 0.3 power makes small values more visible
      
      // Scale to chart width with minimum visibility
      const scaledValue = compressedRatio * 300;
      
      // Ensure minimum visibility but maintain relative differences
      return Math.max(scaledValue, 3);
    });
  };

  const normalizedSeries = useLogScale 
    ? displayedSeries.map(s => ({
        ...s,
        data: normalizeData(s.data)
      }))
    : displayedSeries;

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: borderRadius,
        borderRadiusApplication: 'end',
        horizontal: horizontal,
        barHeight: barHeight,
        distributed: false,
        dataLabels: {
          position: 'center'
        },
        rangeBarOverlap: false,
        rangeBarGroupRows: false
      }
    },
    legend: {
      show: showLegend,
      position: legendPosition
    },
    dataLabels: {
      enabled: showDataLabels
    },
    tooltip: {
      enabled: true,
      y: {
        title: {
          formatter: function(seriesName: string) {
            return seriesName;
          }
        },
        formatter: function(value: number, { seriesIndex, dataPointIndex, w }: any) {
          try {
            const seriesName = w?.globals?.seriesNames?.[seriesIndex] || `Series ${seriesIndex + 1}`;
            // If using normalized data, show original value in tooltip
            if (useLogScale && displayedSeries[seriesIndex] && dataPointIndex !== undefined) {
              const originalValue = displayedSeries[seriesIndex].data[dataPointIndex] || 0;
              return getDefaultTooltipFormatter(originalValue, seriesName);
            }
            return getDefaultTooltipFormatter(value, seriesName);
          } catch (error) {
            return getDefaultTooltipFormatter(value, `Series ${seriesIndex + 1}`);
          }
        }
      }
    },
    xaxis: {
      categories: displayedCategories,
      labels: {
        formatter: (value: string) => {
          if (chartDataType === 'time') {
            return formatSecondsToHHMMSS(Number(value));
          }
          return value;
        }
      }
    },
    yaxis: {
      title: {
        text: yAxisLabel
      },
      labels: {
        formatter: (value: number) => {
          
          return value.toString();
        }
      }
    },
    colors: colors
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

  

  return (
    <div className={`chart-container ${className}`}>
      {title && <h5 className="mb-3">{title}</h5>}
      <div >
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
        {/* {showViewAllButton && shouldLimitItems && (
          <div className="position-absolute" style={{ top: '10px', right: showFullScreenButton ? '120px' : '10px', zIndex: 10 }}>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowAllDataModal(true)}
            >
              <i className="material-icons-two-tone me-1">list</i>
              {viewAllButtonText}
            </Button>
          </div>
        )} */}
        <ReactApexChart 
          options={chartOptions} 
          series={normalizedSeries} 
          type="bar" 
          height={height} 
        />
      </div>

      {/* Modal for showing all data */}
      <Modal 
        show={showAllDataModal} 
        onHide={() => setShowAllDataModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{title || 'All Data'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '400px' }}>
            <ReactApexChart 
              options={{
                chart: chartOptions.chart,
                plotOptions: chartOptions.plotOptions,
                legend: chartOptions.legend,
                dataLabels: chartOptions.dataLabels,
                tooltip: chartOptions.tooltip,
                xaxis: {
                  categories: categories,
                  labels: {
                    formatter: (value: string) => {
                      if (chartDataType === 'time') {
                        const formatted = formatSecondsToHHMMSS(Number(value));
                        return formatted;
                      }
                      return value;
                    }
                  }
                },
                yaxis: chartOptions.yaxis
              }} 
              series={useLogScale ? series.map(s => ({
                ...s,
                data: normalizeData(s.data)
              })) : series} 
              type="bar" 
              height={350} 
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllDataModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChartBar; 