import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="min-h-screen bg-parent-background">
        {children}
      </div>
    </ProtectedRoute>
  );
}
