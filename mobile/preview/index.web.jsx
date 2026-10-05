import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { useAuthStore } from '../src/store/authStore';
import { queryClient } from '../src/api/queryClient';

const PreviewShell = () => {
  const [frameWidth, setFrameWidth] = useState(412); // standard mobile width
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const currentRole = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleSwitchToCustomer = () => {
    queryClient.clear();
    clearAuth(); // Guest customer
  };

  const handleSwitchToCustomerLoggedIn = () => {
    queryClient.clear();
    setAuth({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYWJhNjU1OGQwYjYxZjBjMjRmYmY4MCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzg5ODA1NjAwLCJleHAiOjE4MjEzNDE2MDB9.U3ri9b0o0Xza3Mxt27zQqmHTb2wEqzzblHYHIcsyb0g',
      user: {
        _id: '6aaba6558d0b61f0c24fbf80',
        name: 'Demo Customer',
        phone: '9820998107',
        email: 'customer_rn8_mu59yf6w@test.com',
        role: 'user',
      },
    });
  };

  const handleSwitchToAdmin = () => {
    queryClient.clear();
    setAuth({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhN2FlYzZjNTExMmYzYjVjOTc5ZDlmOSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4OTgwNTYwMCwiZXhwIjoxODIxMzQxNjAwfQ.s2X3keFHvdjKYJeBILmkc-M1HPZCU0mLHZBUvb-Y7Mc',
      user: {
        _id: '6a7aec6c5112f3b5c979d9f9',
        name: 'CleanFlow Admin',
        phone: '9892478247',
        email: 'mujahid@laundryflow.com',
        role: 'admin',
        laundryId: '6a7aec6c5112f3b5c979d9fa',
      },
    });
  };

  const handleSwitchToDelivery = () => {
    queryClient.clear();
    setAuth({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYWJhNjczZDVjMTBlNDdmNjE5Nzc4YiIsInJvbGUiOiJkZWxpdmVyeSIsImlhdCI6MTc4OTgwNTYwMCwiZXhwIjoxODIxMzQxNjAwfQ.nTKA9bu6sIVpjdf4zkSHu0hGh1yLwDT7xEvTf80cGIE',
      user: {
        _id: '6aaba673d5c10e47f619778b',
        name: 'Rajesh Delivery Partner',
        phone: '9894935083',
        email: 'driver_rn8_mu59z1qb@test.com',
        role: 'delivery',
        availabilityStatus: 'available',
      },
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      height: '100vh',
      backgroundColor: '#E2E8F0',
      overflow: 'hidden',
    }}>
      {/* Top Preview Control Bar */}
      <header style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #CBD5E1',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        gap: '12px',
        zIndex: 9999,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', letterSpacing: '-0.3px' }}>
            🧺 LaundryFlow Mobile Preview
          </span>
          <span style={{
            fontSize: '11px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600,
          }}>
            Browser Mode
          </span>
        </div>

        {/* Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748B', fontSize: '12px', marginRight: '4px' }}>Role:</span>
          
          <button
            onClick={handleSwitchToCustomer}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: !isAuthenticated ? '2px solid #2563EB' : '1px solid #CBD5E1',
              backgroundColor: !isAuthenticated ? '#EFF6FF' : '#FFFFFF',
              color: !isAuthenticated ? '#1D4ED8' : '#334155',
              cursor: 'pointer',
              fontWeight: !isAuthenticated ? 600 : 400,
              fontSize: '12px',
            }}
          >
            Customer (Guest)
          </button>

          <button
            onClick={handleSwitchToCustomerLoggedIn}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: isAuthenticated && currentRole === 'user' ? '2px solid #2563EB' : '1px solid #CBD5E1',
              backgroundColor: isAuthenticated && currentRole === 'user' ? '#EFF6FF' : '#FFFFFF',
              color: isAuthenticated && currentRole === 'user' ? '#1D4ED8' : '#334155',
              cursor: 'pointer',
              fontWeight: isAuthenticated && currentRole === 'user' ? 600 : 400,
              fontSize: '12px',
            }}
          >
            Customer (Logged In)
          </button>

          <button
            onClick={handleSwitchToAdmin}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: isAuthenticated && currentRole === 'admin' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
              backgroundColor: isAuthenticated && currentRole === 'admin' ? '#F5F3FF' : '#FFFFFF',
              color: isAuthenticated && currentRole === 'admin' ? '#6D28D9' : '#334155',
              cursor: 'pointer',
              fontWeight: isAuthenticated && currentRole === 'admin' ? 600 : 400,
              fontSize: '12px',
            }}
          >
            Laundry Admin
          </button>

          <button
            onClick={handleSwitchToDelivery}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: isAuthenticated && currentRole === 'delivery' ? '2px solid #059669' : '1px solid #CBD5E1',
              backgroundColor: isAuthenticated && currentRole === 'delivery' ? '#ECFDF5' : '#FFFFFF',
              color: isAuthenticated && currentRole === 'delivery' ? '#047857' : '#334155',
              cursor: 'pointer',
              fontWeight: isAuthenticated && currentRole === 'delivery' ? 600 : 400,
              fontSize: '12px',
            }}
          >
            Delivery Partner
          </button>

          {/* Viewport Width Controls */}
          <div style={{ marginLeft: '8px', borderLeft: '1px solid #E2E8F0', paddingLeft: '10px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setFrameWidth(375)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                backgroundColor: frameWidth === 375 ? '#0F172A' : '#FFFFFF',
                color: frameWidth === 375 ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              iPhone SE (375)
            </button>
            <button
              onClick={() => setFrameWidth(412)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                backgroundColor: frameWidth === 412 ? '#0F172A' : '#FFFFFF',
                color: frameWidth === 412 ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Pixel / Galaxy (412)
            </button>
            <button
              onClick={() => setFrameWidth(null)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                backgroundColor: frameWidth === null ? '#0F172A' : '#FFFFFF',
                color: frameWidth === null ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Responsive (Full)
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile App Viewport */}
      <main style={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: frameWidth ? '16px' : '0',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: frameWidth ? `${frameWidth}px` : '100%',
          maxWidth: '100%',
          height: '100%',
          maxHeight: frameWidth ? '840px' : '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: frameWidth ? '24px' : '0',
          boxShadow: frameWidth ? '0 16px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          <App />
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<PreviewShell />);
