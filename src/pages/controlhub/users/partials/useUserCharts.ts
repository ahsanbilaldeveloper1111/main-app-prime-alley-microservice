import { useState, useEffect } from 'react';

// Function to generate realistic login heatmap data
const generateLoginHeatmapData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = 24;
    
    return days.map(day => {
        const data = [];
        for (let hour = 0; hour < hours; hour++) {
            let loginCount = 0;
            
            // Business hours (8 AM - 6 PM) have higher activity
            if (hour >= 8 && hour <= 18) {
                // Weekdays have higher activity than weekends
                if (day === 'Saturday' || day === 'Sunday') {
                    loginCount = Math.floor(Math.random() * 20) + 5; // 5-25 logins
                } else {
                    loginCount = Math.floor(Math.random() * 40) + 20; // 20-60 logins
                }
                // Peak hours (9-11 AM and 2-4 PM) have even higher activity
                if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
                    loginCount += Math.floor(Math.random() * 20) + 10; // Additional 10-30 logins
                }
            } else if (hour >= 6 && hour <= 7) {
                // Early morning (6-7 AM) - some early birds
                loginCount = Math.floor(Math.random() * 15) + 5;
            } else if (hour >= 19 && hour <= 22) {
                // Evening (7-10 PM) - some late workers
                loginCount = Math.floor(Math.random() * 10) + 2;
            } else {
                // Late night (11 PM - 5 AM) - minimal activity
                loginCount = Math.floor(Math.random() * 5);
            }
            
            data.push(loginCount);
        }
        
        return {
            name: day,
            data: data
        };
    });
};

