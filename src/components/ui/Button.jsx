export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  onClick,
}) {
  const variants = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600",
    secondary:
      "bg-[#222731] text-[#f1f3f5] border border-[#2a2f38] hover:bg-[#292e38]",
    ghost:
      "bg-transparent text-[#9aa1ad] hover:bg-[#222731] hover:text-[#f1f3f5]",
    danger:
      "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15",
    success:
      "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm gap-2",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-sm gap-2",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-lg
        border
        border-transparent
        font-medium
        transition-colors
        duration-150
        select-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}