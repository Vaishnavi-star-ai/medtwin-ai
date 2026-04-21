import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

export default function StatusBadge({ status, type = 'status' }) {
  const configs = {
    status: {
      booked: { class: 'badge-booked', label: 'Booked' },
      completed: { class: 'badge-completed', label: 'Completed' },
      cancelled: { class: 'badge-cancelled', label: 'Cancelled' }
    },
    handling: {
      senior: { class: 'badge-senior', label: '👨‍⚕️ Senior Doctor' },
      practitioner: { class: 'badge-practitioner', label: '👩‍⚕️ Practitioner' },
      scheduled: { class: 'badge-scheduled', label: '📅 Scheduled' }
    },
    verified: {
      true: { class: 'badge-verified', label: '✓ Verified Patient' }
    }
  };

  const config = configs[type]?.[status] || { class: 'badge-booked', label: status };

  return (
    <span className={`badge ${config.class}`}>
      {type === 'verified' && <FaCheckCircle className="mr-1" size={10} />}
      {config.label}
    </span>
  );
}
