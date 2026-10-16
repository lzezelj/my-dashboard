import { useNavigate, useOutletContext } from 'react-router-dom';
import EventForm from '../components/EventForm';
import type { EditOutletContext } from './Edit';

export default function AddEvent() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext<EditOutletContext>();
  return (
    <div className="add-event-page">
      <header className="event-manager__heading">
        <h1>Add event</h1>
        <p>Create a new calendar event</p>
      </header>
      <EventForm
        onCancel={() => navigate('/events')}
        onSaved={() => {
          showToast('Event created successfully.');
          navigate('/events');
        }}
      />
    </div>
  );
}
