import { useEffect, useState, useRef } from 'react';
import { CheckSquare, User, Building, Home, Eye, Calendar, Clock } from 'lucide-react';
import { $api } from '@/services';
import DashboardWidget from '@/components/widgets/DashboardWidget';
import EnhancedTaskDetailsModal from '@/components/modal/enhancedTaskDetailsModal';

interface TaskWidgetProps {
    task_id: string;
    className?: string;
    onTaskUpdated?: () => void;
    compact?: boolean;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_at: string;
    notify_at?: string;
    notify_time?: string;
    created_at: string;
    updated_at: string;
    involve: 'tenant' | 'unit' | 'property' | 'landlord' | 'none';
    assignee?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar?: string;
    };
    subtasks?: Array<{
        id: string;
        title: string;
        description?: string;
        status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
        assignee?: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
        };
        due_at?: string;
        created_at: string;
        updated_at: string;
    }>;
    taskable?: {
        id: string;
        user_id?: string;
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        label?: string;
        address?: string;
        property?: {
            label: string;
        };
        name?: string;
    };
}

const TaskWidget = ({ task_id, className = '', onTaskUpdated }: TaskWidgetProps) => {
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
    const taskDetailsModalRef = useRef<HTMLDivElement>(null);

    // Fetch task details
    const fetchTaskDetails = async () => {
        if (!task_id) return;

        try {
            setIsLoading(true);
            const response = await $api.fetch(`/api/mgt/v1/tasks/new/${task_id}`);
            
            if ($api.isSuccessful(response)) {
                setTask(response?.data);
            } else {
                console.error('Failed to fetch task details');
            }
        } catch (error) {
            console.error('Error fetching task details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [task_id]);

    const handleMarkCompleted = async () => {
        if (!task_id) return;

        try {
            setIsActionLoading(true);
            const response = await $api.post(`/api/mgt/v1/tasks/${task_id}/complete`, '');

            if ($api.isSuccessful(response)) {
                // Refresh task details
                await fetchTaskDetails();
                // Call callback if provided
                onTaskUpdated?.();
            } else {
                console.error('Failed to mark task as completed');
            }
        } catch (error) {
            console.error('Error marking task as completed:', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleMarkAsDone = async () => {
        // Same as mark completed
        await handleMarkCompleted();
    };

    const handleViewTask = () => {
        setShowTaskDetailsModal(true);
    };

    const handleTaskUpdated = () => {
        // Refresh task details when task is updated in modal
        fetchTaskDetails();
        onTaskUpdated?.();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string | undefined) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getInvolveIcon = (involve: string) => {
        switch (involve) {
            case 'tenant':
                return <User size={12} className="text-blue-600" />;
            case 'landlord':
                return <User size={12} className="text-purple-600" />;
            case 'property':
                return <Building size={12} className="text-green-600" />;
            case 'unit':
                return <Home size={12} className="text-orange-600" />;
            default:
                return <CheckSquare size={12} className="text-gray-600" />;
        }
    };

    const getInvolveLabel = (involve: string) => {
        switch (involve) {
            case 'tenant':
                return 'Tenant';
            case 'landlord':
                return 'Landlord';
            case 'property':
                return 'Property';
            case 'unit':
                return 'Unit';
            case 'none':
                return 'General';
            default:
                return involve;
        }
    };

    const getSubtaskSummary = (subtasks: any[] | undefined) => {
        if (!subtasks || subtasks.length === 0) {
            return { total: 0, completed: 0, pending: 0, inProgress: 0, cancelled: 0 };
        }

        const summary = subtasks.reduce((acc, subtask) => {
            acc.total++;
            switch (subtask.status) {
                case 'completed':
                    acc.completed++;
                    break;
                case 'ongoing':
                case 'in_progress':
                    acc.inProgress++;
                    break;
                case 'cancelled':
                    acc.cancelled++;
                    break;
                default:
                    acc.pending++;
            }
            return acc;
        }, { total: 0, completed: 0, pending: 0, inProgress: 0, cancelled: 0 });

        return summary;
    };

    const getSubtaskSummaryText = (subtasks: any[] | undefined) => {
        const summary = getSubtaskSummary(subtasks);
        if (summary.total === 0) return 'No subtasks';
        
        const completed = summary.completed;
        const total = summary.total;
        const percentage = Math.round((completed / total) * 100);
        
        return `${completed}/${total} completed (${percentage}%)`;
    };

    return (
        <>
            <DashboardWidget className={className} title="Task Details">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : task ? (
                    <div className="space-y-4">
                        {/* Task Title and Status */}
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 flex-1">
                                    {task.title || 'Untitled Task'}
                                </h4>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            {task.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {task.description}
                                </p>
                            )}
                        </div>

                        {/* Task Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {/* Priority */}
                            <div>
                                <span className="text-gray-500">Priority:</span>
                                <div className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority || 'medium')}`}>
                                        {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                                    </span>
                                </div>
                            </div>

                            {/* Involves */}
                            <div>
                                <span className="text-gray-500">Involves:</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {getInvolveIcon(task.involve)}
                                    <span className="text-gray-900">{getInvolveLabel(task.involve)}</span>
                                </div>
                                {task.taskable && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {task.taskable.first_name} {task.taskable.last_name}
                                    </div>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <span className="text-gray-500">Due Date:</span>
                                <div className={`flex items-center gap-1.5 mt-1 ${task.due_at && new Date(task.due_at) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-900'}`}>
                                    <Calendar size={14} />
                                    <span className="text-sm">
                                        {task.due_at ? new Date(task.due_at).toLocaleDateString() : 'No due date'}
                                    </span>
                                </div>
                                {task.notify_time && (
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <Clock size={12} />
                                        {task.notify_time}
                                    </div>
                                )}
                            </div>

                            {/* Assignee */}
                            <div>
                                <span className="text-gray-500">Assigned To:</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <User size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                        {task.assignee 
                                            ? `${task.assignee.first_name} ${task.assignee.last_name}`
                                            : 'Unassigned'
                                        }
                                    </span>
                                </div>
                                {task.assignee?.email && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {task.assignee.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subtasks Summary */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Subtasks:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {getSubtaskSummaryText(task.subtasks)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                            <button
                                onClick={handleViewTask}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Eye size={16} />
                                View Full Details
                            </button>
                            
                            {task.status === 'in_progress' && (
                                <button
                                    onClick={handleMarkCompleted}
                                    disabled={isActionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckSquare size={16} />
                                    {isActionLoading ? 'Processing...' : 'Mark as Completed'}
                                </button>
                            )}
                            
                            {task.status !== 'completed' && task.status !== 'cancelled' && task.status !== 'in_progress' && (
                                <button
                                    onClick={handleMarkAsDone}
                                    disabled={isActionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckSquare size={16} />
                                    {isActionLoading ? 'Processing...' : 'Mark as Done'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CheckSquare size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Task not found</p>
                    </div>
                )}
            </DashboardWidget>

            {/* Enhanced Task Details Modal */}
            {showTaskDetailsModal && task && (
                <EnhancedTaskDetailsModal
                    isActive={showTaskDetailsModal}
                    setIsActive={setShowTaskDetailsModal}
                    reference={taskDetailsModalRef}
                    id={task.id}
                    onTaskUpdated={handleTaskUpdated}
                />
            )}
        </>
    );
};

export default TaskWidget;
