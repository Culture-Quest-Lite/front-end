type TabTitleMarkerProps = {
  title?: string | null;
};

export function TabTitleMarker({ title }: TabTitleMarkerProps) {
  const normalizedTitle = title?.trim();

  if (!normalizedTitle) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="sr-only"
      data-tab-title={normalizedTitle}
    />
  );
}
