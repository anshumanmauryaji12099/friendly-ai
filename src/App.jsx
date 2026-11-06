import { useEffect, useRef, useState } from 'react';

const initialMessages = [
  { role: 'assistant', text: 'Hi! I’m Friendly AI. What would you like to explore today?' },
];

const modes = [
  { id: 'chat', label: 'New chat', icon: '✳' },
  { id: 'study', label: 'Study room', icon: '▤' },
  { id: 'images', label: 'Image studio', icon: '▧' },
];

const prompts = {
  chat: ['Explain something simply', 'Help me plan my week', 'Write a short story'],
  study: ['Explain photosynthesis', 'Make me a quick quiz', 'Help with my homework'],
  images: ['A cozy library in the clouds', 'A friendly robot gardener', 'A colorful space garden'],
};

function replyFor(text, mode) {
  if (mode === 'study') return `Let’s learn it step by step.\n\nFirst, identify the main idea in “${text}”. Then connect it to an example you already know. Try explaining it back in your own words, and I can help fill in any gaps.\n\nWant a simpler explanation or a short quiz?`;
  return `That’s a great place to start. Here’s one way to think about “${text}”: break it into a few small parts, decide what matters most, and take the next manageable step.\n\nTell me a little more about what you need, and I’ll tailor the answer for you.`;
}

function App() {
  const [active, setActive] = useState('chat');
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generated, setGenerated] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [toast, setToast] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const chooseMode = (mode) => {
    setActive(mode);
    setMobileMenu(false);
    if (mode === 'chat' || mode === 'study') setMessages(initialMessages);
  };

  const sendMessage = (value = input) => {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: replyFor(text, active) }]);
    setInput('');
  };

  const makeImage = (event) => {
    event.preventDefault();
    const text = imagePrompt.trim();
    if (!text) return;
    setGenerated(text);
    setToast('Preview created. Connect an image-generation service for real images.');
    window.setTimeout(() => setToast(''), 3500);
  };

  const installApp = async () => {
    if (!installPrompt) {
      setToast('On your phone, open the browser menu and choose “Add to Home screen”.');
      window.setTimeout(() => setToast(''), 4000);
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const currentTitle = active === 'chat' ? 'Your AI companion' : active === 'study' ? 'Study room' : 'Image studio';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#home" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark">✳</span><span>friendly<span className="brand-light">.ai</span></span>
        </a>
        <button className="new-chat" onClick={() => chooseMode('chat')}><span>＋</span> New conversation</button>
        <div className="nav-caption">YOUR SPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {modes.map((mode) => (
            <button key={mode.id} className={`nav-item ${active === mode.id ? 'selected' : ''}`} onClick={() => chooseMode(mode.id)}>
              <span className="nav-icon">{mode.icon}</span>{mode.label}
              {mode.id === 'images' && <span className="soon-tag">BETA</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-spark">✦</div>
            <strong>A little more magic?</strong>
            <p>More ways to learn, create, and explore.</p>
            <button onClick={() => setToast('Premium plans will be available soon.')}>Explore premium <span>↗</span></button>
          </div>
          <button className="profile-row" onClick={() => setToast('Your profile settings are coming soon.')}>
            <span className="avatar">Y</span><span className="profile-name">Your account<small>Free plan</small></span><span className="more">•••</span>
          </button>
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileMenu(true)}>☰</button>
          <div className="breadcrumb"><span>Friendly AI</span><span className="crumb-slash">/</span><strong>{active === 'chat' ? 'Chat' : active === 'study' ? 'Study' : 'Create'}</strong></div>
          <div className="top-actions"><span className="status"><i /> All systems ready</span><button className="install-button" onClick={installApp}>↓ <span>Install app</span></button></div>
        </header>

        {active === 'images' ? (
          <section className="workspace image-workspace">
            <div className="welcome-heading"><div className="eyebrow"><span className="eyebrow-line" /> MAKE SOMETHING LOVELY</div><h1>Your ideas,<br /><span>in full color.</span></h1><p>Describe the picture in your imagination. We’ll help bring the idea to life.</p></div>
            <form className="image-form" onSubmit={makeImage}>
              <label htmlFor="image-prompt">Describe your image</label>
              <textarea id="image-prompt" value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="A tiny bookshop on the moon, warm light in every window..." rows="3" />
              <div className="image-form-bottom"><span>✦ Be as imaginative as you like</span><button type="submit" disabled={!imagePrompt.trim()}>Create preview <span>↗</span></button></div>
            </form>
            {generated ? <div className="generated-card"><div className="art-preview"><div className="art-orb" /><div className="art-hill hill-one" /><div className="art-hill hill-two" /><span className="art-caption">YOUR IDEA, IMAGINED</span></div><div className="generated-meta"><div><strong>{generated}</strong><small>Concept preview · generated locally</small></div><button onClick={() => { navigator.clipboard?.writeText(generated); setToast('Prompt copied.'); window.setTimeout(() => setToast(''), 2000); }}>Copy prompt</button></div></div> : <div className="image-empty"><div className="image-empty-icon">✧</div><strong>Your canvas is waiting</strong><span>Try a prompt above to see a colorful concept preview.</span></div>}
            <div className="fine-print">Image generation is a preview in this starter app. A generation provider is needed for downloadable AI images.</div>
          </section>
        ) : (
          <section className="workspace chat-workspace">
            <div className="welcome-heading"><div className="eyebrow"><span className="eyebrow-line" /> A FRIENDLY PLACE TO BEGIN</div><h1>{active === 'study' ? <>Big ideas,<br /><span>made simple.</span></> : <>Curious minds<br /><span>feel at home.</span></>}</h1><p>{active === 'study' ? 'Learn at your own pace. Ask questions, practice, and make it stick.' : 'A little help, a fresh idea, or just a conversation. I’m here for it.'}</p></div>
            <div className="chat-card">
              <div className="chat-card-head"><div className="assistant-badge">✳</div><div className="assistant-info"><strong>{currentTitle}</strong><span><i /> Ready when you are</span></div><button className="chat-menu" aria-label="More options" onClick={() => setToast('More chat options are coming soon.')}>•••</button></div>
              <div className="conversation" aria-live="polite">
                {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`message-row ${message.role}`}>
                  {message.role === 'assistant' && <div className="mini-avatar">✳</div>}
                  <div className="message-bubble">{message.text}</div>
                  {message.role === 'user' && <div className="mini-user">Y</div>}
                </div>)}
                <div ref={endRef} />
              </div>
              {messages.length === 1 && <div className="suggestions">{prompts[active].map((prompt) => <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}<span>↗</span></button>)}</div>}
              <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
                <input aria-label="Message Friendly AI" value={input} onChange={(event) => setInput(event.target.value)} placeholder={active === 'study' ? 'Ask a question or name a topic...' : 'Message Friendly AI...'} />
                <div className="composer-tools"><span className="composer-hint">Friendly AI can make mistakes. Check important info.</span><button type="submit" aria-label="Send message" disabled={!input.trim()}>↑</button></div>
              </form>
            </div>
            <div className="quick-note"><span>✦</span> A thoughtful space to learn, create, and be curious.</div>
          </section>
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
