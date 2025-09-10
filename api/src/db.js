const { Pool } = require('pg');

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RENDER === 'true' ||       // Render 環境で自動セットされがち
  !!process.env.PGSSLMODE ||             // 例: 'require'
  !!process.env.DATABASE_SSL;            // 明示フラグ用

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isProd ? { ssl: { rejectUnauthorized: false } } : {}),
});

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // ローカルはこれでOK
//   // 本番（Render等）でSSLが必要なら: ssl: { rejectUnauthorized: false }
// });

async function allNotes() {
  const { rows } = await pool.query(`
    SELECT
      id, title, content,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM notes
    ORDER BY id DESC
  `);
  return rows;
}

async function getNote(id) {
  const { rows } = await pool.query(`
    SELECT
      id, title, content,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM notes
    WHERE id = $1
  `, [id]);
  return rows[0] || null;
}

async function createNote(title, content) {
  const { rows } = await pool.query(
    `INSERT INTO notes (title, content)
     VALUES ($1, $2)
     RETURNING *`,
    [title, content || null]
  );
  return rows[0];
}

async function updateNote(id, fields) {
  const current = await getNote(id);
  if (!current) return null;

  const newTitle   = typeof fields.title === 'string'   ? fields.title   : current.title;
  const newContent = typeof fields.content === 'string' ? fields.content : current.content;

  const { rows } = await pool.query(`
    UPDATE notes
       SET title = $1, content = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING
       id, title, content,
       created_at AS "createdAt",
       updated_at AS "updatedAt"
  `, [newTitle, newContent, id]);
  return rows[0] || null;
}

async function deleteNote(id) {
  const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { allNotes, getNote, createNote, updateNote, deleteNote, pool };


async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'notes_set_updated_at'
      ) THEN
        CREATE TRIGGER notes_set_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);
}

module.exports = { allNotes, getNote, createNote, updateNote, deleteNote, pool, initSchema };