CREATE TABLE `post_lookup_cache` (
	`provider` text NOT NULL,
	`post_id` integer NOT NULL,
	`status` text NOT NULL,
	-- Units: milliseconds since epoch. Matches schema mode timestamp_ms / Date.now() cutoffs.
	`resolved_at` integer NOT NULL,
	PRIMARY KEY(`provider`, `post_id`)
);

CREATE INDEX `post_lookup_cache_resolved_at_idx` ON `post_lookup_cache` (`resolved_at`);
