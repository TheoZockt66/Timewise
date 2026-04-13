type GoalProgressBarProps = {
  loggedMinutes: number;
  targetMinutes: number;
  percentage: number;
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function GoalProgressBar({
  loggedMinutes,
  targetMinutes,
  percentage,
}: GoalProgressBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {formatMinutes(loggedMinutes)} von {formatMinutes(targetMinutes)}
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}
