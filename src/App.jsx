import { useState, useRef } from 'react';
import axios from 'axios';
import HeartViewer from './HeartViewer';
import { Heart, Upload, Server, AlertCircle, FileText, Activity, X } from 'lucide-react';

function App() {
  // The Connection State
  const [backendUrl, setBackendUrl] = useState('');
  
  // The File States
  const [fileED, setFileED] = useState(null);
  const [fileES, setFileES] = useState(null);
  
  // Refs to control the file inputs (needed to clear them)
  const edInputRef = useRef(null);
  const esInputRef = useRef(null);
  
  // Processing States
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  // Results State
  const [results, setResults] = useState({
    ed: null, // Stores volume & mesh for ED (End Diastolic)
    es: null, // Stores volume & mesh for ES (End Systolic)
    ef: null  // Calculated EF (Ejection Fraction)
  });

  // --- Helper Functions ---

  // Calling the API for a single file
  const processFile = async (file, url) => {
    const formData = new FormData();
    formData.append('file', file);
    const cleanUrl = url.replace(/\/$/, "");
    const res = await axios.post(`${cleanUrl}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  // Clear ED (End Diastolic) File
  const clearFileED = () => {
    setFileED(null);
    if (edInputRef.current) edInputRef.current.value = ""; // Reset the input value
  };

  // Clear ES (End Systolic) File
  const clearFileES = () => {
    setFileES(null);
    if (esInputRef.current) esInputRef.current.value = ""; // Reset the input value
  };

  const handleAnalyze = async () => {
    if (!backendUrl) {
      setError("Please enter the Server URL.");
      return;
    }
    if (!fileED && !fileES) {
      setError("Please upload at least one MRI file.");
      return;
    }

    setLoading(true);
    setError('');
    setStatusMsg('Initializing analysis...');
    
    // Temp storage
    let newResults = { ...results, ef: null };

    try {
      // 1. Process ED (End Diastolic) Frame
      if (fileED) {
        setStatusMsg(`Processing ED Frame: ${fileED.name}...`);
        const dataED = await processFile(fileED, backendUrl);
        newResults.ed = { ...dataED, filename: fileED.name };
      }

      // 2. Process ES (End Systolic) Frame
      if (fileES) {
        setStatusMsg(`Processing ES Frame: ${fileES.name}...`);
        const dataES = await processFile(fileES, backendUrl);
        newResults.es = { ...dataES, filename: fileES.name };
      }

      // 3. Calculate EF (Ejection Fraction) if both exist
      if (newResults.ed && newResults.es) {
        const edv = newResults.ed.lv_volume_ml;
        const esv = newResults.es.lv_volume_ml;
        const ef = ((edv - esv) / edv) * 100;
        newResults.ef = ef.toFixed(2);
      }

      setResults(newResults);
      setStatusMsg('');

    } catch (err) {
      console.error(err);
      setError("Analysis Failed. Check your URL and if the Colab is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      
      {/* --- LEFT SIDEBAR (Controls & Data) --- */}
      <div style={{ width: '400px', background: '#f8f9fa', borderRight: '1px solid #e9ecef', padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div style={{ background: '#ff4444', padding: '8px', borderRadius: '8px' }}>
            <Heart color="white" size={24} fill="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#212529' }}>CardiRegen 3D</h1>
        </div>

        {/* 1. Connection */}
        <section style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
          <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', color: '#495057' }}>
            <Server size={16} /> Server Connection
          </h3>
          <input 
            type="text" 
            placeholder="Paste ngrok URL here..." 
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            style={{ width: '94%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.8rem', height: '36px' }}
          />
        </section>

        {/* 2. Uploads */}
        <section style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
          <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', color: '#495057' }}>
            <Upload size={16} /> Patient Data Upload
          </h3>
          
          {/* ED Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#333' }}>
              Upload End-Diastole (ED) Frame
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                ref={edInputRef} 
                type="file" 
                accept=".nii,.gz" 
                onChange={(e) => setFileED(e.target.files[0])} 
                style={{ fontSize: '0.8rem', width: '100%' }} 
              />
              <span style={{ fontSize: '0.75rem', color: '#868e96', whiteSpace: 'nowrap' }}>Supported: .nii.gz</span>
            </div>
            
            {/* Selected File Display + Remove Icon */}
            {fileED && (
              <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#2f9e44', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span>Selected: {fileED.name}</span>
                 <X 
                    size={14} 
                    color="#dc2626" 
                    style={{ cursor: 'pointer', background: '#fee2e2', borderRadius: '50%', padding: '2px' }} 
                    onClick={clearFileED} 
                    title="Remove file"
                 />
              </div>
            )}
          </div>

          {/* ES Input */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px', color: '#333' }}>
              Upload End-Systole (ES) Frame
            </label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                ref={esInputRef}
                type="file" 
                accept=".nii,.gz" 
                onChange={(e) => setFileES(e.target.files[0])} 
                style={{ fontSize: '0.8rem', width: '100%' }} 
              />
              <span style={{ fontSize: '0.75rem', color: '#868e96', whiteSpace: 'nowrap' }}>Supported: .nii.gz</span>
            </div>
            
            {/* Selected File Display + Remove Icon */}
            {fileES && (
              <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#2f9e44', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span>Selected: {fileES.name}</span>
                 <X 
                    size={14} 
                    color="#dc2626" 
                    style={{ cursor: 'pointer', background: '#fee2e2', borderRadius: '50%', padding: '2px' }} 
                    onClick={clearFileES} 
                    title="Remove file"
                 />
              </div>
            )}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: '100%', marginTop: '25px', padding: '12px', background: loading ? '#adb5bd' : '#228be6', 
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? statusMsg : "Run Full Analysis"}
          </button>
          
          {error && <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#fa5252', display: 'flex', gap: '5px' }}><AlertCircle size={14}/> {error}</div>}
        </section>

        {/* 3. Detailed Results */}
        {(results.ed || results.es) && (
          <section style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #dee2e6', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', color: '#495057' }}>
              <FileText size={16} /> Clinical Report
            </h3>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#333', lineHeight: '1.6' }}>
              <div>--- Analyzing Patient Data ---</div>
              
              {results.ed && (
                <>
                  <div>ED Frame: {results.ed.filename}</div>
                  <div style={{ color: '#2f9e44' }}>{'->'} ED Volume (LV): {results.ed.lv_volume_ml} ml</div>
                </>
              )}
              
              <div style={{ margin: '10px 0', borderBottom: '1px dashed #ccc' }}></div>
              
              {results.es && (
                <>
                  <div>ES Frame: {results.es.filename}</div>
                  <div style={{ color: '#1971c2' }}>{'->'} ES Volume (LV): {results.es.lv_volume_ml} ml</div>
                </>
              )}
              
              <div style={{ margin: '15px 0' }}></div>
              
              {results.ef ? (
                <div style={{ background: '#fff9db', padding: '10px', borderRadius: '4px', border: '1px solid #fcc419' }}>
                  <div style={{ fontWeight: 'bold' }}>{">>>"} Calculated Ejection Fraction (EF):</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e67700' }}>{results.ef}%</div>
                </div>
              ) : (
                <div style={{ color: '#868e96', fontStyle: 'italic' }}>
                  * Upload both frames to calculate EF
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* --- RIGHT SIDE (Main 3D Viewer) --- */}
      <div style={{ flex: 1, background: '#101010', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        
        {/* Viewer Area */}
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          {results.ed?.mesh_obj || results.es?.mesh_obj ? (
            <HeartViewer objData={results.ed?.mesh_obj || results.es?.mesh_obj} />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
              <Activity size={64} style={{ opacity: 0.2 }} />
              <p style={{ marginTop: '20px', fontWeight: '500' }}>3D Model Viewport</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Upload data to generate reconstruction</p>
            </div>
          )}
        </div>

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', padding: '10px 15px', borderRadius: '20px', color: 'white', backdropFilter: 'blur(5px)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '10px', height: '10px', background: '#ff4444', borderRadius: '50%' }}></div>
             Left Ventricle 3D Mesh
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;