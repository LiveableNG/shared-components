import { useEffect, useState } from 'react';
import { 
    CheckSquare, 
    User, 
    Building, 
    Home, 
    Eye, 
    Calendar, 
    Clock, 
    X, 
    AlertCircle, 
    CheckCircle,
    Paperclip,
    Bell
} from 'lucide-react';
import { $api } from '@/services';

interface TaskWidgetProps {
    task_id: string;
    className?: string;
    onTaskUpdated?: () => void;
    /** API base path - defaults to '/api'. Use 'api' for apps without leading slash */
    apiBasePath?: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'ongoing';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_at: string;
    reminder_at?: string;
    notify_at?: string;
    notify_time?: string;
    created_at: string;
    updated_at: string;
    type?: string;
    involve: 'tenant' | 'unit' | 'property' | 'landlord' | 'none';
    assignee?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar?: string;
    };
    collaborators?: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar?: string;
        role?: 'watcher' | 'contributor';
    }>;
    reporter?: {
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
        assignee_id?: string;
        due_at?: string;
        due_date?: string;
        created_at: string;
        updated_at: string;
    }>;
    comments?: Array<{
        id: string;
        content: string;
        author: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
            avatar?: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    attachments?: Array<{
        id: string;
        name: string;
        url: string;
        type: string;
        size: number;
        uploaded_by: {
            id: string;
            first_name: string;
            last_name: string;
        };
        uploaded_at: string;
    }>;
    history?: Array<{
        id: string;
        action: string;
        description: string;
        user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
        };
        created_at: string;
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

const TaskWidget = ({ task_id, className = '', onTaskUpdated, apiBasePath = '/api' }: TaskWidgetProps) => {
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    // Fetch task details
    const fetchTaskDetails = async () => {
        if (!task_id) return;

        try {
            setIsLoading(true);
            const response = await $api.fetch(`${apiBasePath}/mgt/v1/tasks/new/${task_id}`);
            
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
            const response = await $api.post(`${apiBasePath}/mgt/v1/tasks/${task_id}/complete`, '');

            if ($api.isSuccessful(response)) {
                await fetchTaskDetails();
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

    const handleChangeStatus = async (newStatus: string) => {
        if (!task_id) return;

        try {
            setIsChangingStatus(true);
            const response = await $api.post(`${apiBasePath}/mgt/v1/tasks/${task_id}/status`, {
                status: newStatus,
            });

            if ($api.isSuccessful(response)) {
                await fetchTaskDetails();
                onTaskUpdated?.();
            } else {
                console.error('Failed to change task status');
            }
        } catch (error) {
            console.error('Error changing task status:', error);
        } finally {
            setIsChangingStatus(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !task_id) return;

        try {
            setIsAddingComment(true);
            const response = await $api.post(`${apiBasePath}/mgt/v1/tasks/${task_id}/comments`, {
                content: newComment,
            });

            if ($api.isSuccessful(response)) {
                setNewComment('');
                await fetchTaskDetails();
                onTaskUpdated?.();
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleViewTask = () => {
        setShowDetailsModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
            case 'ongoing':
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'in_progress':
            case 'ongoing':
                return <Clock size={16} className="text-blue-600" />;
            case 'pending':
                return <AlertCircle size={16} className="text-yellow-600" />;
            case 'cancelled':
                return <X size={16} className="text-red-600" />;
            default:
                return <AlertCircle size={16} className="text-gray-600" />;
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

    const isTaskInFinalState = () => {
        return task?.status === 'cancelled' || task?.status === 'completed';
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
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
    );

    // Task Details Modal (self-contained)
    const TaskDetailsModal = () => {
        if (!showDetailsModal || !task) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden m-4">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
                            {task.title || 'Untitled Task'}
                        </h2>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                        {/* Status and Priority */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Status:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Priority:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                                    {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                                </span>
                            </div>
                        </div>

                        {/* Task Details */}
                        <div className="space-y-4 mb-6">
                            {/* Assignee */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-gray-600" />
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Assigned to: </span>
                                    <span className="font-medium text-gray-900">
                                        {task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-gray-500" />
                                <span className={`${task.due_at && new Date(task.due_at) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-900'}`}>
                                    Due: {task.due_at ? new Date(task.due_at).toLocaleDateString() : 'No due date'}
                                </span>
                            </div>

                            {/* Reminder */}
                            {task.reminder_at && (
                                <div className="flex items-center gap-3">
                                    <Bell size={16} className="text-amber-500" />
                                    <span className="text-gray-900">
                                        Reminder: {new Date(task.reminder_at).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* Involves */}
                            <div className="flex items-center gap-3">
                                {getInvolveIcon(task.involve)}
                                <span className="text-gray-900">
                                    Involves: {getInvolveLabel(task.involve)}
                                    {task.taskable && ` - ${task.taskable.first_name} ${task.taskable.last_name}`}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">
                                    {task.description || 'No description provided'}
                                </p>
                            </div>
                        </div>

                        {/* Subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Subtasks ({getSubtaskSummaryText(task.subtasks)})
                                </h3>
                                <div className="space-y-2">
                                    {task.subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                            {getStatusIcon(subtask.status)}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">{subtask.title}</div>
                                                {subtask.assignee && (
                                                    <div className="text-xs text-gray-500">
                                                        Assigned to: {subtask.assignee.first_name} {subtask.assignee.last_name}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(subtask.status)}`}>
                                                {subtask.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                                <div className="space-y-2">
                                    {task.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <Paperclip size={16} className="text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Uploaded by {attachment.uploaded_by.first_name} {attachment.uploaded_by.last_name}
                                                </p>
                                            </div>
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-sm hover:underline"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Comments</h3>
                            
                            {/* Add Comment */}
                            {!isTaskInFinalState() && (
                                <div className="flex gap-3 mb-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={2}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim() || isAddingComment}
                                            >
                                                {isAddingComment ? 'Posting...' : 'Post'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Comments List */}
                            {task.comments && task.comments.length > 0 ? (
                                <div className="space-y-4">
                                    {task.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User size={16} className="text-gray-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {comment.author.first_name} {comment.author.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <User size={24} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No comments yet</p>
                                </div>
                            )}
                        </div>

                        {/* Activity/History */}
                        {task.history && task.history.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity</h3>
                                <div className="space-y-3">
                                    {task.history.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User size={16} className="text-gray-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {item.user.first_name} {item.user.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer - Actions */}
                    {!isTaskInFinalState() && (
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                            {task.status === 'pending' && (
                                <button
                                    onClick={() => handleChangeStatus('in_progress')}
                                    disabled={isChangingStatus}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    <Clock size={16} />
                                    {isChangingStatus ? 'Processing...' : 'Start Task'}
                                </button>
                            )}
                            
                            {(task.status === 'in_progress' || task.status === 'ongoing') && (
                                <button
                                    onClick={handleMarkCompleted}
                                    disabled={isActionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle size={16} />
                                    {isActionLoading ? 'Processing...' : 'Complete Task'}
                                </button>
                            )}
                            
                            {task.status !== 'completed' && task.status !== 'cancelled' && (
                                <button
                                    onClick={() => handleChangeStatus('cancelled')}
                                    disabled={isChangingStatus}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    <X size={16} />
                                    {isChangingStatus ? 'Processing...' : 'Cancel Task'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Widget Card */}
            <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CheckSquare size={20} className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                    </div>
                </div>

                {isLoading ? (
                    <LoadingSkeleton />
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
                                    onClick={handleMarkCompleted}
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
            </div>

            {/* Task Details Modal */}
            <TaskDetailsModal />
        </>
    );
};

export default TaskWidget;
