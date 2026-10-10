-- Rebuild posts_fts so booru tag punctuation stays inside tokens.
--
-- Default unicode61 treats '_' / '-' / ':' / … as separators, so MATCH
-- 'long_hair' also hits absurdly_long_hair / hair_ornament (token "hair"),
-- and unquoted hyphen tags fail FTS5 parse (NOT / column syntax).
--
-- tokenchars measured from live posts.tags: non-alphanumeric codepoints
-- with space as the only delimiter (not in tokenchars):
--   !#&()+,-./:;=?^_
-- Semicolon is omitted from the DDL string: it appears only inside HTML
-- entities (&#039; etc.), and splitMigrationStatements splits on bare `;`
-- without string awareness, which would truncate this CREATE.
-- Effective tokenchars:
--   !#&()+,-./:=?^_
--
-- External-content CREATE matches 0006 (content/content_rowid); trigger
-- bodies match RUNTIME_DROPPABLE_FTS_TRIGGERS in fts-triggers.ts (0033
-- delete command). Do not use DELETE FROM posts_fts.

DROP TRIGGER IF EXISTS posts_fts_insert;
DROP TRIGGER IF EXISTS posts_fts_update;
DROP TRIGGER IF EXISTS posts_fts_delete;

DROP TABLE IF EXISTS posts_fts;

CREATE VIRTUAL TABLE posts_fts USING fts5(
  tags,
  content='posts',
  content_rowid='id',
  tokenize="unicode61 tokenchars '!#&()+,-./:=?^_'"
);

CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE OF tags ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', old.id, old.tags);
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', old.id, old.tags);
END;

INSERT INTO posts_fts(posts_fts) VALUES('rebuild');
