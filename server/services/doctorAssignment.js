const { getDB } = require('../config/firebase');

/**
 * Smart Doctor Assignment Logic
 * 
 * Priority: Senior Doctor → Practitioner Doctor → Next Available Slot
 * NEVER rejects a booking.
 */
async function assignDoctor(hospitalId, preferredDoctorId = null) {
  const db = getDB();

  // Step 1: If a specific doctor is preferred, check their availability
  if (preferredDoctorId) {
    const docRef = db.collection('doctors').doc(preferredDoctorId);
    const docSnap = await docRef.get();
    if (docSnap.exists && docSnap.data().isAvailable && docSnap.data().hospitalId === hospitalId) {
      await docRef.update({ isAvailable: false });
      return {
        doctor: { id: docSnap.id, ...docSnap.data() },
        handlingType: docSnap.data().role === 'senior' ? 'senior' : 'practitioner',
        message: `Assigned to ${docSnap.data().name} (${docSnap.data().role})`
      };
    }
  }

  // Step 2: Check available senior doctors
  const seniorQuery = await db.collection('doctors')
    .where('hospitalId', '==', hospitalId)
    .where('role', '==', 'senior')
    .get();

  const availableSenior = seniorQuery.docs.find(d => d.data().isAvailable === true);
  if (availableSenior) {
    await db.collection('doctors').doc(availableSenior.id).update({ isAvailable: false });
    return {
      doctor: { id: availableSenior.id, ...availableSenior.data() },
      handlingType: 'senior',
      message: `Senior doctor ${availableSenior.data().name} is available and assigned`
    };
  }

  // Step 3: Check available practitioner doctors
  const practQuery = await db.collection('practitionerDoctors')
    .where('hospitalId', '==', hospitalId)
    .get();

  const availablePract = practQuery.docs.find(d => d.data().isAvailable === true);
  if (availablePract) {
    await db.collection('practitionerDoctors').doc(availablePract.id).update({ isAvailable: false });
    return {
      doctor: { id: availablePract.id, ...availablePract.data() },
      handlingType: 'practitioner',
      message: `Senior doctors are busy. Practitioner ${availablePract.data().name} has been assigned for your consultation.`
    };
  }

  // Step 4: Schedule next slot — NEVER reject
  const nextSlotTime = new Date();
  nextSlotTime.setHours(nextSlotTime.getHours() + 2); // Next available in 2 hours

  // Pick the first senior doctor for scheduled appointment
  const firstDoctor = seniorQuery.docs[0] || practQuery.docs[0];
  const scheduledDoctor = firstDoctor 
    ? { id: firstDoctor.id, ...firstDoctor.data() }
    : { id: 'auto', name: 'Next Available Doctor', role: 'senior', specialization: 'General' };

  return {
    doctor: scheduledDoctor,
    handlingType: 'scheduled',
    scheduledTime: nextSlotTime.toISOString(),
    message: `All doctors are currently busy. Your appointment has been scheduled for ${nextSlotTime.toLocaleTimeString()} with ${scheduledDoctor.name}.`
  };
}

/**
 * Release doctor after appointment completion/cancellation
 */
async function releaseDoctor(doctorId, handlingType) {
  const db = getDB();
  const collection = handlingType === 'practitioner' ? 'practitionerDoctors' : 'doctors';
  try {
    await db.collection(collection).doc(doctorId).update({ isAvailable: true });
  } catch (error) {
    console.log('Could not release doctor:', error.message);
  }
}

module.exports = { assignDoctor, releaseDoctor };
