import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFolders } from '../hooks/useFolders';
import { api } from '../api/client';
import FolderTabs from './FolderTabs';
import MessageList from './MessageList';
import MessageViewer from './MessageViewer';
import ComposeModal from './ComposeModal';
import type { MessageDetail } from '../types';

interface Props {
  email: string;
  onLogout: () => void;
}

export default function MailLayout({ email, onLogout }: Props) {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageDetail | undefined>();

  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await api.logout().catch(() => {});
    queryClient.clear();
    onLogout();
  }

  function handleFolderSelect(id: string) {
    setSelectedFolder(id);
    setSelectedMessageId(null);
    setPage(1);
  }

  function handleCompose() {
    setReplyTo(undefined);
    setComposeOpen(true);
  }

  function handleReply(msg: MessageDetail) {
    setReplyTo(msg);
    setComposeOpen(true);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">Skysender Mail</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Folder tabs */}
      {foldersLoading ? (
        <div className="h-11 bg-white border-b border-gray-200" />
      ) : (
        <FolderTabs
          folders={folders}
          selected={selectedFolder}
          onSelect={handleFolderSelect}
          onCompose={handleCompose}
        />
      )}

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto bg-white">
          <MessageList
            folder={selectedFolder}
            page={page}
            selectedId={selectedMessageId}
            onSelect={setSelectedMessageId}
            onPageChange={setPage}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <MessageViewer
            folder={selectedFolder}
            messageId={selectedMessageId}
            onReply={handleReply}
          />
        </div>
      </div>

      {composeOpen && (
        <ComposeModal
          replyTo={replyTo}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}
