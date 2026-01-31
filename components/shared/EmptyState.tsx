import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  message: string;
  height?: string;
  className?: string;
}

const EmptyState = ({ message, height = '200px', className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-3 rounded-lg border-2 border-dashed bg-muted/50 text-muted-foreground',
        className
      )}
      style={{ height }}
    >
      <Inbox className="h-10 w-10 text-gray-400" />
      <p className="text-center">{message}</p>
    </div>
  );
};

export default EmptyState;
