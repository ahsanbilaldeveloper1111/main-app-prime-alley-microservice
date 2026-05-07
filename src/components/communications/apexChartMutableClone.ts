/**
 * ApexCharts mutates options/series at runtime. Redux state is frozen (Immer),
 * so always pass a deep clone into react-apexcharts.
 */
export function cloneForApexCharts<T>(value: T): T {
  return structuredClone(value);
}
