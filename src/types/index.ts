export type Profile = {
    id: string;
    email?: string;
    full_name?: string;
    name?: string;
    role: 'admin' | 'assistant' | 'physician' | 'staff';
    is_locked_out?: boolean;
    created_at: string;
};

export type Attendance = {
    id: string;
    user_id: string;
    type: 'check_in' | 'check_out';
    timestamp: string;
    device_id: string;
    qr_token: string;
    status: 'approved' | 'flagged' | 'rejected';
    created_at: string;
};

export type Task = {
    id: string;
    user_id: string;
    week_starting: string;
    task_type: 'sterilization' | 'macro' | 'stock' | 'duty';
    completed_at: string | null;
    is_verified: boolean;
    admin_approved: boolean;
};

export type QRCodeToken = {
    id: string;
    token: string;
    type: 'kiosk_daily' | 'admin_reentry' | 're_entry';
    expires_at: string;
    assigned_user_id?: string;
    used_at?: string;
};
