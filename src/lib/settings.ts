import { supabase } from './supabase';

export type SystemSettings = {
    work_start_time: string;
    work_end_time: string;
    hourly_wage: string;
    clinic_location_lat: string;
    clinic_location_lng: string;
    [key: string]: string; // Fallback for other keys
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
    const { data, error } = await supabase
        .from('system_settings')
        .select('*');

    if (error) {
        console.error('Error fetching settings:', error);
        return {} as SystemSettings;
    }

    // Convert array of {key, value} to object
    const settings: Partial<SystemSettings> = {};
    data?.forEach((item: { key: string; value: string }) => {
        settings[item.key] = item.value;
    });

    return settings as SystemSettings;
};

export const updateSystemSetting = async (key: string, value: string) => {
    const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value });

    if (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    }
};
