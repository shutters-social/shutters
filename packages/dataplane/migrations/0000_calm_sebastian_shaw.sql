CREATE TABLE `profiles` (
	`did` text PRIMARY KEY NOT NULL,
	`display_name` text(640) NOT NULL,
	`description` text(2560),
	`avatar_cid` text,
	`created_at` text NOT NULL,
	`indexed_at` text DEFAULT (CURRENT_TIMESTAMP)
);
