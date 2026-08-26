import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar } from '../components/Shared.jsx';
import { Button, TextArea } from '../components/UI.jsx';
import { SPRING, SPRING_SOFT } from '../components/Motion.jsx';

function MessageBubble({ m, myId }) {
  const mine = m.sender_id === myId;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING}
      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug sm:max-w-[72%] ${
        mine ? 'self-end rounded-br-sm bg-signal text-bg' : 'self-start rounded-bl-sm bg-bg-elevated'
      }`}
    >
      <div>{m.content}</div>
      <div className="mt-0.5 text-[0.68rem] opacity-65">{mine ? 'You' : m.sender_name}</div>
    </motion.div>
  );
}

function FeedbackModal({ otherName, matchId, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [endorse, setEndorse] = useState(false);
  const toast = useToast();

  async function submit() {
    if (!rating) { toast('Please pick a star rating', true); return; }
    await api('POST', '/feedback', { match_id: matchId, rating, comment, endorsement: endorse });
    toast('Thanks for the feedback!');
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-[26px]"
        initial={{ scale: 0.9, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={SPRING_SOFT}
      >
        <h3>Rate your session with {otherName}</h3>
        <div className="my-2.5 flex gap-1.5 text-3xl">
          {[1, 2, 3, 4, 5].map(i => (
            <motion.span
              key={i} whileTap={{ scale: 1.3 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className={`cursor-pointer ${i <= rating ? 'text-spark' : 'text-border'}`} onClick={() => setRating(i)}
            >★</motion.span>
          ))}
        </div>
        <TextArea placeholder="Optional comment or endorsement..." value={comment} onChange={e => setComment(e.target.value)} />
        <label className="my-2 flex items-center gap-1.5 text-sm text-text-muted">
          <input type="checkbox" checked={endorse} onChange={e => setEndorse(e.target.checked)} />
          Make this a public endorsement
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Submit</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GoalBlock({ g, onChanged }) {
  const [itemInput, setItemInput] = useState('');
  const toast = useToast();

  async function toggleItem(item) {
    const result = await api('PATCH', `/goals/items/${item.id}`, { is_done: !item.is_done });
    if (result.milestone_just_completed) toast('🎉 Milestone complete!');
    onChanged();
  }

  async function addItem(e) {
    e.preventDefault();
    if (!itemInput.trim()) return;
    await api('POST', `/goals/${g.id}/items`, { content: itemInput.trim() });
    setItemInput('');
    onChanged();
  }

  return (
    <div className="mb-4">
      {g.needsNudge && (
        <div className="mb-2.5 rounded-lg border border-spark/35 bg-spark/10 px-2.5 py-2 text-xs text-spark">
          ⏰ No progress in {g.daysSinceActivity} days — check in with each other!
        </div>
      )}
      <div className="text-sm font-semibold">{g.title}</div>
      <div className="my-1.5 h-1.5 overflow-hidden rounded bg-bg-elevated">
        <motion.div
          className="h-full rounded bg-gradient-to-r from-signal to-receive"
          initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={SPRING_SOFT}
        />
      </div>
      {g.items.map(item => (
        <div key={item.id} className={`flex items-center gap-2 py-1 text-sm ${item.is_done ? 'text-text-faint line-through' : ''}`}>
          <input type="checkbox" checked={item.is_done} onChange={() => toggleItem(item)} />
          <span>{item.content}</span>
        </div>
      ))}
      <form onSubmit={addItem} className="mt-1.5 flex gap-1.5">
        <input
          placeholder="Add step..." value={itemInput} onChange={e => setItemInput(e.target.value)}
          className="flex-1 rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text placeholder:text-text-faint"
        />
        <Button size="sm" variant="ghost" type="submit">+</Button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  const { matchId } = useParams();
  const { user, getSocket } = useAuth();
  const toast = useToast();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [typingText, setTypingText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const messagesRef = useRef(null);
  const typingTimerRef = useRef(null);

  const loadGoals = useCallback(async () => setGoals(await api('GET', `/goals/match/${matchId}`)), [matchId]);
  const loadNotes = useCallback(async (menteeId) => setNotes(await api('GET', `/notes/mentee/${menteeId}`)), []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const m = await api('GET', `/matches/${matchId}`);
      const history = await api('GET', `/chat/match/${matchId}`);
      if (cancelled) return;
      setMatch(m);
      setMessages(history);
      loadGoals();
      if (m.mentor_id === user.id) loadNotes(m.mentee_id);
      const prefill = sessionStorage.getItem(`mp_prefill_${matchId}`);
      if (prefill) { setInput(prefill); sessionStorage.removeItem(`mp_prefill_${matchId}`); }
    }
    init();
    return () => { cancelled = true; };
  }, [matchId, user.id, loadGoals, loadNotes]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', { matchId }, (ack) => { if (ack?.error) toast(ack.error, true); });
    function onMessage(msg) { if (msg.match_id === matchId) setMessages(prev => [...prev, msg]); }
    function onTyping(data) {
      if (data.matchId !== matchId || data.userId === user.id) return;
      setTypingText('typing...');
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingText(''), 1800);
    }
    socket.on('message', onMessage);
    socket.on('typing', onTyping);
    return () => { socket.off('message', onMessage); socket.off('typing', onTyping); };
  }, [matchId, user.id, getSocket, toast]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  function send() {
    const content = input.trim();
    if (!content) return;
    getSocket().emit('message', { matchId, content }, (ack) => { if (ack?.error) toast(ack.error, true); });
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') send();
    else getSocket().emit('typing', { matchId });
  }

  async function addGoal(e) {
    e.preventDefault();
    if (!goalInput.trim()) return;
    await api('POST', '/goals', { match_id: matchId, title: goalInput.trim(), items: [] });
    setGoalInput('');
    loadGoals();
  }

  async function addNote(e) {
    e.preventDefault();
    if (!noteInput.trim() || !match) return;
    await api('POST', '/notes', { mentee_id: match.mentee_id, note_text: noteInput.trim() });
    setNoteInput('');
    loadNotes(match.mentee_id);
  }

  if (!match) return null;
  const isMentor = match.mentor_id === user.id;
  const other = isMentor ? match.mentee : match.mentor;

  return (
    <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-180px)] lg:grid-cols-[1fr_300px]">
      <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:h-auto">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={other.name} size={34} />
            <div>
              <div className="font-semibold">{other.name}</div>
              <div className="text-xs text-text-muted">{isMentor ? 'Your mentee' : 'Your mentor'}</div>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowFeedback(true)}>Leave feedback</Button>
        </div>

        <div ref={messagesRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-[18px]">
          <AnimatePresence initial={false}>
            {messages.map(m => <MessageBubble key={m.id} m={m} myId={user.id} />)}
          </AnimatePresence>
        </div>
        <div className="min-h-[1.2em] px-[18px] text-xs italic text-text-muted">{typingText}</div>

        <div className="flex gap-2.5 border-t border-border p-3.5">
          <input
            placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 rounded-full border border-border bg-bg-elevated px-3.5 py-2.5 text-text placeholder:text-text-faint"
          />
          <Button onClick={send}>Send</Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 lg:max-h-none">
        <h4 className="mb-2 text-xs uppercase tracking-wide text-text-muted">Shared checklist</h4>
        {goals.length === 0 && <p className="text-sm">No shared goals yet — add one below to track progress together.</p>}
        {goals.map(g => <GoalBlock key={g.id} g={g} onChanged={loadGoals} />)}
        <form onSubmit={addGoal} className="mt-3">
          <input
            placeholder="New goal, e.g. Learn React basics" value={goalInput} onChange={e => setGoalInput(e.target.value)}
            className="mb-1.5 w-full rounded-lg border border-border bg-bg-elevated px-2 py-2 text-sm text-text placeholder:text-text-faint"
          />
          <Button size="sm" variant="secondary" type="submit">Add goal</Button>
        </form>

        {isMentor && (
          <>
            <h4 className="mb-2 mt-[22px] text-xs uppercase tracking-wide text-text-muted">Private notes (only you see these)</h4>
            {notes.length === 0 && <p className="text-sm">No notes yet.</p>}
            {notes.map(n => (
              <div key={n.id} className="mb-1.5 rounded-lg bg-bg-elevated p-2 text-sm">{n.note_text}</div>
            ))}
            <form onSubmit={addNote} className="mt-2">
              <TextArea placeholder="Jot a private note about this mentee..." value={noteInput} onChange={e => setNoteInput(e.target.value)} />
              <Button size="sm" variant="secondary" type="submit" className="mt-1.5">Save note</Button>
            </form>
          </>
        )}
      </div>

      <AnimatePresence>
        {showFeedback && <FeedbackModal otherName={other.name} matchId={matchId} onClose={() => setShowFeedback(false)} />}
      </AnimatePresence>
    </div>
  );
}
