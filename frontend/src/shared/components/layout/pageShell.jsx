export default function PageShell({
  children,
  className = "",
  containerClassName = "",
  withContainer = false
}) {
  const wrapperClass = `page-shell ${className}`.trim();

  if (!withContainer) {
    return <div className={wrapperClass}>{children}</div>;
  }

  return (
    <div className={wrapperClass}>
      <div className={`page-container ${containerClassName}`.trim()}>{children}</div>
    </div>
  );
}

