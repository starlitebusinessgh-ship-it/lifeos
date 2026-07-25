export interface DayTask {
  id: number;
  day_date: string;
  title: string;
  hour: number | null;
  minute: number | null;
  duration_mins: number;
  completed: boolean;
  is_focus: boolean;
  sort_order: number;
  created_at: string;
}

export interface DayTaskDraft {
  id?: number;
  day_date: string;
  title: string;
  hour: number | null;
  minute: number | null;
  duration_mins: number;
  completed: boolean;
  is_focus: boolean;
}
