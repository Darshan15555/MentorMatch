import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar } from '../components/Shared.jsx';
import { Button } from '../components/UI.jsx';
import { SPRING } from '../components/Motion.jsx';

function MessageBubble({ m, myId }) {
  const mine = m.sender_id === myId;
  return (
    <motion.div
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

export default function RoomChatPage() {
  const { roomId } = useParams();
  const { user, getSocket } = useAuth();
  const toast = useToast();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const [r, history] = await Promise.all([api('GET', `/rooms/${roomId}`), api('GET', `/chat/room/${roomId}`)]);
      if (cancelled) return;
      setRoom(r);
      setMessages(history);
    }
    init();
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', { roomId }, (ack) => { if (ack?.error) toast(ack.error, true); });
    function onMessage(msg) {
      if (msg.room_id !== roomId) return;
      setMessages(prev => [...prev, msg]);
    }
    socket.on('message', onMessage);
    return () => socket.off('message', onMessage);
  }, [roomId, getSocket, toast]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  function send() {
    const content = input.trim();
    if (!content) return;
    getSocket().emit('message', { roomId, content }, (ack) => { if (ack?.error) toast(ack.error, true); });
    setInput('');
  }

  if (!room) return null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-180px)] lg:grid-cols-[1fr_300px]">
      <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:h-auto">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <div>
            <div className="font-semibold">{room.topic}</div>
            <div className="text-xs text-text-muted">{room.member_count} members · hosted by {room.mentor.name}</div>
          </div>
        </div>
        <div ref={messagesRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-[18px]">
          {messages.map(m => <MessageBubble key={m.id} m={m} myId={user.id} />)}
        </div>
        <div className="flex gap-2.5 border-t border-border p-3.5">
          <input
            className="flex-1 rounded-full border border-border bg-bg-elevated px-3.5 py-2.5 text-text"
            placeholder="Message the room..." value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
          />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h4 className="mb-2 text-xs uppercase tracking-wide text-text-muted">Members</h4>
        {room.members.map(m => (
          <div key={m.id} className="flex items-center gap-2 py-1.5">
            <Avatar name={m.name} size={28} />
            <span className="text-sm">{m.name === user.name ? `${m.name} (you)` : m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
