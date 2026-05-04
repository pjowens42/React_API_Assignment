import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";

const API_URL = "https://rf-json-server.herokuapp.com/events";



// --- Helper: Error Boundary/Handling Logic ---
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "API Request failed");
  }
  return response.json();
};

// --- Component: Event Form (Used for Create & Update) ---
const EventForm = ({ initialData, onSubmit, buttonText }) => {
  const [formData, setFormData] = useState(initialData || {
    name: "", description: "", company: "", color: "blue"
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company) return alert("Name and Company are required");
    onSubmit(formData);
  };

  return (
    <form 
  onSubmit={handleSubmit} 
  style={{ 
    display: "flex",           // Enables flexbox
    flexDirection: "column",    // Stacks children on new lines
    alignItems: "center",       // Centers children horizontally
    gap: "10px",                // Adds space between rows
    marginBottom: "20px", 
    border: "1px solid #ccc", 
    padding: "20px" 
  }}
>
  <h3>Add New Event</h3>
  
  <input style={{ width: "300px" }} name="name" placeholder="Event Name" value={formData.name} onChange={handleChange} required />
  <input style={{ width: "300px" }} name="company" placeholder="Company" value={formData.company} onChange={handleChange} required />
  <input style={{ width: "300px" }} name="color" placeholder="Color (e.g. red)" value={formData.color} onChange={handleChange} />
  <textarea style={{ width: "300px", minHeight: "60px" }} name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
  
  <button style={{ width: "300px", cursor: "pointer" }} type="submit">{buttonText}</button>
</form>
  );
};

// --- Page: Events List ---
const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      const data = await fetch(API_URL).then(handleResponse);
      // Requirement: Sort by company name
      const sorted = data.sort((a, b) => a.company.localeCompare(b.company));
      setEvents(sorted);
    } catch (err) {
      setError("Failed to load events: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAdd = async (newEvent) => {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, isActive: true, createdOn: new Date().toISOString() })
      }).then(handleResponse);
      fetchEvents(); // Update list
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" }).then(handleResponse);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Events Application</h1>
      
      <EventForm onSubmit={handleAdd} buttonText="Add Event" />
      
      <div style={{ display: "grid", gap: "10px" }}>
        {events.map(event => (
          <div key={event.id} style={{ borderLeft: `5px solid ${event.color || 'gray'}`, padding: "10px", background: "#f9f9f9" }}>
            <strong style={{color: `${event.color || 'gray'}`}}>{event.name}</strong> ({event.company})
            <p>{event.description}</p>
            <Link to={`/event/${event.id}`}>View/Edit</Link> | {" "}
            <button onClick={() => handleDelete(event.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Page: Single Event Detail / Update ---
const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/${id}`).then(handleResponse)
      .then(setEvent)
      .catch(err => setError(err.message));
  }, [id]);

  const handleUpdate = async (updatedData) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      }).then(handleResponse);
      navigate("/");
    } catch (err) { alert(err.message); }
  };

  if (error) return <div>Error: {error} <Link to="/">Go Back</Link></div>;
  if (!event) return <p>Loading event...</p>;

  return (
    <div style={{ padding: "20px", border: "2px solid" + event.color }}>
      <Link to="/">← Back to List</Link>
      <h2>{event.name}</h2>
      <p><strong>Company:</strong> {event.company}</p>
      <p><strong>Description:</strong> {event.description}</p>
      <hr />
      <h3>Update Event Details</h3>
      <EventForm initialData={event} onSubmit={handleUpdate} buttonText="Update Event" />
    </div>
  );
};

// --- Main App Entry ---
export default function App() {
  const appStyle = {
    backgroundColor: "rgb(129, 141, 206)", // Forces background to white
    color: "#333333",           // Ensures text is dark/readable
    minHeight: "100vh",         // Covers the full screen height
    margin: 0,
    padding: "20px",
    fontFamily: "sans-serif"
  };
  return (
    <div style={appStyle}>
      <Router>
        <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
          <Routes>
            <Route path="/" element={<EventsList />} />
            <Route path="/event/:id" element={<EventDetail />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
