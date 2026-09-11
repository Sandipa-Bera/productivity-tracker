export default function Card({
  children,
  className = "",
  elevated = false,
}) {
  return (
    <div
      className={`${elevated ? "app-card-elevated" : "app-card"} ${className}`}
    >
      {children}
    </div>
  );
}