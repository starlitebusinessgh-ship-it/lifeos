import type { Alarm } from "./alarmLogic";

/** Notification id = alarmId * 7 + day (0–6). */
export function alarmNotificationId(alarmId: number, day: number): number {
  return alarmId * 7 + day;
}

export function alarmNotificationIds(alarmId: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => alarmNotificationId(alarmId, d));
}

export function isNativeAlarmApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function getLocalNotifications() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

/** iOS system notifications — fires when LifeOS is installed as the native iPhone app. */
export async function requestSystemAlarmPermission(): Promise<boolean> {
  if (!isNativeAlarmApp()) return false;
  try {
    const LocalNotifications = await getLocalNotifications();
    let perms = await LocalNotifications.checkPermissions();
    if (perms.display !== "granted") {
      perms = await LocalNotifications.requestPermissions();
    }
    if (perms.display !== "granted") return false;

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: "LIFEOS_ALARM",
          actions: [{ id: "dismiss", title: "Stop" }],
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncAlarmsToSystem(alarms: Alarm[]): Promise<void> {
  if (!isNativeAlarmApp()) return;
  try {
    const LocalNotifications = await getLocalNotifications();
    const granted = await requestSystemAlarmPermission();
    if (!granted) return;

    const allIds = alarms.flatMap((a) => alarmNotificationIds(a.id));
    if (allIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: allIds.map((id) => ({ id })),
      });
    }

    const notifications = alarms.flatMap((alarm) => {
      if (!alarm.enabled || alarm.repeat_days.length === 0) return [];
      return alarm.repeat_days.map((day) => ({
        id: alarmNotificationId(alarm.id, day),
        title: alarm.label || "Alarm",
        body: "Time to wake up — open LifeOS",
        sound: "alarm.wav",
        actionTypeId: "LIFEOS_ALARM",
        extra: {
          alarmId: alarm.id,
          hour: alarm.hour,
          minute: alarm.minute,
          label: alarm.label,
        },
        schedule: {
          on: {
            weekday: day + 1,
            hour: alarm.hour,
            minute: alarm.minute,
          },
          repeats: true,
        },
      }));
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    // Native shell not ready yet — web fallback still works.
  }
}

export async function cancelSystemAlarm(alarmId: number): Promise<void> {
  if (!isNativeAlarmApp()) return;
  try {
    const LocalNotifications = await getLocalNotifications();
    await LocalNotifications.cancel({
      notifications: alarmNotificationIds(alarmId).map((id) => ({ id })),
    });
  } catch {
    /* ignore */
  }
}

export function dispatchAlarmRing(alarm: Alarm, at: Date): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("lifeos:alarm", { detail: { alarm, at } })
  );
}
