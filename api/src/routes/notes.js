const express = require('express');
const { allNotes, getNote, createNote, updateNote, deleteNote } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await allNotes();
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required (string)' });
  }
  const created = await createNote(title, content);
  res.status(201).json(created);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const row = await getNote(id);
  if (!row) return res.status(404).json({ error: 'Not Found' });
  res.json(row);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const updated = await updateNote(id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not Found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const ok = await deleteNote(id);
  if (!ok) return res.status(404).json({ error: 'Not Found' });
  res.status(204).send();
});

module.exports = router;
