import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, signIn } = useAuth();
  const router = useRouter();

  // Check if email already exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        // Check if email already exists before attempting signup
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setError('An account with this email already exists. Please sign in instead.');
          setLoading(false);
          return;
        }

        await signUp(email, password, firstName, lastName);
        setSuccess('Account created successfully! Please check your email for the confirmation link.');
        // Don't redirect - let them know to check email
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'An error occurred. Please try again.';
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        console.log('Error message:', error.message);
        
        if (errorMsg.includes('invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (errorMsg.includes('email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (errorMsg.includes('user already registered') || 
                   errorMsg.includes('already registered') ||
                   errorMsg.includes('user already exists') ||
                   errorMsg.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (errorMsg.includes('password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (errorMsg.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMsg.includes('signup_disabled')) {
          errorMessage = 'Sign up is currently disabled. Please contact support.';
        } else if (errorMsg.includes('too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment and try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--card-border)',
        position: 'relative'
      }}>
        {/* Logo and Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                     <div style={{ 
             display: 'inline-flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             marginBottom: 12
           }}>
             <Image 
               src="/icon.svg" 
               alt="PantryPal Logo" 
               width={50} 
               height={50}
             />
           </div>
          <h1 style={{ 
            fontSize: 24,
            fontWeight: 'bold',
            color: '#22c55e',
            margin: '0 0 6px 0'
          }}>
            PantryPal
          </h1>
          <p style={{ 
            fontSize: 13,
            color: '#666',
            margin: 0
          }}>
            Smart pantry management with barcode scanning
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: 24,
          background: '#f8f9fa',
          borderRadius: 8,
          padding: 3
        }}>
          <button
            onClick={() => {
              setIsSignUp(false);
              clearMessages();
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: isSignUp ? 'transparent' : 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '500',
              color: isSignUp ? '#666' : '#333',
              cursor: 'pointer',
              boxShadow: isSignUp ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              clearMessages();
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: isSignUp ? 'white' : 'transparent',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '500',
              color: isSignUp ? '#333' : '#666',
              cursor: 'pointer',
              boxShadow: isSignUp ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: 13
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Enter your first name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e1e5e9',
                    borderRadius: 8,
                    fontSize: 13,
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: 13
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearMessages();
                  }}
                  placeholder="Enter your last name"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e1e5e9',
                    borderRadius: 8,
                    fontSize: 13,
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontWeight: '600',
              color: '#333',
              fontSize: 13
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessages();
              }}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e1e5e9',
                borderRadius: 8,
                fontSize: 13,
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontWeight: '600',
              color: '#333',
              fontSize: 13
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearMessages();
              }}
              placeholder="Enter your password"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e1e5e9',
                borderRadius: 8,
                fontSize: 13,
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
            {isSignUp && (
              <small style={{ 
                color: '#666', 
                fontSize: 11,
                marginTop: 3,
                display: 'block'
              }}>
                Password must be at least 6 characters long
              </small>
            )}
          </div>

          {error && (
            <div style={{ 
              marginBottom: 16, 
              padding: '10px 14px', 
              background: '#fef2f2', 
              color: '#dc2626',
              borderRadius: 8,
              fontSize: 13,
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              marginBottom: 16, 
              padding: '10px 14px', 
              background: '#f0fdf4', 
              color: '#16a34a',
              borderRadius: 8,
              fontSize: 13,
              border: '1px solid #bbf7d0'
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Register' : 'Sign In')}
          </button>
        </form>

        {isSignUp && (
          <div style={{ 
            marginTop: 16,
            padding: '10px 14px',
            background: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: 8,
            fontSize: 11,
            color: '#a16207',
            lineHeight: 1.3
          }}>
            <strong>Note:</strong> After creating your account, you&apos;ll receive a confirmation email. 
            Please click the link in the email to activate your account before signing in.
          </div>
        )}
      </div>
    </div>
  );
} 