import { useState } from 'react';
import LoginPage from './components/LoginPage';
import MailLayout from './components/MailLayout';
import { tokenStore } from './api/client';

function getInitialEmail(): string | null {
  const token = tokenStore.get();
  const email = tokenStore.getEmail();
  return token && email ? email : null;
}

export default function App() {
  const [email, setEmail] = useState<string | null>(getInitialEmail);

  if (!email) {
    return <LoginPage onLogin={setEmail} />;
  }

  return <MailLayout email={email} onLogout={() => { setEmail(null); }} />;
}
