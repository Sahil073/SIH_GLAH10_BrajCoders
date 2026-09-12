import { MetricType, MetricDetailPayload } from "@/types/dashboard";

/**
 * Calculates summary stats (Average, Minimum, Maximum) from a list of numerical values.
 * Useful for runtime calculation when fetching dynamic data from SQLite.
 */
export function calculateStats(values: number[]): { average: number; minimum: number; maximum: number } {
  if (values.length === 0) return { average: 0, minimum: 0, maximum: 0 };
  const sum = values.reduce((acc, v) => acc + v, 0);
  const average = Math.round((sum / values.length) * 10) / 10;
  const minimum = Math.round(Math.min(...values) * 10) / 10;
  const maximum = Math.round(Math.max(...values) * 10) / 10;
  return { average, minimum, maximum };
}

export const metricDetailsData: Record<MetricType, MetricDetailPayload> = {
  heart_rate: {
    id: "heart_rate",
    title: "Heart rate",
    currentValue: 72,
    unit: "BPM",
    statusLabel: "Normal",
    yAxisLabels: [100, 80, 60, 40],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [58, 76, 62, 80, 64, 72, 86, 78, 94],
        average: 78,
        minimum: 63,
        maximum: 102,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [71, 74, 69, 78, 72, 75, 73],
        average: 73,
        minimum: 65,
        maximum: 88,
        selectedIndex: 4,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [72, 75, 71, 74],
        average: 73,
        minimum: 62,
        maximum: 95,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [70, 73, 75, 72],
        average: 72,
        minimum: 60,
        maximum: 105,
        selectedIndex: 2,
      },
    },
  },
  spo2: {
    id: "spo2",
    title: "Blood Oxygen",
    currentValue: 98,
    unit: "%",
    statusLabel: "Optimal",
    yAxisLabels: [100, 98, 96, 94],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [96.5, 97.8, 97.2, 98.5, 97.6, 98.0, 99.2, 98.4, 98.9],
        average: 98.2,
        minimum: 96.5,
        maximum: 99.5,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [98, 98.5, 97.8, 98.2, 98.0, 99.0, 98.4],
        average: 98.3,
        minimum: 97.0,
        maximum: 99.5,
        selectedIndex: 4,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [98.1, 98.4, 98.0, 98.5],
        average: 98.2,
        minimum: 96.8,
        maximum: 99.8,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [98.0, 98.3, 98.5, 98.2],
        average: 98.2,
        minimum: 96.0,
        maximum: 100,
        selectedIndex: 2,
      },
    },
  },
  aqi: {
    id: "aqi",
    title: "Air Quality Index",
    currentValue: 42,
    unit: "AQI",
    statusLabel: "Good",
    yAxisLabels: [80, 60, 40, 20],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [35, 48, 38, 52, 40, 42, 56, 45, 50],
        average: 44,
        minimum: 32,
        maximum: 58,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [40, 45, 38, 48, 42, 44, 41],
        average: 43,
        minimum: 30,
        maximum: 55,
        selectedIndex: 4,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [42, 46, 40, 44],
        average: 43,
        minimum: 28,
        maximum: 62,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [45, 42, 40, 43],
        average: 42,
        minimum: 25,
        maximum: 68,
        selectedIndex: 2,
      },
    },
  },
  temperature: {
    id: "temperature",
    title: "Body Temperature",
    currentValue: "36.6",
    unit: "°C",
    statusLabel: "Normal",
    yAxisLabels: [38, 37, 36, 35],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [36.2, 36.5, 36.4, 36.8, 36.5, 36.6, 36.9, 36.6, 36.7],
        average: 36.6,
        minimum: 36.2,
        maximum: 37.1,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [36.5, 36.6, 36.4, 36.7, 36.6, 36.5, 36.6],
        average: 36.6,
        minimum: 36.1,
        maximum: 37.0,
        selectedIndex: 4,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [36.5, 36.6, 36.5, 36.7],
        average: 36.6,
        minimum: 36.0,
        maximum: 37.2,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [36.5, 36.6, 36.7, 36.5],
        average: 36.6,
        minimum: 35.8,
        maximum: 37.4,
        selectedIndex: 2,
      },
    },
  },
  moisture: {
    id: "moisture",
    title: "Moisture & Humidity",
    currentValue: 48,
    unit: "%",
    statusLabel: "Normal",
    yAxisLabels: [70, 60, 50, 40],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [42, 54, 46, 56, 44, 48, 55, 47, 52],
        average: 49,
        minimum: 42,
        maximum: 56,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [46, 50, 48, 52, 48, 49, 47],
        average: 49,
        minimum: 40,
        maximum: 58,
        selectedIndex: 4,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [48, 51, 47, 50],
        average: 49,
        minimum: 38,
        maximum: 60,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [47, 50, 52, 48],
        average: 49,
        minimum: 35,
        maximum: 65,
        selectedIndex: 2,
      },
    },
  },
  activity: {
    id: "activity",
    title: "Step Activity",
    currentValue: "4,320",
    unit: "Steps",
    statusLabel: "Active",
    yAxisLabels: ["6k", "4k", "2k", "0"],
    timeframes: {
      Hourly: {
        timestamps: ["10:00am", "11:00am", "12:00pm", "13:00pm"],
        values: [1200, 2400, 1800, 3500, 2800, 4320, 5100, 4600, 5800],
        average: 3520,
        minimum: 1200,
        maximum: 5800,
        selectedIndex: 5,
      },
      Daily: {
        timestamps: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [4100, 3800, 5200, 4500, 5600, 4900, 4320],
        average: 4630,
        minimum: 3800,
        maximum: 5600,
        selectedIndex: 6,
      },
      Monthly: {
        timestamps: ["W1", "W2", "W3", "W4"],
        values: [28500, 32400, 30100, 31200],
        average: 30550,
        minimum: 28500,
        maximum: 32400,
        selectedIndex: 3,
      },
      Yearly: {
        timestamps: ["Q1", "Q2", "Q3", "Q4"],
        values: [120000, 135000, 142000, 130000],
        average: 131750,
        minimum: 120000,
        maximum: 142000,
        selectedIndex: 2,
      },
    },
  },
};

/**
 * Helper to retrieve metric detail payload
 */
export function getMetricDetail(type: MetricType): MetricDetailPayload {
  return metricDetailsData[type];
}
