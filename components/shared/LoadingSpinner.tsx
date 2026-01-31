import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

const LoadingSpinner = ({ message = '로딩중...', className }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-2 text-muted-foreground',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
