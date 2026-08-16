CREATE TABLE `search_results_cache` (
  `cache_key` text PRIMARY KEY NOT NULL,
  `status` text NOT NULL,
  `payload_schema_version` integer NOT NULL,
  `response_payload` text,
  -- Units: milliseconds since epoch. Matches schema mode timestamp_ms / Date.now() cutoffs.
  `resolved_at` integer NOT NULL
);

CREATE INDEX `search_results_cache_resolved_at_idx` ON `search_results_cache` (`resolved_at`);
