import type { MutableRefObject } from "react";
import { X } from "lucide-react";
import log from "electron-log/renderer";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { normalizeTag } from "../../lib/tag-utils";
import { AsyncAutocomplete } from "../inputs/AsyncAutocomplete";
import type { SearchResults } from "@shared/types/providers";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { AddArtistSchema, type AddArtistRequest } from "../../../shared/schemas/artist";
import type { ProviderId } from "../../../shared/constants";

const RULE34_PROVIDER_ID: ProviderId = "rule34";
const RULE34_PROVIDER_LABEL = "Rule34.xxx";

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    tag: string,
    type: "tag" | "uploader" | "query",
    provider: ProviderId
  ) => void;
  /** Element to restore focus to when the dialog closes (e.g. the control that opened it). */
  returnFocusToRef: MutableRefObject<HTMLElement | null>;
}

export function AddArtistModal({
  isOpen,
  onClose,
  onAdd,
  returnFocusToRef,
}: AddArtistModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddArtistRequest>({
    resolver: zodResolver(AddArtistSchema),
    defaultValues: {
      provider: RULE34_PROVIDER_ID,
      type: "tag",
      name: "",
      tag: "",
    },
  });

  const tag = useWatch({ control, name: "tag" });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: AddArtistRequest) => {
    const finalTag = normalizeTag(data.tag);
    const finalDisplayName = finalTag;
    onAdd(finalDisplayName, finalTag, data.type, RULE34_PROVIDER_ID);
    handleClose();
  };

  const handleTagSelect = (option: SearchResults | null) => {
    const selectedTag = option?.label || "";
    setValue("tag", selectedTag);
    setValue("name", selectedTag); // Set name to tag for consistency
  };

  const handleTagChange = (query: string) => {
    setValue("tag", query);
    setValue("name", query); // Keep name in sync with tag
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="max-w-md sm:max-w-md [&>button]:hidden p-0 gap-0 overflow-hidden"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusToRef.current?.focus();
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20 space-y-0">
          <div className="flex justify-between items-center gap-2">
            <DialogTitle className="text-lg font-bold text-foreground m-0">
              Add Artist
            </DialogTitle>
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground"
              aria-label="Close modal"
            >
              <X size={20} />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Add a new tracked artist or tag source from Rule34.xxx.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void handleSubmit((data) => {
              onSubmit(data);
            })(event).catch((error: unknown) => {
              log.error("[AddArtistModal] Form submit failed:", error);
            });
          }}
          className="p-6 space-y-5"
        >
          <div className="space-y-1.5">
            <Label className="ml-1 text-xs font-medium text-muted-foreground">
              Provider
            </Label>
            <p className="text-sm text-foreground ml-1">{RULE34_PROVIDER_LABEL}</p>
          </div>

          <div className="space-y-1.5">
            <div className="relative z-20">
              <Controller
                name="tag"
                control={control}
                render={({ field }) => (
                  <AsyncAutocomplete
                    label="Tag to Track"
                    value={field.value}
                    onQueryChange={handleTagChange}
                    onSelect={handleTagSelect}
                    placeholder={`Search on ${RULE34_PROVIDER_LABEL}...`}
                    onBlur={field.onBlur}
                    provider={RULE34_PROVIDER_ID}
                    artistOnly
                  />
                )}
              />
            </div>
            {errors.tag && (
              <p className="text-xs text-destructive ml-1">{errors.tag.message}</p>
            )}
            <p className="text-[10px] text-muted-foreground ml-1">
              Searching artist tags on{" "}
              <span className="font-medium text-foreground">
                {RULE34_PROVIDER_LABEL}
              </span>
            </p>
          </div>

          <input type="hidden" {...control.register("name")} />
          <input type="hidden" {...control.register("type")} />
          <input type="hidden" {...control.register("provider")} />

          <Button
            type="submit"
            disabled={isSubmitting || !tag || !!errors.tag}
            className="mt-2 w-full"
          >
            {isSubmitting ? "Adding..." : "Start Tracking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
