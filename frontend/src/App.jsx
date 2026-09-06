import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';

const TOOLS = [
  { id: 'compress_image', title: 'Compress Image', desc: 'Reduce file size while preserving quality.', icon: '📉', type: 'client', accept: 'image/*' },
  { id: 'image_to_pdf', title: 'Image to PDF', desc: 'Convert single or multiple images into a perfectly scaled A4 PDF document.', icon: '📄', type: 'client', multiple: true, accept: 'image/*' },
  { id: 'merge_pdf', title: 'Merge PDF', desc: 'Combine multiple PDF files into a single document.', icon: '🔗', type: 'server', multiple: true, accept: 'application/pdf' },
  { id: 'split_pdf', title: 'Split PDF', desc: 'Extract every page of a PDF into separate files.', icon: '✂️', type: 'server', accept: 'application/pdf' },
  { id: 'pdf_to_docx', title: 'PDF to Word', desc: 'Convert PDF documents into editable Word (.docx) files.', icon: '📝', type: 'server', accept: 'application/pdf' },
  { id: 'pdf_to_images', title: 'PDF to Images', desc: 'Extract all pages of a PDF into high-quality images.', icon: '📸', type: 'server', accept: 'application/pdf' },
  { id: 'convert_image', title: 'Image Converter', desc: 'Convert between JPG, PNG, WEBP, and GIF formats.', icon: '🔁', type: 'server', accept: 'image/*' }
];

const BACKEND_URL = "http://localhost:8000";

