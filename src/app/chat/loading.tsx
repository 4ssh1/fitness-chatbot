const SkeletonLoader = () => (
  <div className="h-screen flex overflow-hidden bg-background">
    {/* Sidebar Skeleton */}
    <div className="w-64 shrink-0 border-r border-border bg-black hidden md:flex flex-col">
      <div className="h-14 flex items-center justify-between border-b border-border px-3">
        <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
        <div className="w-7 h-7 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="p-3">
        <div className="h-9 w-full bg-muted rounded-xl animate-pulse"></div>
      </div>
      <div className="flex-1 px-2 space-y-2">
        <div className="h-2 w-20 bg-muted rounded animate-pulse mb-2"></div>
        <div className="h-9 w-full bg-muted rounded-xl animate-pulse"></div>
        <div className="h-9 w-full bg-muted rounded-xl animate-pulse"></div>
        <div className="h-9 w-full bg-muted rounded-xl animate-pulse"></div>
        <div className="h-9 w-full bg-muted rounded-xl animate-pulse"></div>
      </div>
      <div className="border-t border-border p-3">
        <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
      </div>
    </div>

    {/* Chat Window Skeleton */}
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Bot Message Skeleton */}
        <div className="flex items-end gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="w-3/5 space-y-2">
            <div className="h-5 bg-muted rounded-lg"></div>
            <div className="h-5 bg-muted rounded-lg w-4/5"></div>
          </div>
        </div>

        {/* User Message Skeleton */}
        <div className="flex items-end gap-3 justify-end animate-pulse">
          <div className="w-2/5 space-y-2">
            <div className="h-5 bg-primary/20 rounded-lg"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted"></div>
        </div>

        {/* Bot Message Skeleton */}
        <div className="flex items-end gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="w-1/2 space-y-2">
            <div className="h-5 bg-muted rounded-lg"></div>
            <div className="h-5 bg-muted rounded-lg w-3/4"></div>
            <div className="h-5 bg-muted rounded-lg w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Chat Input Skeleton */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className="flex-1 h-12 bg-muted rounded-xl animate-pulse"></div>
          <div className="w-12 h-12 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
