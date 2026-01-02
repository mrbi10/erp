import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageNotFound() {
  const navigate = useNavigate();

  const container = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    color: '#e6eef8',
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    overflow: 'hidden',

  };

  const card = {
    width: '100vw',
    height: '100%',
    overflow: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    borderRadius: 18,
    color: '#006ff7ff',
    padding: '36px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
    display: 'flex',
    gap: 30,
    alignItems: 'center',
  };


  const right = {
    flex: 1,
    minWidth: 320,
  };

  const title = {
    fontSize: 28,
    lineHeight: '1.05',
    marginBottom: 10,
    color: '#006ff7ff',
    fontWeight: 700,
  };



  const hint = {
    fontSize: 13,
    color: '#9fb0d6',
    marginBottom: 22,
  };

  const actions = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  };

  const btn = {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    background: '#584cffff',
    color: 'white',
    transition: 'transform 160ms ease, box-shadow 160ms ease',
  };


  return (
    <div style={container}>


      <div style={card}>

        <div style={right}>
          <div style={title}>Page not found — nothing to see here</div>
          <div style={hint}>
            Tip: double-check the URL or use the controls below. Your current path will be
            preserved if you choose to reload.
          </div>

          <div style={actions}>
            <button
              className="pnf-btn"
              style={btn}
              onClick={() => navigate(-1)}
              title="Go back"
            >
              Go back
            </button>

            <button
              className="pnf-btn"
              style={btn}
              onClick={() => navigate('/dashboard')}
              title="Go to dashboard/home"
            >
              Home
            </button>

            <button
              className="pnf-btn"
              style={{ ...btn, marginLeft: 6 }}
              onClick={() => window.location.reload()}
              title="Reload this page"
            >
              Reload
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}
