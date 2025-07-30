import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function TestProfileCreation() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testProfileCreation = async () => {
    if (!user) {
      setTestResult('No user logged in');
      return;
    }

    setLoading(true);
    setTestResult('Testing profile creation...');

    try {
      const response = await fetch('/api/check-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Profile test successful!\n\nProfile exists: ${result.exists}\nMessage: ${result.message}\n\nProfile data: ${JSON.stringify(result.profile, null, 2)}`);
      } else {
        setTestResult(`❌ Profile test failed!\n\nError: ${result.error}\nDetails: ${result.details || 'No details'}`);
      }
    } catch (error) {
      setTestResult(`❌ Profile test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: 20,
      background: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        background: 'white',
        padding: 40,
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1>Profile Creation Test</h1>
        
        {user ? (
          <div>
            <h2>Current User</h2>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>First Name:</strong> {user.user_metadata?.first_name || 'Not set'}</p>
            <p><strong>Last Name:</strong> {user.user_metadata?.last_name || 'Not set'}</p>
            
            <button
              onClick={testProfileCreation}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 16,
                marginTop: 20
              }}
            >
              {loading ? 'Testing...' : 'Test Profile Creation'}
            </button>
            
            {testResult && (
              <div style={{
                marginTop: 20,
                padding: 15,
                background: testResult.includes('✅') ? '#d4edda' : '#f8d7da',
                border: `1px solid ${testResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 14
              }}>
                {testResult}
              </div>
            )}
          </div>
        ) : (
          <p>Please log in to test profile creation.</p>
        )}
      </div>
    </div>
  );
} 