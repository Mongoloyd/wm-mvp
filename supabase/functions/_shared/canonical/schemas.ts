import {
  WM_ANOMALY_STATUSES,
  WM_DISPATCH_STATUSES,
  WM_EVENT_NAMES,
  WM_IDENTITY_QUALITIES,
  WM_PLATFORM_NAMES,
} from "./constants.ts";
import type { WMAnomalyStatus, WMDispatchStatus, WMEventName, WMIdentityQuality, WMPlatformName } from "./types.ts";

function inSet<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export function isWMEventName(value: string): value is WMEventName {
  return inSet(value, WM_EVENT_NAMES);
}

export function isWMAnomalyStatus(value: string): value is WMAnomalyStatus {
  return inSet(value, WM_ANOMALY_STATUSES);
}

export function isWMDispatchStatus(value: string): value is WMDispatchStatus {
  return inSet(value, WM_DISPATCH_STATUSES);
}

export function isWMPlatformName(value: string): value is WMPlatformName {
  return inSet(value, WM_PLATFORM_NAMES);
}

export function isWMIdentityQuality(value: string): value is WMIdentityQuality {
  return inSet(value, WM_IDENTITY_QUALITIES);
}
