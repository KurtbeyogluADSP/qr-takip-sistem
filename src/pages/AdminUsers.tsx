import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Shield, User } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        name: '',
        role: 'assistant' as 'assistant' | 'physician' | 'admin' | 'staff'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setUsers(data);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.rpc('admin_create_user', {
                new_email: newUser.email,
                new_password: newUser.password,
                new_name: newUser.name,
                new_role: newUser.role
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'User created successfully!' });
            setNewUser({ email: '', password: '', name: '', role: 'assistant' });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                User Management
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-700">Add New User</h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. John Doe"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="john@clinic.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Set temporary password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                >
                                    <option value="assistant">Assistant</option>
                                    <option value="physician">Physician (Hekim)</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff (Personel)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <UserPlus size={20} />}
                                Create User
                            </button>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* User List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-700">Existing Users</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm">
                                    <tr>
                                        <th className="p-4 font-medium">User</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium">Created</th>
                                        <th className="p-4 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'physician' ? 'bg-teal-100 text-teal-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                    {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.is_locked_out ? (
                                                    <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">LOCKED</span>
                                                ) : (
                                                    <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">ACTIVE</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
