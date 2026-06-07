import { useState, FormEvent } from 'react';
import { api } from '../api/client';
import type { MessageDetail } from '../types';

interface Props {
  replyTo?: MessageDetail;
  onClose: () => void;
}

function dedupeReSubject(subject: string): string {
  return subject.replace(/^(Re:\s*)+/i, 'Re: ');
}

export default function ComposeModal({ replyTo, onClose }: Props) {
  const isReply = !!replyTo;

  const [to, setTo] = useState(replyTo ? replyTo.from.address : '');
  const [subject, setSubject] = useState(
    replyTo ? dedupeReSubject(`Re: ${replyTo.subject}`) : ''
  );
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!to || !subject || !body) return;
    setError('');
    setSending(true);

    try {
      const html = body.replace(/\n/g, '<br>');
      if (isReply && replyTo) {
        await api.replyMail({
          to,
          subject,
          html,
          text: body,
          inReplyTo: replyTo.messageId,
          references: replyTo.references
            ? `${replyTo.references} ${replyTo.messageId}`
            : replyTo.messageId,
        });
      } else {
        await api.sendMail({ to, subject, html, text: body });
      }
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-end p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <span className="text-sm font-medium text-gray-800">
            {isReply ? 'Reply' : 'New Email'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1">
          <div className="px-4 pt-3 space-y-2">
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs text-gray-500 w-14 flex-shrink-0">To</span>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 text-sm outline-none text-gray-800"
                placeholder="recipient@example.com"
              />
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs text-gray-500 w-14 flex-shrink-0">Subject</span>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 text-sm outline-none text-gray-800"
                placeholder="Subject"
              />
            </div>
          </div>

          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 px-4 py-3 text-sm text-gray-800 outline-none resize-none min-h-[200px]"
            placeholder="Write your message…"
          />

          {error && (
            <p className="px-4 pb-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
