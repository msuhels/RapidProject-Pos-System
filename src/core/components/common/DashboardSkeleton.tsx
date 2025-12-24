export function DashboardSkeleton() {
  return (
    <div className="fixed inset-0 flex min-h-screen bg-background z-[100]">
      {/* Sidebar Skeleton */}
      <aside className="fixed left-0 top-0 w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border z-[101]">
        {/* Logo/Title Skeleton */}
        <div className="p-6 flex-shrink-0">
          <div className="h-6 bg-sidebar-accent/30 rounded animate-pulse w-3/4"></div>
        </div>
        
        {/* Navigation Items Skeleton */}
        <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 px-4 py-2 rounded-md"
            >
              <div className="w-5 h-5 bg-sidebar-accent/30 rounded animate-pulse"></div>
              <div className="h-4 bg-sidebar-accent/30 rounded animate-pulse flex-1"></div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Topbar Skeleton */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-6 bg-muted/50 rounded animate-pulse w-48"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-muted/50 rounded animate-pulse w-32"></div>
              <div className="h-8 w-8 bg-muted/50 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-muted/50 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-6 bg-muted/30">
          <div className="space-y-4">
            {/* Page Header Skeleton */}
            <div className="space-y-2">
              <div className="h-8 bg-card/50 rounded animate-pulse w-64"></div>
              <div className="h-4 bg-card/50 rounded animate-pulse w-96"></div>
            </div>

            {/* Content Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-card border border-border rounded-lg p-6 space-y-3"
                >
                  <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

