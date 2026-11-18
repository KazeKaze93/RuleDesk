import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  TAG_SET_NAME_MAX,
  TAG_SET_TAGS_MAX,
  readTagSets,
  writeTagSets,
  type TagSet,
} from "../site/upload-tag-sets";
import { Button, IconButton, TextField } from "../ui/kit";
import { IconPlus, IconX } from "../ui/kit/icons";

/**
 * The sets of tags of the Upload page, in the settings: a name and the tags
 * of each. A change is kept as it is typed; there is nothing to save.
 */

const SECTION_CLASS = "rdw-upload-sets-settings";
const ROW_CLASS = "rdw-upload-sets-settings-row";
const NAME_CLASS = "rdw-upload-sets-settings-name";
const TAGS_CLASS = "rdw-upload-sets-settings-tags";
const HINT_CLASS = "rdw-upload-sets-settings-hint";
const ACTIONS_CLASS = "rdw-upload-sets-settings-actions";

const NAME_LABEL = "Name";
const TAGS_LABEL = "Tags";
const NAME_PLACEHOLDER = "My usual tags";
const TAGS_PLACEHOLDER = "tag_one tag_two";
const ADD_LABEL = "Add a set";
const REMOVE_PREFIX = "Remove the set ";
const REMOVE_UNNAMED = "Remove this set";
const EMPTY_HINT = "No sets yet.";
const HINT =
  "A set is a button on the Upload page: it adds its tags to the Tags field, and a tag that is there already is not added twice. Tags are separated by spaces.";
const NAME_WIDTH_PX = 200;
const ICON_PX = 14;

export const UPLOAD_SETS_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${ROW_CLASS} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.${ROW_CLASS} .${NAME_CLASS} {
  flex: none;
  width: ${String(NAME_WIDTH_PX)}px;
}
.${ROW_CLASS} .${TAGS_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
}
.${SECTION_CLASS} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${ACTIONS_CLASS} {
  display: flex;
}
`.trim();

export function UploadSetsSection(): JSX.Element {
  const [sets, setSets] = useState<readonly TagSet[]>(() => readTagSets());
  const keep = (next: readonly TagSet[]): void => {
    writeTagSets(next);
    setSets(next);
  };
  const change = (index: number, patch: Partial<TagSet>): void => {
    keep(sets.map((set, at) => (at === index ? { ...set, ...patch } : set)));
  };

  return (
    <section className={`rdw-section ${SECTION_CLASS}`}>
      <style>{UPLOAD_SETS_SECTION_CSS}</style>
      {sets.length === 0 ? <p className={HINT_CLASS}>{EMPTY_HINT}</p> : null}
      {sets.map((set, index) => (
        // The place in the list is the only name a set has while it is being typed.
        <div key={index} className={ROW_CLASS}>
          <TextField
            className={NAME_CLASS}
            // The names of the columns stand over the first row only.
            {...(index === 0 ? { label: NAME_LABEL } : { "aria-label": NAME_LABEL })}
            value={set.name}
            placeholder={NAME_PLACEHOLDER}
            inputAttrs={{ maxLength: TAG_SET_NAME_MAX }}
            onChange={(name) => {
              change(index, { name });
            }}
          />
          <TextField
            className={TAGS_CLASS}
            {...(index === 0 ? { label: TAGS_LABEL } : { "aria-label": TAGS_LABEL })}
            value={set.tags}
            placeholder={TAGS_PLACEHOLDER}
            inputAttrs={{ maxLength: TAG_SET_TAGS_MAX }}
            onChange={(tags) => {
              change(index, { tags });
            }}
          />
          <IconButton
            label={set.name.trim().length > 0 ? `${REMOVE_PREFIX}${set.name.trim()}` : REMOVE_UNNAMED}
            onClick={() => {
              keep(sets.filter((_set, at) => at !== index));
            }}
          >
            <IconX size={ICON_PX} />
          </IconButton>
        </div>
      ))}
      <div className={ACTIONS_CLASS}>
        <Button
          variant="secondary"
          onClick={() => {
            keep([...sets, { name: "", tags: "" }]);
          }}
        >
          <IconPlus size={ICON_PX} />
          {ADD_LABEL}
        </Button>
      </div>
      <p className={HINT_CLASS}>{HINT}</p>
    </section>
  );
}
