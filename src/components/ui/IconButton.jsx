export default function IconButton({
  children,
  label,
  variant = "default",
  size = "md",
  className = "",
  onClick,
  disabled = false,
}) {
  const variants = {
    default:
      "text-[#9aa1ad] hover:text-[#f1f3f5] hover:bg-[#222731]",
    danger:
      "text-red-400 hover:text-red-300 hover:bg-red-500/10",
    active:
      "text-blue-400 bg-blue-500/10",
  };

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-11 h-11",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        shrink-0
        rounded-lg
        transition-colors
        duration-150
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}