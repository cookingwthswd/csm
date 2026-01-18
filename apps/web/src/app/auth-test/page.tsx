'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginTestPage() {
  const [email, setEmail] = useState('admin@ckms.local');
  const [password, setPassword] = useState('Test@123456');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setResult(`❌ Error: ${error.message}`);
        return;
      }

      // Decode JWT to see claims
      const token = data.session?.access_token;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setResult(
          `✅ Login successful!\n\n` +
            `User ID: ${data.user?.id}\n` +
            `Email: ${data.user?.email}\n\n` +
            `JWT Claims:\n${JSON.stringify(payload, null, 2)}`
        );
      }
    } catch (err) {
      setResult(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setResult('Logged out');
  };

  const handleCheckSession = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      setResult(
        `Session active:\n` +
          `Email: ${session.user.email}\n` +
          `Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}\n\n` +
          `JWT Claims:\n${JSON.stringify(payload, null, 2)}`
      );
    } else {
      setResult('No active session');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🔐 Auth Test Page</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', width: '250px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.5rem', width: '250px' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Logout
        </button>
        <button onClick={handleCheckSession} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Check Session
        </button>
      </div>

      <h3>Test Accounts:</h3>
      <ul>
        <li>
          <code>admin@ckms.local</code> / <code>Test@123456</code> - role: admin
        </li>
        <li>
          <code>manager@ckms.local</code> / <code>Test@123456</code> - role: manager, store_id: 2
        </li>
        <li>
          <code>staff@ckms.local</code> / <code>Test@123456</code> - role: store_staff, store_id: 2
        </li>
      </ul>

      <h3>Result:</h3>
      <pre
        style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflow: 'auto',
        }}
      >
        {result || 'Click Login to test'}
      </pre>
    </div>
  );
}
