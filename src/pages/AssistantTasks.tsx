import { useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import clsx from 'clsx';

type Task = {
    id: string;
    title: string;
    type: 'sterilization' | 'macro' | 'stock' | 'duty';
    completed: boolean;
    time?: string;
};

// Mock Data
const MOCK_TASKS: Task[] = [
    { id: '1', title: 'Sterilization Room Check', type: 'sterilization', completed: true, time: '09:30 AM' },
    { id: '2', title: 'Macro Photography Setup', type: 'macro', completed: false },
    { id: '3', title: 'Stock Inventory Update', type: 'stock', completed: false },
    { id: '4', title: 'General Duty Round', type: 'duty', completed: false },
];

export default function AssistantTasks() {
    const [tasks, setTasks] = useState(MOCK_TASKS);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, completed: !t.completed, time: !t.completed ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined } : t
        ));
    };

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Weekly Tasks</h2>

            <div className="space-y-3">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={clsx(
                            "flex items-center p-4 rounded-xl border transition-all cursor-pointer select-none",
                            task.completed
                                ? "bg-blue-50 border-blue-200"
                                : "bg-white border-gray-100 shadow-sm hover:border-blue-300"
                        )}
                    >
                        <div className={clsx(
                            "mr-4 transition-colors",
                            task.completed ? "text-blue-600" : "text-gray-300"
                        )}>
                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </div>

                        <div className="flex-1">
                            <h3 className={clsx(
                                "font-medium",
                                task.completed ? "text-blue-900 line-through opacity-70" : "text-gray-800"
                            )}>
                                {task.title}
                            </h3>
                            <p className="text-xs text-gray-400 capitalize">{task.type}</p>
                        </div>

                        {task.completed && task.time && (
                            <div className="text-xs text-blue-400 font-mono flex items-center gap-1">
                                <Clock size={12} />
                                {task.time}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-lg text-amber-800 text-sm border border-amber-100">
                <p className="font-semibold mb-1">Weekly Bonus Progress: 1/4</p>
                <div className="w-full bg-amber-200 h-2 rounded-full mt-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
            </div>
        </div>
    );
}
