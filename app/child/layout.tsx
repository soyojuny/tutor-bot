import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['child']}>
      <div className="min-h-screen bg-child-background">
        {children}
      </div>
    </ProtectedRoute>
  );
}
