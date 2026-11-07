import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

const tools = [
  { id: 'chat', label: 'AI chat', icon: '✳', group: 'Your space' },
  { id: 'study', label: 'Study mode', icon: '▤', group: 'Your space' },
  { id: 'math', label: 'Math solver', icon: '∑', group: 'Learn' },
  { id: 'science', label: 'Science studio', icon: '⚛', group: 'Learn' },
  { id: 'translate', label: 'Translate', icon: '文', group: 'Create' },
  { id: 'writing', label: 'Writing assistant', icon: '✎', group: 'Create' },
  { id: 'coding', label: 'Coding helper', icon: '</>', group: 'Create' },
  { id: 'web', label: 'Web search', icon: '⌕', group: 'Explore' },
  { id: 'documents', label: 'Documents', icon: '▧', group: 'Explore' },
  { id: 'images', label: 'Image studio', icon: '◈', group: 'Create' },
];
const prompts = {
  chat: ['Explain something simply', 'Help me plan my week', 'Write a short story'],
  study: ['Explain photosynthesis', 'Make me a quick quiz', 'Help with my homework'],
  math: ['Solve a linear equation', 'Explain the Pythagorean theorem', 'Give me a trigonometry example'],
  science: ['Explain how the heart works', 'Describe a plant cell diagram', 'Why does the sky look blue?'],
  translate: ['Translate “Good morning” to Hindi', 'Translate a paragraph', 'Explain a phrase in simple words'],
  writing: ['Help me write a polite email', 'Improve this paragraph', 'Draft a school application'],
  coding: ['Explain a JavaScript concept', 'Help me debug my code', 'Show a simple Python example'],
  web: ['What are the latest developments in space?', 'Find current information about climate change'],
  documents: ['Summarize my notes', 'Make revision questions from this text'],
  images: ['A cozy library in the clouds', 'A friendly robot gardener'],
};
const labels = Object.fromEntries(tools.map((tool) => [tool.id, tool.label]));
const initialConversation = () => ({ id: crypto.randomUUID(), title: 'New conversation', messages: [], updatedAt: Date.now() });

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem('friendly-conversations') || '[]');
    return Array.isArray(saved) && saved.length ? saved : [initialConversation()];
  } catch { return [initialConversation()]; }
}
function App() {
  const [active, setActive] = useState('chat');
  const [conversations, setConversations] = useState(loadConversations);
  const [selectedId, setSelectedId] = useState(() => loadConversations()[0]?.id);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('friendly-theme') === 'dark');
  const [grade, setGrade] = useState('Class 10');
  const [board, setBoard] = useState('CBSE');
  const [language, setLanguage] = useState('English');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [imageResult, setImageResult] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const conversation = conversations.find((item) => item.id === selectedId) || conversations[0];
  const messages = conversation?.messages || [];
  const modeName = labels[active];

  useEffect(() => { localStorage.setItem('friendly-conversations', JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem('friendly-theme', dark ? 'dark' : 'light'); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => {
    const onPrompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const groups = useMemo(() => [...new Set(tools.map((tool) => tool.group))], []);
  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 3500); };
  const updateConversation = (id, updater) => setConversations((items) => items.map((item) => item.id === id ? updater(item) : item));
  const newChat = () => {
    const fresh = initialConversation();
    setConversations((items) => [fresh, ...items]); setSelectedId(fresh.id); setActive('chat'); setError(''); setInput(''); setMobileMenu(false);
  };
  const selectTool = (id) => { setActive(id); setMobileMenu(false); setError(''); };
  const removeConversation = (id) => {
    const next = conversations.filter((item) => item.id !== id);
    const kept = next.length ? next : [initialConversation()];
    setConversations(kept);
    if (selectedId === id) setSelectedId(kept[0].id);
    notify('Conversation deleted from this browser.');
  };
  const requestText = (text) => {
    const context = active === 'study' ? `You are a patient tutor for ${grade}, ${board}. Explain in simple language, show steps, and ask a short check-for-understanding question. Reply in ${language}.` :
      active === 'math' ? 'You are a careful math tutor. Solve the problem step by step, explain formulas and verify the result.' :
      active === 'science' ? 'You are a science educator. Explain accurately in accessible language. For diagrams, provide a clear text description and labels; do not claim to render an image.' :
      active === 'translate' ? 'You are a translation and language helper. Translate accurately, preserve tone, and explain ambiguity when useful.' :
      active === 'writing' ? 'You are a thoughtful writing assistant. Produce polished writing that follows the user’s requested audience and style.' :
      active === 'coding' ? 'You are a programming tutor. Explain code clearly, use fenced code blocks, and do not claim you executed code.' :
      active === 'documents' ? 'Answer using the supplied document text. Clearly say when information is not present in the document.' :
      'You are Friendly AI, a helpful and honest assistant. Be clear, friendly, and concise. Use Markdown when useful.';
    if (active === 'web') throw new Error('Live search is not configured yet. Add a search provider before asking for current information; Friendly AI will not invent search results or citations.');
    const attached = active === 'documents' && documentText ? `\n\nDocument text (user-uploaded, limited to 40,000 characters):\n${documentText.slice(0, 40000)}` : '';
    return `${context}\n\n${text}${attached}`;
  };
  const sendMessage = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    setError(''); setInput('');
    const userMessage = { role: 'user', text, createdAt: Date.now() };
    const assistantMessage = { role: 'assistant', text: '', pending: true, createdAt: Date.now() };
    const currentId = conversation.id;
    updateConversation(currentId, (item) => ({ ...item, title: item.messages.length ? item.title : text.slice(0, 40), updatedAt: Date.now(), messages: [...item.messages, userMessage, assistantMessage] }));
    setBusy(true);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const history = [...messages, userMessage].slice(-20).map(({ role, text: content }) => ({ role, content }));
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ messages: history, mode: active, system: requestText(text).replace(text, '').trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      if (!data.reply) throw new Error('The AI provider returned an empty response.');
      updateConversation(currentId, (item) => ({ ...item, updatedAt: Date.now(), messages: item.messages.map((message, index) => index === item.messages.length - 1 ? { ...message, text: data.reply, pending: false } : message) }));
    } catch (reason) {
      if (reason.name !== 'AbortError') {
        const message = reason.message || 'Something went wrong. Please try again.';
        updateConversation(currentId, (item) => ({ ...item, messages: item.messages.slice(0, -1) })); setError(message);
      }
    } finally { setBusy(false); abortRef.current = null; }
  };
  const regenerate = () => {
    if (messages.length < 2) return;
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;
    updateConversation(conversation.id, (item) => ({ ...item, messages: item.messages.slice(0, -1) }));
    window.setTimeout(() => sendMessage(lastUser.text), 0);
  };
  const makeImage = async (event) => {
    event.preventDefault(); if (!imagePrompt.trim() || imageBusy) return;
    setImageBusy(true); setImageResult(''); setError('');
    try {
      const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      if (!data.imageUrl) throw new Error('The image provider did not return an image.');
      setImageResult(data.imageUrl);
    } catch (reason) { setError(reason.message || 'Image generation failed.'); }
    finally { setImageBusy(false); }
  };
  const handleFile = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('This file is larger than 2 MB. Choose a smaller text file.'); return; }
    if (!/\.(txt|md|csv)$/i.test(file.name)) { setError('For now, upload a .txt, .md, or .csv file. PDF parsing is not configured, so no PDF content will be guessed.'); return; }
    setDocumentText(await file.text()); setError(''); notify(`${file.name} loaded in this browser.`); event.target.value = '';
  };
  const installApp = async () => {
    if (!installPrompt) { notify('Open your browser menu and choose “Add to Home screen” to install Friendly AI.'); return; }
    await installPrompt.prompt(); setInstallPrompt(null);
  };
  const copyText = async (text) => { try { await navigator.clipboard.writeText(text); notify('Copied to clipboard.'); } catch { notify('Clipboard access is unavailable in this browser.'); } };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#home" onClick={(event) => event.preventDefault()}><span className="brand-mark">✳</span><span>friendly<span className="brand-light">.ai</span></span></a>
      <button className="new-chat" onClick={newChat}><span>＋</span> New conversation</button>
      <div className="history-title">RECENT CHATS</div>
      <div className="history-list">{conversations.slice(0, 8).map((item) => <div key={item.id} className={`history-item ${selectedId === item.id && ['chat','study','math','science','translate','writing','coding','web','documents'].includes(active) ? 'history-selected' : ''}`}><button onClick={() => { setSelectedId(item.id); setActive('chat'); setMobileMenu(false); }} title={item.title}>{item.title}</button><button className="delete-chat" aria-label={`Delete ${item.title}`} onClick={() => removeConversation(item.id)}>×</button></div>)}</div>
      <div className="nav-caption">YOUR TOOLKIT</div>
      <nav className="nav-list" aria-label="Main navigation">{groups.map((group) => <div key={group}><div className="group-label">{group}</div>{tools.filter((tool) => tool.group === group).map((tool) => <button key={tool.id} className={`nav-item ${active === tool.id ? 'selected' : ''}`} onClick={() => selectTool(tool.id)}><span className="nav-icon">{tool.icon}</span>{tool.label}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><span className="upgrade-spark">✦</span><strong>A little more magic?</strong><p>Premium plans are not enabled yet.</p><button onClick={() => notify('Subscriptions are not configured. No payment has been taken.')}>Explore plans <span>↗</span></button></div><div className="profile-row"><span className="avatar">F</span><span className="profile-name">Guest workspace<small>Saved on this device</small></span><button className="theme-toggle" aria-label="Toggle color theme" onClick={() => setDark((value) => !value)}>{dark ? '☼' : '☾'}</button></div></div>
    </aside>
    {mobileMenu && <button className="scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
    <main className="main-panel">
      <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileMenu(true)}>☰</button><div className="breadcrumb"><span>Friendly AI</span><span className="crumb-slash">/</span><strong>{modeName}</strong></div><div className="top-actions"><span className="status"><i /> {import.meta.env.VITE_APP_STATUS || 'Ready to explore'}</span><button className="install-button" onClick={installApp}>↓ <span>Install app</span></button></div></header>
      <section className="workspace">
        <div className="welcome-heading"><div className="eyebrow"><span className="eyebrow-line" /> {active === 'study' ? 'YOUR FRIENDLY STUDY PARTNER' : active === 'images' ? 'MAKE SOMETHING LOVELY' : 'BIG QUESTIONS. FRIENDLY ANSWERS.'}</div><h1>{active === 'study' ? <>Big ideas,<br/><span>made simple.</span></> : active === 'images' ? <>Your ideas,<br/><span>in full color.</span></> : active === 'math' ? <>Let’s solve it,<br/><span>step by step.</span></> : active === 'science' ? <>Curiosity looks<br/><span>good on you.</span></> : active === 'translate' ? <>Find the right<br/><span>words, anywhere.</span></> : active === 'writing' ? <>Make every word<br/><span>feel just right.</span></> : active === 'coding' ? <>Let’s build<br/><span>something great.</span></> : active === 'web' ? <>Current answers,<br/><span>with real sources.</span></> : active === 'documents' ? <>Your documents,<br/><span>easier to explore.</span></> : <>A little help<br/><span>goes a long way.</span>}</h1><p>{active === 'study' ? 'Patient explanations, practice, and a little encouragement whenever you need it.' : active === 'images' ? 'Describe your vision. Real image generation needs a configured provider.' : `A friendly space for ${modeName.toLowerCase()}, learning, and your next bright idea.`}</p></div>
        {active === 'images' ? <div className="feature-card"><form className="image-form" onSubmit={makeImage}><label htmlFor="image-prompt">Describe your image</label><textarea id="image-prompt" value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="A tiny bookshop on the moon, warm light in every window..." rows="4"/><div className="form-bottom"><span>✦ Your prompt stays in this session</span><button type="submit" disabled={!imagePrompt.trim() || imageBusy}>{imageBusy ? 'Creating…' : 'Generate image'} <span>↗</span></button></div></form>{imageBusy && <div className="loading-note"><span className="spinner"/> Contacting the configured image provider…</div>}{imageResult && <div className="image-result"><img src={imageResult} alt="Generated from your prompt"/><a className="download-link" href={imageResult} download="friendly-ai-image.png">Download image ↓</a></div>}<p className="fine-print">No mock images are shown. Set IMAGE_API_URL and IMAGE_API_KEY on the server to enable generation.</p></div> : <>
          {active === 'study' && <div className="study-options"><label>Class<select value={grade} onChange={(event) => setGrade(event.target.value)}>{Array.from({ length: 7 }, (_, index) => `Class ${index + 6}`).map((value) => <option key={value}>{value}</option>)}</select></label><label>Board<select value={board} onChange={(event) => setBoard(event.target.value)}>{['CBSE', 'UP Board', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Reply language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Hindi</option></select></label></div>}
          {active === 'documents' && <div className="document-upload"><label className="upload-button">＋ Add a text document<input type="file" accept=".txt,.md,.csv,text/plain,text/markdown" onChange={handleFile} hidden/></label><span>{documentText ? `${documentText.length.toLocaleString()} characters ready` : 'TXT, MD, or CSV · max 2 MB · processed in your browser'}</span>{documentText && <button className="text-button" onClick={() => setDocumentText('')}>Remove</button>}</div>}
          {active === 'web' && <div className="notice-card">⌕ Live web search is not connected. Configure a search API to enable current results and source links. This tool will not fabricate citations.</div>}
          <div className="chat-card"><div className="chat-card-head"><div className="assistant-badge">✳</div><div className="assistant-info"><strong>{modeName}</strong><span><i/> {active === 'web' ? 'Search provider not configured' : 'Ready when you are'}</span></div><button className="clear-button" onClick={() => updateConversation(conversation.id, (item) => ({ ...item, messages: [] }))}>Clear chat</button></div>
            <div className="conversation" aria-live="polite">{messages.map((message, index) => <div key={`${message.createdAt}-${index}`} className={`message-row ${message.role}`}><div className={message.role === 'assistant' ? 'mini-avatar' : 'mini-user'}>{message.role === 'assistant' ? '✳' : 'Y'}</div><div className="message-content"><div className="message-bubble">{message.pending ? <span className="typing"><i/><i/><i/></span> : <div className="message-text">{message.text}</div>}</div>{message.role === 'assistant' && !message.pending && <button className="copy-button" onClick={() => copyText(message.text)}>Copy</button>}</div></div>)}{busy && <div className="working-note"><span className="spinner"/> Thinking it through…</div>}<div ref={endRef}/></div>
            {messages.length === 0 && <div className="suggestions">{(prompts[active] || prompts.chat).map((prompt) => <button key={prompt} onClick={() => sendMessage(prompt)}>{prompt}<span>↗</span></button>)}</div>}
            {error && <div className="error-message" role="alert"><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
            <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><textarea aria-label={`Message Friendly AI in ${modeName}`} value={input} onChange={(event) => setInput(event.target.value)} placeholder={active === 'study' ? 'Ask a question or name a topic…' : `Message Friendly AI · ${modeName.toLowerCase()}…`} rows="1" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}/><div className="composer-tools"><span className="composer-hint">AI can make mistakes. Check important information.</span>{busy ? <button type="button" className="stop-button" onClick={() => abortRef.current?.abort()}>Stop</button> : <button type="submit" aria-label="Send message" disabled={!input.trim()} className="send-button">↑</button>}</div></form>
          </div><div className="quick-note"><span>✦</span> A thoughtful space to learn, create, and be curious.</div>
        </>}
      </section>
    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
export default App;
