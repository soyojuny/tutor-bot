import { create } from 'zustand';
import { Activity, CreateActivityInput, UpdateActivityInput } from '@/types';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  fetchActivities: () => Promise<void>;
  createActivity: (input: CreateActivityInput, createdBy: string) => Promise<Activity | null>;
  updateActivity: (id: string, input: UpdateActivityInput) => Promise<Activity | null>;
  deleteActivity: (id: string) => Promise<boolean>;
  getActivityById: (id: string) => Activity | undefined;
  getActivitiesByStatus: (status: Activity['status']) => Activity[];
  getActivitiesByAssignedTo: (profileId: string) => Activity[];
  startActivity: (id: string) => Promise<Activity | null>;
  completeActivity: (id: string) => Promise<Activity | null>;
  verifyActivity: (id: string, verifiedBy: string) => Promise<Activity | null>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error('활동 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      set({ activities: data.activities || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching activities:', error);
    }
  },

  createActivity: async (input: CreateActivityInput, createdBy: string) => {
    set({ error: null });
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          created_by: createdBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '활동 생성에 실패했습니다.');
      }

      const data = await response.json();
      const newActivity = data.activity;
      
      set((state) => ({
        activities: [...state.activities, newActivity],
      }));

      return newActivity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '활동 생성 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error creating activity:', error);
      return null;
    }
  },

  updateActivity: async (id: string, input: UpdateActivityInput) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '활동 업데이트에 실패했습니다.');
      }

      const data = await response.json();
      const updatedActivity = data.activity;
      
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === id ? updatedActivity : activity
        ),
      }));

      return updatedActivity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '활동 업데이트 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error updating activity:', error);
      return null;
    }
  },

  deleteActivity: async (id: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '활동 삭제에 실패했습니다.');
      }

      set((state) => ({
        activities: state.activities.filter((activity) => activity.id !== id),
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '활동 삭제 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error deleting activity:', error);
      return false;
    }
  },

  getActivityById: (id: string) => {
    return get().activities.find((activity) => activity.id === id);
  },

  getActivitiesByStatus: (status: Activity['status']) => {
    return get().activities.filter((activity) => activity.status === status);
  },

  getActivitiesByAssignedTo: (profileId: string) => {
    return get().activities.filter((activity) => activity.assigned_to === profileId);
  },

  startActivity: async (id: string) => {
    return get().updateActivity(id, { status: 'in_progress' });
  },

  completeActivity: async (id: string) => {
    return get().updateActivity(id, { status: 'completed' });
  },

  verifyActivity: async (id: string, verifiedBy: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/activities/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified_by: verifiedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '활동 검증에 실패했습니다.');
      }

      const data = await response.json();
      const verifiedActivity = data.activity;

      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === id ? verifiedActivity : activity
        ),
      }));

      return verifiedActivity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '활동 검증 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error verifying activity:', error);
      return null;
    }
  },
}));
