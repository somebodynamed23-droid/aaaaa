
export interface SimParameters {
  boxVolume: number; // m^3
  fanFlowRate: number; // L/min
  captureEfficiency: number; // 0 to 1
  initialPPM: number;
  tempCelsius: number;
}

export interface Telemetry {
  timeElapsed: number; // seconds
  currentPPM: number;
  yieldNa2CO3: number; // milligrams
  co2Captured: number; // milligrams
}

export interface HistoryPoint {
  time: string;
  ppm: number;
  yield: number;
}
