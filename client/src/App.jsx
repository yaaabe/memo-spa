import { useEffect, useState } from 'react'

// 日付表示を整える小ヘルパ
function format(ts) {
  try { return new Date(ts).toLocaleString('ja-JP') }
  catch { return ts }
}

// 1件分の表示＋編集＋削除コンポーネント
function NoteItem({ note, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  async function save() {
    if (!title.trim()) { alert('タイトルは必須です'); return }
    try {
      setSaving(true); setErr(null)
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setEditing(false)
      onChanged() // 親に「変更あったよ」と通知 → 再取得
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`本当に削除しますか？ (id: ${note.id})`)) return
    const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
    if (!res.ok) { alert('削除に失敗しました'); return }
    onChanged()
  }

  if (editing) {
    return (
      <li style={styles.card}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タイトル"
            style={styles.input}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="本文"
            rows={3}
            style={styles.textarea}
          />
          {err && <div style={styles.error}>エラー: {err}</div>}
          <div style={styles.row}>
            <button onClick={save} disabled={saving} style={styles.buttonPrimary}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => { setEditing(false); setTitle(note.title); setContent(note.content || '') }} style={styles.button}>
              キャンセル
            </button>
          </div>
        </div>
        <div style={styles.meta}>
          #{note.id}　作成: {format(note.created_at ?? note.createdAt)}　更新: {format(note.updated_at ?? note.updatedAt)}
        </div>
      </li>
    )
  }

  return (
    <li style={styles.card}>
      <strong style={{ fontSize: 16 }}>{note.title}</strong>
      {note.content && <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{note.content}</div>}
      <div style={styles.meta}>
        #{note.id}　作成: {format(note.created_at ?? note.createdAt)}　更新: {format(note.updated_at ?? note.updatedAt)}
      </div>
      <div style={styles.row}>
        <button onClick={() => setEditing(true)} style={styles.button}>編集</button>
        <button onClick={remove} style={styles.buttonDanger}>削除</button>
      </div>
    </li>
  )
}

export default function App() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 作成フォーム用
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  async function fetchNotes() {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      setNotes(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [])

  async function createNote(e) {
    e.preventDefault()
    if (!title.trim()) { alert('タイトルは必須です'); return }
    try {
      setCreating(true)
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setTitle(''); setContent('')
      fetchNotes()
    } catch (e) {
      alert('作成に失敗しました: ' + e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <main style={styles.main}>
      <h1>📝 メモアプリ（React版）</h1>

      {/* 作成フォーム */}
      <section style={styles.section}>
        <h2>新規メモ</h2>
        <form onSubmit={createNote} style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タイトル（必須）"
            style={styles.input}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="本文（任意）"
            rows={3}
            style={styles.textarea}
          />
          <div>
            <button type="submit" disabled={creating} style={styles.buttonPrimary}>
              {creating ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </section>

      {/* 一覧 */}
      <section style={styles.section}>
        <h2>メモ一覧</h2>
        {loading && <p>読み込み中...</p>}
        {error && <p style={styles.error}>エラー: {error}</p>}
        {!loading && !error && (
          notes.length === 0 ? (
            <p>まだメモがありません。</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {notes.map(n => (
                <NoteItem key={n.id} note={n} onChanged={fetchNotes} />
              ))}
            </ul>
          )
        )}
      </section>
    </main>
  )
}

// ざっくりスタイル
const styles = {
  main: { fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '24px auto', padding: '0 12px' },
  section: { marginTop: 16 },
  input: { padding: 8, fontSize: 14 },
  textarea: { padding: 8, fontSize: 14 },
  row: { display: 'flex', gap: 8, marginTop: 8 },
  button: { padding: '6px 10px', fontSize: 14, cursor: 'pointer' },
  buttonPrimary: { padding: '6px 10px', fontSize: 14, cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 },
  buttonDanger: { padding: '6px 10px', fontSize: 14, cursor: 'pointer', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6 },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 12, margin: '8px 0' },
  meta: { color: '#666', fontSize: 12, marginTop: 6 },
  error: { color: 'crimson' },
}
