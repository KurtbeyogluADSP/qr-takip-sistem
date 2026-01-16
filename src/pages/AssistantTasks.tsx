import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { format, getISOWeek, startOfWeek, addDays } from 'date-fns';

type Task = {
    id: string;
    title: string;
    task_type: 'sterilization' | 'macro' | 'stock' | 'duty';
    completed_at: string | null;
    week_number: number;
    due_date?: string;
};

const TASK_ROLES = [
    { type: 'sterilization', title: 'Sterilizasyon & Hijyen' },
    { type: 'macro', title: 'Makro Fotoğraf & Medya' },
    { type: 'stock', title: 'Stok & Envanter Kontrolü' },
    { type: 'duty', title: 'Genel Görev & Hasta Bakımı' }
] as const;

export default function AssistantTasks() {
    const { selectedUserId } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekNumber] = useState(getISOWeek(new Date()));
    const [assignedRole, setAssignedRole] = useState<typeof TASK_ROLES[number] | null>(null);

    useEffect(() => {
        if (selectedUserId) {
            determineRoleAndFetchTasks();
        }
    }, [selectedUserId, weekNumber]);

    const determineRoleAndFetchTasks = async () => {
        setLoading(true);
        try {
            if (selectedUserId) {
                const userHash = selectedUserId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const roleIndex = (weekNumber + userHash) % TASK_ROLES.length;
                const role = TASK_ROLES[roleIndex];
                setAssignedRole(role);

                await fetchAndEnsureTasks(role);
            }
        } catch (err) {
            console.error('Error in task flow:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAndEnsureTasks = async (role: typeof TASK_ROLES[number]) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', selectedUserId)
            .eq('week_number', weekNumber)
            .order('due_date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            setTasks(data);
        } else {
            await generateDailyTasksForRole(role);
        }
    };

    const generateDailyTasksForRole = async (role: typeof TASK_ROLES[number]) => {
        if (!selectedUserId) return;

        const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        const tasksToInsert = [];

        for (let i = 0; i < 6; i++) {
            const date = addDays(startOfCurrentWeek, i);
            tasksToInsert.push({
                user_id: selectedUserId,
                week_number: weekNumber,
                task_type: role.type,
                title: `${role.title} - ${format(date, 'EEEE')}`,
                completed_at: null,
            });
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert(tasksToInsert)
            .select();

        if (error) {
            console.error('Error creating tasks:', error);
        } else if (data) {
            setTasks(data as any);
        }
    };

    const toggleTask = async (task: Task) => {
        const isCompleted = !!task.completed_at;
        const newStatus = isCompleted ? null : new Date().toISOString();

        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, completed_at: newStatus } : t
        ));

        const { error } = await supabase
            .from('tasks')
            .update({ completed_at: newStatus })
            .eq('id', task.id);

        if (error) {
            console.error('Error updating task:', error);
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, completed_at: task.completed_at } : t
            ));
        }
    };

    const completedCount = tasks.filter(t => t.completed_at).length;
    const totalTasks = tasks.length || 6;
    const progress = (completedCount / totalTasks) * 100;

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto pb-20">
            <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Haftalık Görev</h2>
                        <p className="text-sm text-gray-500">Hafta {weekNumber}</p>
                    </div>
                    {assignedRole && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase">
                            {assignedRole.type}
                        </span>
                    )}
                </div>

                {assignedRole && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <div className="flex items-center gap-2 opacity-80 mb-1 text-xs uppercase tracking-wide font-semibold">
                            <CalendarDays size={14} />
                            Rolünüz
                        </div>
                        <h3 className="text-2xl font-bold">{assignedRole.title}</h3>
                        <p className="opacity-90 text-sm mt-1">Haftalık bonus için günlük kontrol listesini tamamlayın.</p>
                    </div>
                )}
            </header>

            <div className="space-y-3">
                {tasks.map((task) => {
                    const isCompleted = !!task.completed_at;
                    return (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task)}
                            className={clsx(
                                "flex items-center p-4 rounded-xl border transition-all cursor-pointer select-none group",
                                isCompleted
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-white border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md"
                            )}
                        >
                            <div className={clsx(
                                "mr-4 transition-colors p-1 rounded-full",
                                isCompleted ? "text-blue-600 bg-blue-100" : "text-gray-300 group-hover:text-blue-400 group-hover:bg-blue-50"
                            )}>
                                {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </div>

                            <div className="flex-1">
                                <h3 className={clsx(
                                    "font-medium transition-all",
                                    isCompleted ? "text-blue-900 line-through opacity-70" : "text-gray-800"
                                )}>
                                    {task.title.split(' - ')[1] || task.title}
                                </h3>
                                <p className="text-xs text-gray-400 capitalize flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {task.title.split(' - ')[0]}
                                </p>
                            </div>

                            {isCompleted && task.completed_at && (
                                <div className="text-xs text-blue-400 font-mono flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-blue-100">
                                    <Clock size={12} />
                                    {format(new Date(task.completed_at), 'HH:mm')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-amber-100">
                    <div className="flex justify-between font-semibold mb-2 text-sm text-gray-700">
                        <span>Haftalık İlerleme</span>
                        <span className="text-blue-600 font-mono">{completedCount}/{totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div
                            className={clsx(
                                "h-full rounded-full transition-all duration-700 ease-out",
                                completedCount === totalTasks ? "bg-green-500" : "bg-gradient-to-r from-amber-400 to-orange-500"
                            )}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    {completedCount === totalTasks ? (
                        <div className="mt-3 text-center animate-bounce-short">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                🎉 Bonus Açıldı! (+1000 TRY)
                            </span>
                        </div>
                    ) : (
                        <p className="text-center text-xs text-gray-400 mt-2">
                            Bonus için {totalTasks} günü tamamlayın
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
