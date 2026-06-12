import { Trash2 } from 'lucide-react';
import type { Task } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

function getPriorityClasses(priority: string) {
  const base = 'border-2 border-foreground';
  switch (priority) {
    case 'high':
      return `${base} bg-coral text-coral-foreground`;
    case 'medium':
      return `${base} bg-gold text-gold-foreground`;
    case 'low':
      return `${base} bg-teal text-teal-foreground`;
    default:
      return `${base} bg-muted text-muted-foreground`;
  }
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-hard-sm">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1">
        <p
          className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {task.title}
        </p>
        <p className="text-sm text-muted-foreground">
          Created: {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>
      <Badge variant="outline" className={getPriorityClasses(task.priority)}>
        {task.priority}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete "${task.title}"`}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
