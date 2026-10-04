import { resolvedChargeHours, resolvedMotorWatt } from "./product";
import type { Product, ProductVariant } from "./types";

const PACK_VOLTS = 48;
const CHARGE_EFFICIENCY = 0.9;
const MOTOR_LOAD = 0.35;
const CITY_SPEED_KMH = 25;
const PETROL_KM_PER_LITRE = 40;
const PETROL_RUPEES_PER_LITRE = 100;
const ELECTRICITY_RUPEES_PER_KWH = 8;

export const DEFAULT_DAILY_KM = 50;

export function petrolSaving(product: Product, variant: ProductVariant, dailyKm: number): [number, number] {
  const km = Math.min(400, Math.max(1, dailyKm));
  const electricPerKm = (whPerKm(product, variant) / 1000) * ELECTRICITY_RUPEES_PER_KWH;
  const petrolPerKm = PETROL_RUPEES_PER_LITRE / PETROL_KM_PER_LITRE;
  const daily = Math.round(Math.max(0, petrolPerKm - electricPerKm) * km);
  return [daily, daily * 30];
}

function whPerKm(product: Product, variant: ProductVariant) {
  const watts = resolvedMotorWatt(product);
  const fromMotor = watts > 0 ? (watts * MOTOR_LOAD) / CITY_SPEED_KMH : 0;
  const fromCharger = chargerWhPerKm(product.chargerAmp, resolvedChargeHours(product), variant.rangeKm, variant.battery);
  if (fromMotor > 0 && fromCharger > 0) return (fromMotor + fromCharger) / 2;
  if (fromCharger > 0) return fromCharger;
  if (fromMotor > 0) return fromMotor;
  return 30;
}

function chargerWhPerKm(amps: number, hours: number, rangeKm: number, battery: string) {
  const fromCharger = amps > 0 && hours > 0 ? amps * PACK_VOLTS * hours * CHARGE_EFFICIENCY : 0;
  const kwh = batteryKwh(battery);
  const fromBattery = kwh ? kwh * 1000 : 0;
  const packWh =
    fromCharger > 0 && fromBattery > 0 ? (fromCharger + fromBattery) / 2 : fromCharger > 0 ? fromCharger : fromBattery;
  if (packWh <= 0 || rangeKm <= 0) return 0;
  return packWh / rangeKm;
}

function batteryKwh(battery: string) {
  if (!/kwh/i.test(battery)) return null;
  const v = parseFloat(battery.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "");
  return v >= 0.4 && v <= 12 ? v : null;
}
