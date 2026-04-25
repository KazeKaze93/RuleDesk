import React, { cloneElement, isValidElement } from "react";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

type PostRef = { id: number; postId: number };

interface QuickAddToPlaylistMenuProps {
  post: PostRef;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renders a trigger plus the Add to playlist modal. Composes the trigger's onClick to open the modal.
 */
export const QuickAddToPlaylistMenu: React.FC<QuickAddToPlaylistMenuProps> = ({
  post,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const effectiveOpen = isControlled ? controlledOpen : internalOpen;
  const setEffectiveOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
      onOpenChange(next);
    }
  };

  const defaultTrigger = (
    <span role="button" className="inline-flex" tabIndex={0} aria-label="Add to playlist" />
  );

  const raw = trigger ?? defaultTrigger;
  const withOpen = isValidElement(raw)
    ? cloneElement(raw, {
        onClick: (e: React.MouseEvent) => {
          (raw.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          setEffectiveOpen(true);
        },
      } as { onClick: (e: React.MouseEvent) => void })
    : raw;

  return (
    <>
      {withOpen}
      <AddToPlaylistModal
        posts={[post]}
        open={effectiveOpen}
        onOpenChange={setEffectiveOpen}
        onSuccess={onSuccess}
      />
    </>
  );
};