export const useUserCharts = () => {
    const [growthChart, setGrowthChart] = useState<{
        series: Array<{ name: string; data: number[] }>;
        options: any;
    }>({
        series: [{
            name: 'Sales',
            data: [10, 15, 20, 25, 30, 35]
        },
        {
            name: 'Support',
            data: [5, 8, 12, 18, 22, 25]
        },
        {
            name: 'IT',
            data: [2, 3, 8, 15, 15, 18]
        }],
        options: {
            colors: ['#FFB800', '#00E396', '#008FFB'],
            chart: {
                height: 250,
                type: 'line',
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            grid: {
                show: true,
                borderColor: '#f1f1f1',
                strokeDashArray: 0,
                position: 'back'
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'center',
                offsetY: 8,
                itemMargin: {
                    horizontal: 16
                },
                markers: {
                    width: 16,
                    height: 16,
                    radius: 2,
                    offsetX: 0
                },
                onItemClick: {
                    toggleDataSeries: true
                },
                onItemHover: {
                    highlightDataSeries: true
                }
            },
            xaxis: {
                type: 'category',
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
            },
            yaxis: {
                show: true,
                title: {
                    text: 'Users'
                }
            },
            tooltip: {
                x: {}
            },
        },
    });

    const [departmentChart, setDepartmentChart] = useState<{
        series: number[];
        options: any;
    }>({
        series: [44, 55, 41, 17, 15],
        options: {
            chart: {
                type: 'donut',
                toolbar: {
                    show: false
                }
            },
            labels: ['Sales', 'Marketing', 'Development', 'HR', 'Finance'],
            legend: {
                position: 'bottom',
                markers: {
                    shape: 'rect',
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '40%'
                    }
                }
            },
            dataLabels: {
                enabled: false,
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        },
    });

    const [userActivityChart, setUserActivityChart] = useState<{
        series: {name: string, data: number[], color?: string}[];
        options: any;
    }>({
        series: [
            {
                name: 'New Users',
                data: [5, 9, 10, 7, 10, 6],
                color: '#28a745'
            },
            {
                name: 'Deactivated Users',
                data: [2, 4, 3, 5, 6, 3],
                color: '#dc3545'
            }
        ],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                },
                fontFamily: 'inherit',
                background: 'transparent',
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 0
                },
            },
            dataLabels: {
                enabled: false,
                formatter: function (val: number) {
                    return val.toString();
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            grid: {
                borderColor: '#f1f1f1',
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: false
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            xaxis: {
                categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                title: {
                    text: ''
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                title: {
                    text: 'Number of Users',
                    fontWeight: 'normal'
                }
            },
            tooltip: {
                y: {
                    formatter: function(val: number) {
                        return val + " users"
                    }
                }
            },
            legend: {
                position: 'bottom'
            }
        },
    });

    const [FailedLoginAttemptsChart, setFailedLoginAttemptsChart] = useState<{
        series: {name: string, data: number[], color?: string}[];
        options: any;
    }>({
        series: [
            {
                name: 'Successful Login',
                data: [30, 25, 35, 28, 32, 27, 29],
                color: '#28a745'
            },
            {
                name: 'Failed Login',
                data: [15, 18, 12, 14, 16, 13, 15],
                color: '#dc3545'
            }
        ],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                stacked: true,
                toolbar: {
                    show: false
                },
                fontFamily: 'inherit',
                background: 'transparent',
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 0,
                    borderRadiusApplication: 'end'
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val: number) {
                    return val.toString();
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                title: {
                    text: ''
                }
            },
            yaxis: {
                title: {
                    text: 'Number of Login',
                    fontWeight: 'normal'
                }
            },
            tooltip: {
                y: {
                    formatter: function(val: number) {
                        return val + " users"
                    }
                }
            },
            legend: {
                position: 'bottom'
            }
        },
    });

    const [departmentGrowthChart, setDepartmentGrowthChart] = useState<{
        series: {name: string, data: number[]}[];
        options: any;
    }>({
        series: [{
            name: 'Sales',
            data: [44, 55, 41, 17, 15, 34]
        },
        {
            name: 'Role',
            data: [17, 15, 41, 55, 44, 34]
        }],
        options: {
            chart: {
                type: 'area',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
            },
            tooltip: {
                x: {
                    format: 'dd/MM/yy HH:mm'
                },
            },
        },
    });

    const [userLocationChart, setUserLocationChart] = useState<{
        series: {name: string, data: number[]}[];
        options: any;
    }>({
        series: [
            {
                name: 'Active Users',
                data: [120, 80, 60, 45, 30],
            }
        ],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                },
                fontFamily: 'inherit',
                background: 'transparent'
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    columnWidth: '55%',
                    borderRadius: 0,
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: false,
                formatter: function (val: number) {
                    return val.toString();
                },
                offsetX: 30,
                style: {
                    fontWeight: 'normal'
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
                title: {
                    text: 'Number of Users',
                    fontWeight: 'normal'
                }
            },
            yaxis: {
                title: {
                    text: '',
                    fontWeight: 'normal'
                }
            },
            grid: {
                borderColor: '#f1f1f1',
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: true
                    }
                },
                yaxis: {
                    lines: {
                        show: false
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(val: number) {
                        return val + " users"
                    }
                }
            },
            legend: {
                show: true,
                position: 'bottom'
            }
        }
    });

    const [loginHeatMapChart, setLoginHeatMapChart] = useState<{
        series: {name: string, data: number[]}[];
        options: any;
    }>({
        series: [
            {
                name: 'Monday',
                data: [2, 1, 0, 0, 0, 0, 3, 15, 25, 30, 28, 22, 18, 20, 25, 30, 35, 40, 38, 32, 28, 20, 15, 8]
            },
            {
                name: 'Tuesday',
                data: [1, 0, 0, 0, 0, 0, 5, 18, 28, 35, 32, 25, 20, 22, 28, 35, 42, 45, 40, 35, 30, 22, 18, 10]
            },
            {
                name: 'Wednesday',
                data: [2, 1, 0, 0, 0, 0, 4, 16, 26, 32, 30, 24, 19, 21, 26, 32, 38, 42, 38, 33, 28, 21, 16, 9]
            },
            {
                name: 'Thursday',
                data: [1, 0, 0, 0, 0, 0, 3, 14, 24, 30, 28, 22, 18, 20, 25, 30, 36, 40, 36, 31, 26, 19, 14, 7]
            },
            {
                name: 'Friday',
                data: [3, 2, 1, 0, 0, 0, 6, 20, 30, 38, 35, 28, 22, 25, 30, 38, 45, 50, 45, 38, 32, 25, 20, 12]
            },
            {
                name: 'Saturday',
                data: [8, 5, 3, 2, 1, 0, 2, 8, 15, 20, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 0]
            },
            {
                name: 'Sunday',
                data: [6, 4, 2, 1, 0, 0, 1, 5, 10, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0]
            }
        ],
        options: {
            chart: {
                type: 'heatmap',
                height: 350,
                toolbar: {
                    show: false
                },
                fontFamily: 'inherit',
                background: 'transparent',
                events: {
                    dataPointSelection: (event: any, chartContext: any, config: any) => {
                        // This will be handled by parent component
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                position: 'bottom'
            },
            colors: ['#008FFB'],
            xaxis: {
                type: 'category',
                categories: [
                    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
                    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
                    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
                    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
                ],
                labels: {
                    style: {
                        fontSize: '10px'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 0,
                    enableShades: false,
                    colorScale: {
                        ranges: [
                            {
                                from: 0,
                                to: 0,
                                color: '#E8F4FD',
                                name: 'No Activity'
                            },
                            {
                                from: 1,
                                to: 5,
                                color: '#B3D9F2',
                                name: 'Low Activity'
                            },
                            {
                                from: 6,
                                to: 15,
                                color: '#66A3D9',
                                name: 'Medium Activity'
                            },
                            {
                                from: 16,
                                to: 30,
                                color: '#1A75D2',
                                name: 'High Activity'
                            },
                            {
                                from: 31,
                                to: 100,
                                color: '#004C99',
                                name: 'Very High Activity'
                            }
                        ]
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(val: number) {
                        return val + ' logins';
                    }
                }
            },
        }
    });

    // Update login heatmap data when component mounts
    useEffect(() => {
        const heatmapData = generateLoginHeatmapData();
        setLoginHeatMapChart(prev => ({
            ...prev,
            series: heatmapData
        }));
    }, []);

    return {
        growthChart,
        departmentChart,
        userActivityChart,
        FailedLoginAttemptsChart,
        departmentGrowthChart,
        userLocationChart,
        loginHeatMapChart,
        setLoginHeatMapChart
    };
};

