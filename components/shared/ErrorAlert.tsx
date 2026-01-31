import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

const ErrorAlert = ({ message, className }: ErrorAlertProps) => {
  return (
    <div
      className={cn(
        'flex items-center space-x-2 rounded-lg border bg-red-50 p-4 text-sm text-red-700 border-red-200',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">오류:</span>
      <span>{message}</span>
    </div>
  );
};

export default ErrorAlert;