// --- Starfield Component ---
function Starfield({ theme }) {
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);

  // Keep theme updated without triggering the main useEffect reset
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    const numStars = 200;

    let mouse = { x: null, y: null };
    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        baseVx: (Math.random() - 0.5) * 0.2,
        baseVy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random()
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const starColor = themeRef.current === 'light' ? '0, 0, 0' : '255, 255, 255';
      
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${star.alpha})`;
        ctx.fill();

        if (mouse.x !== null && mouse.y !== null) {
          const dx = star.x - mouse.x;
          const dy = star.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 250;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            star.vx = (dx / distance) * force * 3 + star.baseVx;
            star.vy = (dy / distance) * force * 3 + star.baseVy;
          } else {
            star.vx += (star.baseVx - star.vx) * 0.05;
            star.vy += (star.baseVy - star.vy) * 0.05;
          }
        } else {
          star.vx += (star.baseVx - star.vx) * 0.05;
          star.vy += (star.baseVy - star.vy) * 0.05;
        }

        star.x += star.vx;
        star.y += star.vy;
        star.alpha += (Math.random() - 0.5) * 0.05;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 1) star.alpha = 1;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array so canvas never resets

  return (
    <canvas 
      ref={canvasRef} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none', opacity: 1 }} 
    />
  );
}

// --- Interactive 3D Cube Component ---
function InteractiveCube({ onToggleTheme }) {
  const cubeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cubeRef.current) return;
      const rect = cubeRef.current.getBoundingClientRect();
      // Calculate mouse position relative to center of cube
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      
      // Calculate hue based on distance from center
      const dist = Math.sqrt(x*x + y*y);
      const hue = dist % 360;
      
      // Calculate fill opacity based on distance (0 at 350px away, 1 at center)
      const maxDist = 350;
      let fillOpacity = 0;
      if (dist < maxDist) {
        fillOpacity = Math.pow(1 - (dist / maxDist), 1.5); // Non-linear curve for smoother feel
      }
      
      // Only set dynamic CSS variables, keyframes handle the rest
      cubeRef.current.style.setProperty('--cube-hue', `${hue}deg`);
      cubeRef.current.style.setProperty('--cube-fill-opacity', fillOpacity);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="hero-art-container" onClick={onToggleTheme}>
      <div className="interactive-cube-wrapper">
        <div className="cube interactive" ref={cubeRef} title="Click to toggle theme">
          <div className="face front"></div>
          <div className="face back"></div>
          <div className="face right"></div>
          <div className="face left"></div>
          <div className="face top"></div>
          <div className="face bottom"></div>
        </div>
      </div>
    </div>
  );
}


// --- Toast System ---
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'error' ? '⚠️' : '✨'} {toast.message}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('dark');

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  const handleToggleTheme = (e) => {
    // Save click coordinates for the Black Hole transition
    document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);

    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Trigger View Transitions API if supported
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <>
      <Starfield theme={theme} />
      
      <div className="navbar" onClick={() => setActiveTool(null)}>
        <h1>OmniConvert.</h1>
      </div>
      
      <div className="main-content">
        {!activeTool ? (
          <>
            <div className="hero-container">
              <div className="hero-text">
                <h2>Refined file conversions.</h2>
                <p>Professional grade tools to convert, compress, and manipulate your digital assets. Processed securely and seamlessly.</p>
              </div>
              <InteractiveCube onToggleTheme={handleToggleTheme} />
            </div>
            
            <div className="tool-grid">
              {TOOLS.map(tool => (
                <div key={tool.id} className="tool-card" onClick={() => setActiveTool(tool)}>
                  <div className="tool-icon">{tool.icon}</div>
                  <h3>{tool.title}</h3>
                  <p>{tool.desc}</p>
                  <div className="status-badge">{tool.type === 'client' ? 'Local Compute' : 'Cloud Server'}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <ToolWorkspace tool={activeTool} onBack={() => setActiveTool(null)} addToast={addToast} />
        )}
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}

function ToolWorkspace({ tool, onBack, addToast }) {
  const [files, setFiles] = useState([]);
  const [targetSize, setTargetSize] = useState(100);
  const [targetFormat, setTargetFormat] = useState('PNG');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultFilename, setResultFilename] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFiles = (incomingFiles) => {
    const validFiles = [];
    for (let f of incomingFiles) {
      if (tool.accept === 'image/*' && !f.type.startsWith('image/')) { addToast(`Invalid file type: ${f.name} is not an image.`); continue; }
      if (tool.accept === 'application/pdf' && f.type !== 'application/pdf') { addToast(`Invalid file type: ${f.name} is not a PDF.`); continue; }
      validFiles.push(f);
    }
    if (!tool.multiple && files.length + validFiles.length > 1) {
      addToast("This tool only accepts a single file.");
      return validFiles.slice(0, 1 - files.length); 
    }
    return validFiles;
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateFiles(Array.from(e.dataTransfer.files));
      if (valid.length > 0) handleFiles(valid);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateFiles(Array.from(e.target.files));
      if (valid.length > 0) handleFiles(valid);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFiles = (newFiles) => {
    if (tool.multiple) setFiles(prev => [...prev, ...newFiles]);
    else setFiles([newFiles[0]]);
    setResultUrl(null); setProgress(0);
  };

  const removeFile = (index) => {
    const newFiles = [...files]; newFiles.splice(index, 1); setFiles(newFiles);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // CLIENT SIDE
  const processImageToPDF = async () => {
    try {
      if (files.length === 0) return;
      setProgress(10);
      let pdf;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject("Failed to read file");
          reader.readAsDataURL(file);
        });
        const img = new Image(); img.src = imgData;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject("Failed to load image data"); });

        const orientation = img.width > img.height ? 'landscape' : 'portrait';
        if (i === 0) pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation });
        else { pdf.addPage('a4', orientation); pdf.setPage(i + 1); }

        const ratio = Math.min(pdf.internal.pageSize.getWidth() / img.width, pdf.internal.pageSize.getHeight() / img.height);
        const imgScaledWidth = img.width * ratio; const imgScaledHeight = img.height * ratio;
        const xOffset = (pdf.internal.pageSize.getWidth() - imgScaledWidth) / 2;
        const yOffset = (pdf.internal.pageSize.getHeight() - imgScaledHeight) / 2;

        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgScaledWidth, imgScaledHeight);
        setProgress(10 + Math.floor(((i + 1) / files.length) * 80));
      }
      const pdfBlob = pdf.output('blob');
      setResultFilename(files.length > 1 ? 'combined_images.pdf' : files[0].name.substring(0, files[0].name.lastIndexOf('.')) + '.pdf');
      setResultUrl(URL.createObjectURL(pdfBlob));
      addToast(`Successfully converted ${files.length} image(s) to PDF`, "success");
      setProgress(100);
    } catch (error) { console.error(error); addToast("Failed to process Image to PDF."); } 
    finally { setIsProcessing(false); }
  };

  const processImageCompression = async () => {
    try {
      const file = files[0];
      const compressedFile = await imageCompression(file, { maxSizeMB: targetSize / 1024, useWebWorker: true, onProgress: (p) => setProgress(p) });
      const ext = compressedFile.name.substring(compressedFile.name.lastIndexOf('.'));
      setResultFilename(file.name.substring(0, file.name.lastIndexOf('.')) + '_compressed' + ext);
      setResultUrl(URL.createObjectURL(compressedFile));
      addToast("Successfully compressed image", "success");
    } catch (error) { console.error(error); addToast("Error compressing image."); } 
    finally { setIsProcessing(false); }
  };

  // SERVER SIDE
  const runServerTask = async (endpoint, formData, filename) => {
    try {
      setProgress(30);
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { method: 'POST', body: formData });
      setProgress(70);
      if (!res.ok) {
        let errMsg = "Backend error";
        try { const errData = await res.json(); if (errData.detail) errMsg = errData.detail; } 
        catch(e) { errMsg = await res.text() || errMsg; }
        throw new Error(errMsg);
      }
      setResultUrl(URL.createObjectURL(await res.blob()));
      setResultFilename(filename);
      addToast("Process completed successfully", "success");
      setProgress(100);
    } catch (error) { console.error(error); addToast(error.message || "Error communicating with server."); } 
    finally { setIsProcessing(false); }
  };

  const handleProcess = () => {
    if (files.length === 0) return;
    if (tool.id === 'merge_pdf' && files.length < 2) { addToast("Please add at least 2 PDFs to merge."); return; }
    setIsProcessing(true); setProgress(0); setResultUrl(null);
    const formData = new FormData();
    if (tool.id === 'compress_image') processImageCompression();
    else if (tool.id === 'image_to_pdf') processImageToPDF();
    else if (tool.id === 'merge_pdf') { files.forEach(f => formData.append("files", f)); runServerTask('/merge_pdf', formData, "merged_document.pdf"); }
    else if (tool.id === 'split_pdf') { formData.append("file", files[0]); runServerTask('/split_pdf', formData, "split_pages.zip"); }
    else if (tool.id === 'pdf_to_docx') { formData.append("file", files[0]); runServerTask('/pdf_to_docx', formData, "converted_document.docx"); }
    else if (tool.id === 'pdf_to_images') { formData.append("file", files[0]); runServerTask('/pdf_to_images', formData, "pdf_images.zip"); }
    else if (tool.id === 'convert_image') { formData.append("file", files[0]); formData.append("target_format", targetFormat); runServerTask('/convert_image', formData, `converted_image.${targetFormat.toLowerCase()}`); }
  };

  return (
    <div className="workspace-container">
      <div className="back-btn" onClick={onBack}>← Back to tools</div>
      <div className="workspace-header"><h2>{tool.title}</h2><p>{tool.desc}</p></div>

      <div className="workspace-panel">
        {files.length === 0 || tool.multiple ? (
          <div className={`upload-area ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
            <h3>{tool.multiple && files.length > 0 ? "Add another file" : "Select a file"}</h3>
            <p>or drag and drop here</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple={tool.multiple} accept={tool.accept} />
          </div>
        ) : null}

        {files.length > 0 && (
          <div className="file-list" style={{ marginTop: tool.multiple ? '2rem' : '0' }}>
            {files.map((f, i) => (
              <div className="file-info" key={i}>
                <div className="file-details"><div className="file-name">{f.name}</div><div className="file-size">{formatSize(f.size)}</div></div>
                <button className="btn btn-danger" onClick={() => removeFile(i)} disabled={isProcessing}>Remove</button>
              </div>
            ))}
            {tool.id === 'compress_image' && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}><label>Target File Size (KB)</label><input type="number" value={targetSize} onChange={(e) => setTargetSize(Number(e.target.value))} min="1" disabled={isProcessing} /><p className="note" style={{ marginTop: '0.5rem' }}>Lossless formats (PNG) may be converted or resized to achieve target size.</p></div>
            )}
            {tool.id === 'convert_image' && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}><label>Convert To</label><select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} disabled={isProcessing}><option value="PNG">PNG</option><option value="JPEG">JPEG</option><option value="WEBP">WEBP</option><option value="GIF">GIF</option></select></div>
            )}
            {isProcessing && (
              <div className="progress-container" style={{ marginTop: '2rem' }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div><div className="progress-text">{progress > 0 ? `${progress.toFixed(0)}%` : 'Processing...'}</div></div>
            )}
            <div style={{ marginTop: '2.5rem' }}>
              {!resultUrl ? (
                <button className="btn" onClick={handleProcess} disabled={isProcessing || (tool.id === 'merge_pdf' && files.length < 2)}>{isProcessing ? 'Processing...' : 'Run Tool'}</button>
              ) : (
                <a href={resultUrl} download={resultFilename} className="btn" style={{ background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' }}>Download {resultFilename}</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
