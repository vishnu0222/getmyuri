import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../styles/customizeLink.css';
import { FaCopy, FaEllipsisV, FaEye, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { debounce } from 'lodash';
import { copyToClipboard } from '../utils/clipboard';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

function MapComponent({ location, userLocation, setLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (location.position) {
      map.setView(location.position, 13);
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }
  }, [map, location.position, userLocation]);

  return location.position ? (
    <>
      <Marker 
        position={location.position}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setLocation(prev => ({
              ...prev,
              position: [position.lat, position.lng]
            }));
          },
        }}
      />
      <Circle
        center={location.position}
        radius={location.unit === 'miles' ? location.radius * 1609.34 : location.radius * 0.3048}
        pathOptions={{ color: '#E94444' }}
      />
    </>
  ) : null;
}

function StatsPanel() {
  const [activeOptionsIndex, setActiveOptionsIndex] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://www.getmyuri.com/api/links/click-stats?username=admin');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load stats');
        setStats([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleCopy = async (alias) => {
    const url = `http://www.getmyuri.com/r/${alias}`;
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Link copied to clipboard!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      toast.error('Failed to copy link', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleView = (alias) => {
    window.open(`https://getmyuri.com/r/${alias}`, '_blank');
  };

  const handleEdit = (alias) => {
    // Handle edit action
    console.log('Edit:', alias);
  };

  const handleDelete = (alias) => {
    // Handle delete action
    console.log('Delete:', alias);
  };

  const handleOptionsClick = (index) => {
    setActiveOptionsIndex(activeOptionsIndex === index ? null : index);
  };

  const handleBackdropClick = () => {
    setActiveOptionsIndex(null);
  };

  return (
    <div className="stats-container">
      {activeOptionsIndex !== null && (
        <div className="options-overlay-backdrop" onClick={handleBackdropClick} />
      )}
      {loading ? (
        <div className="stats-loading">Loading...</div>
      ) : error ? (
        <div className="stats-error">{error}</div>
      ) : stats.length === 0 ? (
        <div className="stats-empty">No links generated</div>
      ) : (
        stats.slice(0, 6).map((item, index) => (
          <div key={item.id} className="stats-item">
            <button 
              className="copy-btn" 
              onClick={() => handleCopy(item.alias)}
              title="Copy URL"
            >
              <FaCopy />
            </button>
            <span className="url">{`getmyuri.com/r/${item.alias}`}</span>
            <div className="views">
              <span className="views-count">{item.clickCount}</span>
              <span>views</span>
            </div>
            <button 
              className="options-btn" 
              title="More options"
              onClick={() => handleOptionsClick(index)}
            >
              <FaEllipsisV />
            </button>
            {activeOptionsIndex === index && (
              <div className="options-overlay">
                <button onClick={() => handleView(item.alias)}>
                  <FaEye />
                  View
                </button>
                <button onClick={() => handleEdit(item.alias)}>
                  <FaPencilAlt />
                  Edit
                </button>
                <button onClick={() => handleDelete(item.alias)}>
                  <FaTrash />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function CustomizeLink() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { logout } = useAuth();
  // Mode state: 'automatic' or 'manual'
  const [mode, setMode] = useState('manual');

  // Manual mode states (copied from Home.js logic)
  const [manualUrl, setManualUrl] = useState('');
  const [manualUrlError, setManualUrlError] = useState('');
  const [manualShortUrl, setManualShortUrl] = useState('');
  const [manualIsLoading, setManualIsLoading] = useState(false);

  // Start time states
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('12');
  const [startMinute, setStartMinute] = useState('00');
  const [startAmPm, setStartAmPm] = useState('AM');

  const [linkDestination, setLinkDestination] = useState('');
  const [linkError, setLinkError] = useState('');
  const [aliases, setAliases] = useState(['']); // Array of aliases
  const [password, setPassword] = useState('');
  const [expirationHour, setExpirationHour] = useState('12');
  const [expirationMinute, setExpirationMinute] = useState('00');
  const [expirationAmPm, setExpirationAmPm] = useState('AM');
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationError, setExpirationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showLocationControls, setShowLocationControls] = useState(false);

  // Expiration fields for manual (advanced) mode
  const [expMonths, setExpMonths] = useState('0');
  const [expDays, setExpDays] = useState('0');
  const [expHours, setExpHours] = useState('0');
  const [expMinutes, setExpMinutes] = useState('0');
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');

  // Single loading and status state
  const [aliasCheckLoading, setAliasCheckLoading] = useState(false);
  const [aliasStatus, setAliasStatus] = useState(null);

  // Add state for generated link
  const [generatedLink, setGeneratedLink] = useState('');

  // Convert local time to MDT Unix timestamp and subtract 6 hours
  const getStartTimeMDT = () => {
    let timestamp;
    
    if (!startDate) {
      // If no date selected, use current time
      timestamp = Date.now();
    } else {
      // Parse the selected date and time
      const [year, month, day] = startDate.split('-').map(Number);
      let hours = parseInt(startHour);
      if (startAmPm === 'PM' && hours !== 12) hours += 12;
      if (startAmPm === 'AM' && hours === 12) hours = 0;

      // Create date in local timezone
      const date = new Date(year, month - 1, day, hours, parseInt(startMinute));
      timestamp = date.getTime();
    }

    // Subtract 6 hours (6 * 60 * 60 * 1000 milliseconds)
    return timestamp - (6 * 60 * 60 * 1000);
  };

  // Function to handle copying the generated link
  const handleCopyGeneratedLink = async () => {
    const success = await copyToClipboard(generatedLink);
    if (success) {
      toast.success('Link copied to clipboard!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      toast.error('Failed to copy link', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  // Function to normalize URL only if no protocol exists
  const normalizeUrl = (url) => {
    if (!url) return 'http://';
    if (url.startsWith('https://')) {
      return 'http://' + url.substring(8);
    }
    if (!url.startsWith('http://')) {
      return 'http://' + url;
    }
    return url;
  };

  // Basic URL validation (only used in automatic mode)
  const isValidUrl = (url) => {
    try {
      new URL(normalizeUrl(url));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Debounced alias existence check with 1 second delay
  const checkAliasExistence = useCallback(
    debounce(async (aliases) => {
      // Filter out empty aliases and join with '/'
      const validAliases = aliases.filter(a => a.length >= 3);
      if (validAliases.length === 0) {
        setAliasStatus(null);
        return;
      }

      const compoundAlias = validAliases.join('/');
      setAliasCheckLoading(true);

      try {
        const response = await fetch(`http://www.getmyuri.com/api/links/exists?aliasPath=${compoundAlias}`);
        if (!response.ok) throw new Error('Failed to check alias');
        const exists = await response.json();
        
        setAliasStatus({
          exists,
          message: exists 
            ? `The alias "${compoundAlias}" is already taken` 
            : `The alias "${compoundAlias}" is available`
        });
      } catch (err) {
        console.error('Error checking alias:', err);
        setAliasStatus(null);
      } finally {
        setAliasCheckLoading(false);
      }
    }, 1000),
    []
  );

  const validateExpirationDateTime = (date, hour, minute, ampm) => {
    if (!date) return '';

    // Get current time in MST using timezone string
    const now = new Date();
    const currentMST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    
    // Parse the input date string (which is in YYYY-MM-DD format)
    const [year, month, day] = date.split('-').map(Number);
    
    // Convert hour to 24-hour format
    let hours = parseInt(hour);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    // Create expiration date in MST
    const expirationDate = new Date(year, month - 1, day, hours, parseInt(minute));
    const expirationMST = new Date(expirationDate.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    
    // Compare timestamps
    if (expirationMST.getTime() <= currentMST.getTime()) {
      return 'Expiration date and time must be in the future (MST)';
    }
    
    return '';
  };

  const getCurrentTime = () => {
    // Get current time in MST using timezone string
    const now = new Date();
    const mstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    
    let hours = mstNow.getHours();
    let minutes = mstNow.getMinutes();
    let ampm = 'AM';

    // Convert to 12-hour format
    if (hours >= 12) {
      ampm = 'PM';
      hours = hours === 12 ? 12 : hours - 12;
    } else if (hours === 0) {
      hours = 12;
    }

    // No longer rounding to nearest 5 minutes
    return {
      hour: hours.toString().padStart(2, '0'),
      minute: minutes.toString().padStart(2, '0'),
      ampm
    };
  };

  const getMSTDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { timeZone: 'America/Denver' }).split('/').join('-');
  };

  useEffect(() => {
    // Set initial time to current time rounded to next 5 minutes
    const { hour, minute, ampm } = getCurrentTime();
    setExpirationHour(hour);
    setExpirationMinute(minute);
    setExpirationAmPm(ampm);

    // Check location permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          if (permissionStatus.state === 'granted') {
            setShowLocationControls(true);
          }
          permissionStatus.onchange = () => {
            setShowLocationControls(permissionStatus.state === 'granted');
          };
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    logout();
    navigate('/');
  };

  const validateAlias = (value) => {
    if (value.length < 3) {
      return 'Alias must be at least 3 characters long';
    }
    if (['api', 'r', 'auth'].includes(value)) {
      return 'Cannot use restricted words: api, r, auth';
    }
    return '';
  };

  const handleAliasChange = (value, index) => {
    const validationError = validateAlias(value);
    const newAliases = [...aliases];
    newAliases[index] = value;
    setAliases(newAliases);
    setError(validationError);

    if (!validationError) {
      checkAliasExistence(newAliases);
    }
  };

  const addAlias = () => {
    const lastAlias = aliases[aliases.length - 1];
    const validationError = validateAlias(lastAlias);
    if (!validationError) {
      setAliases([...aliases, '']);
      setError('');
    } else {
      setError('Please fix the current alias before adding a new one');
    }
  };

  const removeAlias = (index) => {
    if (aliases.length > 1) {
      const newAliases = aliases.filter((_, i) => i !== index);
      setAliases(newAliases);
      setError('');
      
      // Recheck remaining aliases
      if (newAliases.some(a => a.length >= 3)) {
        checkAliasExistence(newAliases);
      }
    }
  };

  const handleLocationClick = async () => {
    setIsLocationLoading(true);
    setLocationError('');
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      setLocation({
        lat: position.coords.latitude,
        long: position.coords.longitude
      });
      setShowLocationControls(true);
    } catch (error) {
      setLocationError('Failed to get location. Please enable location access in your browser settings.');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleDeleteLocation = () => {
    setLocation(null);
    setShowLocationControls(false);
  };

  const handleEditLocation = () => {
    setShowLocationControls(false);
    handleLocationClick();
  };

  // Function to reset form to initial state
  const resetForm = () => {
    setLinkDestination('');
    setAliases(['']);
    setPassword('');
    setStartDate('');
    setStartHour('12');
    setStartMinute('00');
    setStartAmPm('AM');
    setExpMonths('0');
    setExpDays('0');
    setExpHours('0');
    setExpMinutes('0');
    setLocation(null);
    setError('');
    setAliasStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setManualSuccess('');
    setManualError('');
    setGeneratedLink(''); // Reset generated link
    
    // Only check if URL is not empty
    if (!linkDestination.trim()) {
      setManualError('Please enter a destination URL');
      return;
    }

    // Check if any alias is already taken
    if (aliasStatus?.exists) {
      setManualError('One or more aliases are already taken');
      return;
    }

    // Build expiresAt string
    let expiresAt = '';
    if (expMonths !== '0' && expMonths !== '') expiresAt += `${expMonths}M`;
    if (expDays !== '0' && expDays !== '') expiresAt += `${expDays}d`;
    if (expHours !== '0' && expHours !== '') expiresAt += `${expHours}h`;
    if (expMinutes !== '0' && expMinutes !== '') expiresAt += `${expMinutes}m`;
    if (expiresAt === '') {
      expiresAt = '6M';
    }

    // Get start time in MDT
    const startTime = getStartTimeMDT();

    // Combine all valid aliases
    const validAliases = aliases.filter(a => a && a.trim().length >= 3);
    if (validAliases.length === 0) {
      setManualError('Please enter at least one valid alias (minimum 3 characters)');
      return;
    }
    const combinedAlias = validAliases.join('/');
    
    // Location (optional)
    let locationObj = undefined;
    let radiusMeters = undefined;
    if (location) {
      locationObj = {
        type: 'Point',
        coordinates: [location.long, location.lat] // [lng, lat]
      };
      radiusMeters = 'miles';
    }

    // Normalize URL only if no protocol exists
    const normalizedUrl = normalizeUrl(linkDestination.trim());

    // Build payload with the normalized URL
    const payload = {
      alias: combinedAlias,
      link: normalizedUrl,
      username: 'admin',
      location: locationObj,
      radius: radiusMeters,
      startTime,
      expiresAt,
    };
    if (password) payload.password = password;

    // Remove undefined fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      const response = await fetch('http://www.getmyuri.com/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create link');
      
      // Set the generated link with combined alias
      const generatedUrl = `http://www.getmyuri.com/r/${combinedAlias}`;
      setGeneratedLink(generatedUrl);
      
      setManualSuccess('Link created successfully!');
      toast.success('Link created successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Reset form after successful link generation
      resetForm();
    } catch (err) {
      setManualError('Failed to create link. Please try again.');
      toast.error('Failed to create link. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  // Manual mode helpers
  const handleManualGenerateLink = async (e) => {
    e.preventDefault();
    setManualUrlError('');
    setManualShortUrl('');
    if (!manualUrl.trim()) {
      setManualUrlError('Please enter a URL');
      return;
    }
    if (!isValidUrl(manualUrl)) {
      setManualUrlError('Please enter a valid URL');
      return;
    }
    setManualIsLoading(true);
    try {
      const normalized = normalizeUrl(manualUrl);
      const response = await fetch('http://www.getmyuri.com/api/default/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: normalized }),
      });
      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }
      const data = await response.json();
      setManualShortUrl(`http://www.getmyuri.com/r/${data.shortUrl}`);
    } catch (err) {
      setManualUrlError('Failed to shorten URL. Please try again.');
      console.error('Error:', err);
    } finally {
      setManualIsLoading(false);
    }
  };
  const handleManualCopy = async () => {
    const success = await copyToClipboard(manualShortUrl);
    if (success) {
      toast.success('Link copied to clipboard!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      toast.error('Failed to copy link', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const [copied, setCopied] = useState(false);

  return (
    <div className="app-container">
      <nav className="main-nav">
        <span className="brand-title">
          <span className="brand-get">GET</span>
          <span className="brand-myurl">MYURI</span>
        </span>
        <div className="nav-links">
          <button className="contact-btn" onClick={() => navigate('/contact')}>Contact Us</button>
          <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="content-container" style={{ background: '#fff', minHeight: '100vh', paddingBottom: '2rem' }}>
        <div className="customize-container" style={{ background: '#fff', boxShadow: 'none', marginBottom: 0 }}>
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-pill${mode === 'manual' ? ' selected' : ''}`}
              onClick={() => setMode('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              className={`mode-pill${mode === 'automatic' ? ' selected' : ''}`}
              onClick={() => setMode('automatic')}
            >
              Automatic
            </button>
          </div>

          {/* Conditional UI */}
          {mode === 'manual' ? (
            // Manual mode: advanced CustomizeLink UI
            <div className="customize-form" style={{ background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Link Destination</label>
                  <input
                    type="text"
                    value={linkDestination}
                    onChange={(e) => setLinkDestination(e.target.value)}
                    placeholder="Enter URL"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Custom Alias (optional)</label>
                  <div className="alias-container">
                    <div className="base-url">
                      <input
                        type="text"
                        value="getmyuri.com/r"
                        disabled
                        className="base-url-input"
                      />
                    </div>
                    {aliases.map((alias, index) => (
                      <div key={index} className="alias-input-wrapper">
                        <input
                          type="text"
                          value={alias}
                          onChange={(e) => handleAliasChange(e.target.value, index)}
                          placeholder="Enter alias (min. 3 characters)"
                          className={`alias-input ${aliasStatus?.exists ? 'error-input' : ''}`}
                        />
                        {index === aliases.length - 1 ? (
                          <button
                            type="button"
                            className="add-alias-btn"
                            onClick={addAlias}
                            disabled={!!error || !alias}
                          >
                            +
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="remove-alias-btn"
                            onClick={() => removeAlias(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="alias-status-container">
                      {aliasCheckLoading ? (
                        <span className="alias-loading">Checking availability...</span>
                      ) : (
                        aliasStatus && (
                          <span className={`alias-status ${aliasStatus.exists ? 'error-message' : 'success-message'}`}>
                            {aliasStatus.message}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  {error && <div className="error-message">{error}</div>}
                </div>

                <div className="form-group">
                  <label>Password (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set password for link"
                  />
                </div>

                <div className="form-group">
                  <label>Start Time (optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width: '150px' }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      style={{ width: '60px' }}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value.padStart(2, '0'))}
                      style={{ width: '60px' }}
                    />
                    <select
                      value={startAmPm}
                      onChange={(e) => setStartAmPm(e.target.value)}
                      style={{ width: '70px' }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <span style={{ marginLeft: '10px' }}>(MDT)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Expiration (optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min="0"
                      value={expMonths}
                      onChange={e => setExpMonths(e.target.value)}
                      placeholder="Months"
                      style={{ width: '80px' }}
                    />
                    <span>months</span>
                    <input
                      type="number"
                      min="0"
                      value={expDays}
                      onChange={e => setExpDays(e.target.value)}
                      placeholder="Days"
                      style={{ width: '80px' }}
                    />
                    <span>days</span>
                    <input
                      type="number"
                      min="0"
                      value={expHours}
                      onChange={e => setExpHours(e.target.value)}
                      placeholder="Hours"
                      style={{ width: '80px' }}
                    />
                    <span>hours</span>
                    <input
                      type="number"
                      min="0"
                      value={expMinutes}
                      onChange={e => setExpMinutes(e.target.value)}
                      placeholder="Minutes"
                      style={{ width: '80px' }}
                    />
                    <span>minutes</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location Access</label>
                  {!showLocationControls ? (
                    <button
                      type="button"
                      className="location-btn"
                      onClick={handleLocationClick}
                      disabled={isLocationLoading}
                    >
                      {isLocationLoading ? 'Getting Location...' : 'Allow Location Access'}
                    </button>
                  ) : (
                    <div className="location-controls">
                      <div className="location-info">
                        Location access granted
                        {location && (
                          <div className="location-details">
                            Lat: {location.lat.toFixed(6)}, Long: {location.long.toFixed(6)}
                          </div>
                        )}
                      </div>
                      <div className="location-actions">
                        <button
                          type="button"
                          className="edit-location-btn"
                          onClick={handleEditLocation}
                        >
                          Edit Location
                        </button>
                        <button
                          type="button"
                          className="delete-location-btn"
                          onClick={handleDeleteLocation}
                        >
                          Delete Location
                        </button>
                      </div>
                    </div>
                  )}
                  {locationError && <div className="error-message">{locationError}</div>}
                </div>

                {manualError && <div className="error-message">{manualError}</div>}
                {manualSuccess && <div className="success-message">{manualSuccess}</div>}

                {generatedLink && (
                  <div className="generated-link-container">
                    <div className="generated-link-box">
                      <span className="generated-link">{generatedLink}</span>
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={handleCopyGeneratedLink}
                        aria-label="Copy URL"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="generate-btn"
                  disabled={!linkDestination.trim() || !aliases[0] || aliases[0].length < 3 || aliasStatus?.exists}
                >
                  Generate Link
                </button>
              </form>
            </div>
          ) : (
            // Automatic mode: Home-like URL shortener
            <>
              <div className="url-shortener manual-wide manual-top-spacing">
                <form onSubmit={handleManualGenerateLink} className="url-input-container">
                  <input
                    type="text"
                    placeholder="Enter link here ..."
                    value={manualUrl}
                    onChange={e => setManualUrl(e.target.value)}
                    className={`url-input ${manualUrlError ? 'error' : ''}`}
                  />
                  {manualUrlError && <span className="error-message">{manualUrlError}</span>}
                  <button type="submit" className="generate-button" disabled={manualIsLoading}>
                    {manualIsLoading ? 'Generating...' : 'Generate Link'}
                  </button>
                </form>
                {manualShortUrl && (
                  <div className="short-url-container">
                    <div className="short-url-box">
                      <span className="short-url highlight-url">{manualShortUrl}</span>
                      <button className="copy-btn" onClick={handleManualCopy} aria-label="Copy URL">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <StatsPanel />
            </>
          )}
        </div>
        {mode === 'manual' && <StatsPanel />}
      </div>
    </div>
  );
}

export default CustomizeLink; 