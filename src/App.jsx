import { useState } from 'react';
import axios from 'axios';
import HeartViewer from './HeartViewer';
import { Heart, Upload, Activity, Server, AlertCircle } from 'lucide-react';

function App() {
  const [backendUrl, setBackendUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!file || !backendUrl) {
      setError("Please provide both the Backend URL and a valid .nii.gz file.");
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Remove trailing slash if user added it
      const cleanUrl = backendUrl.replace(/\/$/, "");
      
      // Send Request
      const response = await axios.post(`${cleanUrl}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Connection Failed. 1. Check if Colab is running. 2. Verify URL. 3. Ensure file is .nii.gz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
          <div style={{ background: '#ff4444', padding: '10px', borderRadius: '50%', display: 'flex' }}>
            <Heart color="white" size={28} fill="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>CardiRegen 3D</h1>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Automated Cardiac MRI Analysis System</span>
          </div>
        </header>

        {/* 1. Connection Setup */}
        <section style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
            <Server size={18} color="#007bff"/> Server Connection
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
            Paste the <b>ngrok URL</b> from your Google Colab here:
          </p>
          <input 
            type="text" 
            placeholder="e.g. https://flexile-irresistible-arnold.ngrok-free.dev" 
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem' }}
          />
        </section>

        {/* 2. Upload Section */}
        <section style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', background: '#fafafa' }}>
            <Upload size={48} color="#aaa" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 5px 0', color: '#444' }}>Upload Cardiac MRI</h3>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Supported Format: <b>.nii.gz</b></p>
            
            <input 
              type="file" 
              accept=".nii,.gz"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ marginTop: '15px' }}
            />
            
            {file && (
              <div style={{ marginTop: '15px', color: '#2e7d32', fontWeight: 'bold' }}>
                Selected: {file.name}
              </div>
            )}
          </div>

          {error && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={loading || !file}
            style={{
              marginTop: '20px', 
              padding: '14px 30px', 
              background: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? "Processing on GPU..." : "Run AI Analysis"}
          </button>
        </section>

        {/* 3. Results Section */}
        {result && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Metrics Card */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <Activity size={24} color="#007bff"/> Clinical Metrics
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div style={{ padding: '15px', background: '#f1f8e9', borderRadius: '8px', borderLeft: '4px solid #7cb342' }}>
                  <small style={{ color: '#558b2f', fontWeight: 'bold' }}>LEFT VENTRICLE (LV) VOLUME</small>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#33691e' }}>{result.lv_volume_ml} ml</div>
                </div>

                <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1e88e5' }}>
                  <small style={{ color: '#1565c0', fontWeight: 'bold' }}>RIGHT VENTRICLE (RV) VOLUME</small>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0d47a1' }}>{result.rv_volume_ml} ml</div>
                </div>
              </div>
            </div>

            {/* 3D Model Card */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>Interactive 3D Reconstruction</h3>
              {result.mesh_obj ? (
                <HeartViewer objData={result.mesh_obj} />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: '#f5f5f5', borderRadius: '8px' }}>
                  No 3D mesh generated (Volume too small or empty mask).
                </div>
              )}
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
                Click & Drag to Rotate | Scroll to Zoom
              </p>
            </div>

          </section>
        )}
      </div>
    </div>
  );
}

export default App;