'use client';

import { useAuthStore } from '@/core/store/authStore';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <ProtectedPage
      permission="dashboard:read"
      title="Dashboard"
      description="Welcome to your dashboard"
      fallbackPath="/login"
    >
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to your dashboard"
        />
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              User Information
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="break-words">
                <span className="font-medium text-foreground">Email:</span> {user?.email}
              </p>
              {user?.fullName && (
                <p className="break-words">
                  <span className="font-medium text-foreground">Name:</span> {user.fullName}
                </p>
              )}
              <p className="break-all">
                <span className="font-medium text-foreground">User ID:</span> {user?.id}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              Quick Actions
            </h3>
            <p className="text-sm text-primary">
              Your dashboard is ready. Start building your modules!
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              Getting Started
            </h3>
            <p className="text-sm text-muted-foreground">
              Explore the navigation menu to access different features and modules of the application.
            </p>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
