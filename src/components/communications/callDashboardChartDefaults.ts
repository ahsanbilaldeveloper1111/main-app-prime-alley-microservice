/** Initial chart state for Call Dashboard (country / department / extension bar charts). */

import type { ApexOptions } from "apexcharts";

export type CallDashboardApexBarChart = {
  series: NonNullable<ApexOptions["series"]>;
  options: ApexOptions;
};

export function getInitialCountryChart(): CallDashboardApexBarChart {  return {
    series: [
      {
        name: '',
        data: [] as number[],
      },
    ],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end' as const,
          horizontal: true,
          columnHeight: '2px',
        },
      },
      legend: {
        show: true,
        position: 'bottom' as const,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {},
      xaxis: {
        categories: [] as string[],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666',
          },
        },
      },
      yaxis: {
        title: {
          text: '',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#263238',
            marginRight: '10px',
          },
        },
      },
    },
  };
}

export function getInitialDepartmentChart(): CallDashboardApexBarChart {  return {
    series: [{ name: "Call Count", data: [] as number[] }],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end' as const,
          horizontal: true,
          columnHeight: '2px',
        },
      },
      legend: {
        show: true,
        position: 'bottom' as const,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {},
      xaxis: {
        categories: [] as string[],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666',
          },
        },
      },
      yaxis: {
        show: true,
        title: {
          text: 'Call Count',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#263238',
            marginRight: '10px',
          },
        },
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666',
          },
        },
      },
      fill: {
        opacity: 1,
      },
    },
  };
}

export function getInitialExtensionChart(): CallDashboardApexBarChart {  return {
    series: [{ name: "Call Count", data: [] as number[] }],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            show: true,
            position: 'top' as const,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['#fff'],
      },
      tooltip: {
        shared: false,
        intersect: false,
      },
      xaxis: {
        categories: [] as string[],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666',
          },
        },
      },
      yaxis: {
        title: {
          text: '',
        },
      },
      legend: {
        position: 'bottom' as const,
        horizontalAlign: 'center' as const,
        offsetX: 40,
      },
    },
  };
}
