import { useState, useEffect, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import log from "electron-log/renderer";
import { useDebounce } from "../../lib/hooks/useDebounce";
import { Fragment } from "react";

export interface AutocompleteOption {
  id: string | number;
  label: string;
}

export interface AsyncAutocompleteProps {
  label: string;
  fetchOptions: (query: string) => Promise<AutocompleteOption[]>;
  onSelect: (option: AutocompleteOption | null) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  value?: string;
  onBlur?: () => void;
}

export function AsyncAutocomplete({
  label,
  fetchOptions,
  onSelect,
  onQueryChange,
  placeholder = "Type to search...",
  value,
  onBlur,
}: AsyncAutocompleteProps) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(value || "");
  const query = isControlled ? value : internalQuery;

  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<AutocompleteOption | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const fetchOptionsRef = useRef(fetchOptions);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isValidQueryRef = useRef(false);

  useEffect(() => {
    fetchOptionsRef.current = fetchOptions;
  }, [fetchOptions]);

  useEffect(() => {
    const currentQuery = debouncedQuery || "";
    const trimmedQuery = currentQuery.trim();

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Don't search if query is empty or too short (min 2 chars for remote search)
    if (!trimmedQuery || trimmedQuery.length < 2) {
      isValidQueryRef.current = false;
      // Clear state via cleanup to avoid synchronous setState
      return () => {
        setOptions([]);
        setIsLoading(false);
      };
    }

    isValidQueryRef.current = true;

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set loading state asynchronously to avoid synchronous setState warning
    Promise.resolve().then(() => {
      if (isValidQueryRef.current && abortControllerRef.current === abortController) {
        setIsLoading(true);
      }
    });

    fetchOptionsRef
      .current(trimmedQuery)
      .then((results) => {
        // Only update state if request wasn't aborted and query is still valid
        if (!abortController.signal.aborted && isValidQueryRef.current) {
          setOptions(results);
        }
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name !== "AbortError" && !abortController.signal.aborted) {
          log.error("[AsyncAutocomplete] Search error:", err);
        }
      })
      .finally(() => {
        // Only update loading state if this is still the active request
        if (!abortController.signal.aborted && abortControllerRef.current === abortController) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      });

    return () => {
      // Cleanup: abort request and clear state if component unmounts or query changes
      isValidQueryRef.current = false;
      abortController.abort();
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    };
  }, [debouncedQuery]);

  const handleSelect = (option: AutocompleteOption | null) => {
    setSelectedOption(option);
    const newQuery = option?.label || "";

    if (!isControlled) {
      setInternalQuery(newQuery);
    }

    onSelect(option);
    onQueryChange?.(newQuery);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;

    if (!isControlled) {
      setInternalQuery(newQuery);
    }

    onQueryChange?.(newQuery);

    if (selectedOption && newQuery !== selectedOption.label) {
      setSelectedOption(null);
      onSelect(null);
    }

    if (newQuery.trim() === "") {
      setOptions([]);
      setIsLoading(false);
    }
  };

  return (
    <Combobox value={selectedOption} onChange={handleSelect} nullable>
      <div className="relative">
        {label && (
          <Combobox.Label className="block ml-1 mb-1.5 text-xs font-medium text-zinc-400">
            {label}
          </Combobox.Label>
        )}
        <div className="relative">
          <Combobox.Input
            className="px-3 py-2 pr-10 w-full text-white rounded border bg-slate-950 border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
            displayValue={(option: AutocompleteOption | null) =>
              option?.label ?? (query || "")
            }
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete="off"
          />
          <Combobox.Button className="flex absolute inset-y-0 right-0 items-center pr-2">
            <ChevronUpDownIcon
              className="w-5 h-5 text-slate-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Combobox.Options className="overflow-auto absolute z-50 py-1 mt-1 w-full max-h-60 text-base rounded-md border ring-1 ring-black ring-opacity-5 shadow-lg bg-slate-950 border-slate-800 focus:outline-none sm:text-sm">
            {isLoading ? (
              <div className="relative px-4 py-2 cursor-default select-none text-slate-400">
                Loading...
              </div>
            ) : options.length === 0 && (query || "").trim() !== "" ? (
              <div className="relative px-4 py-2 cursor-default select-none text-slate-400">
                Nothing found on Rule34
              </div>
            ) : (
              options.map((option) => (
                <Combobox.Option
                  key={option.id}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-blue-600 text-white" : "text-slate-300"
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-blue-400"
                          }`}
                        >
                          <CheckIcon className="w-5 h-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
