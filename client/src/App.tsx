import { useState } from 'react';
import LoginPage from './components/LoginPage';
import MailLayout from './components/MailLayout';

export default function App() {
  const [email, setEmail] = useState<string | null>(null);

  if (!email) {
    return <LoginPage onLogin={setEmail} />;
  }

  return <MailLayout email={email} onLogout={() => setEmail(null)} />;
}
