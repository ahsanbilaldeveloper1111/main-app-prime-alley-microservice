/** Initial / cleared Apex bar chart state for call recordings direction chart. */
export function getEmptyCallRecordingsDirectionChartState(): {
    series: Array<{ name: string; data: number[] }>;
    options: {
        chart: { type: 'bar'; height: number; toolbar: { show: boolean } };
        plotOptions: {
            bar: {
                horizontal: boolean;
                columnWidth: string;
                borderRadius: number;
                borderRadiusApplication: 'end';
            };
        };
        dataLabels: { enabled: boolean };
        stroke: { show: boolean; width: number; colors: string[] };
        xaxis: { categories: string[] };
        yaxis: { title: { text: string } };
        fill: { opacity: number };
        tooltip: { y: { formatter: (val: number) => string } };
    };
} {
    return {
        series: [],
        options: {
            chart: {
                type: 'bar',
                height: 200,
                toolbar: {
                    show: false,
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 5,
                    borderRadiusApplication: 'end',
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent'],
            },
            xaxis: {
                categories: [],
            },
            yaxis: {
                title: {
                    text: 'Calls',
                },
            },
            fill: {
                opacity: 1,
            },
            tooltip: {
                y: {
                    formatter: (val: number) => `${val} calls`,
                },
            },
        },
    };
}
