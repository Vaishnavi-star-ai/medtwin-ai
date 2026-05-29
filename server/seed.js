const { getDB } = require('./config/firebase');

async function seed() {
  console.log('🌱 Seeding database...\n');
  const db = getDB();

  const seniorDoctors = [
    { name: 'Dr. Arun Sharma', specialization: 'Cardiologist', hospitalId: 'hosp_001', role: 'senior', isAvailable: true, experience: '18 years', qualification: 'MBBS, MD, DM Cardiology', consultFee: 1500, image: '' },
    { name: 'Dr. Priya Patel', specialization: 'Neurologist', hospitalId: 'hosp_001', role: 'senior', isAvailable: true, experience: '15 years', qualification: 'MBBS, MD, DM Neurology', consultFee: 1200, image: '' },
    { name: 'Dr. Rajesh Kumar', specialization: 'Orthopedic Surgeon', hospitalId: 'hosp_002', role: 'senior', isAvailable: true, experience: '20 years', qualification: 'MBBS, MS Orthopaedics', consultFee: 1800, image: '' },
    { name: 'Dr. Sunita Reddy', specialization: 'Gynecologist', hospitalId: 'hosp_002', role: 'senior', isAvailable: true, experience: '16 years', qualification: 'MBBS, MS OBG', consultFee: 1400, image: '' },
    { name: 'Dr. Venkat Rao', specialization: 'General Surgeon', hospitalId: 'hosp_003', role: 'senior', isAvailable: true, experience: '22 years', qualification: 'MBBS, MS General Surgery', consultFee: 2000, image: '' },
    { name: 'Dr. Meena Iyer', specialization: 'Pediatrician', hospitalId: 'hosp_003', role: 'senior', isAvailable: true, experience: '14 years', qualification: 'MBBS, MD Pediatrics', consultFee: 1000, image: '' },
    { name: 'Dr. Sanjay Gupta', specialization: 'Dermatologist', hospitalId: 'hosp_004', role: 'senior', isAvailable: true, experience: '12 years', qualification: 'MBBS, MD Dermatology', consultFee: 1100, image: '' },
    { name: 'Dr. Anita Deshmukh', specialization: 'Oncologist', hospitalId: 'hosp_005', role: 'senior', isAvailable: true, experience: '19 years', qualification: 'MBBS, MD, DM Oncology', consultFee: 2500, image: '' },
    { name: 'Dr. Karthik Nair', specialization: 'Pulmonologist', hospitalId: 'hosp_006', role: 'senior', isAvailable: true, experience: '17 years', qualification: 'MBBS, MD Pulmonology', consultFee: 1300, image: '' },
    { name: 'Dr. Lakshmi Menon', specialization: 'ENT Specialist', hospitalId: 'hosp_007', role: 'senior', isAvailable: true, experience: '13 years', qualification: 'MBBS, MS ENT', consultFee: 900, image: '' },
    { name: 'Dr. Vivek Krishnan', specialization: 'Cardiac Surgeon', hospitalId: 'hosp_012', role: 'senior', isAvailable: true, experience: '25 years', qualification: 'MBBS, MS, MCh Cardiac Surgery', consultFee: 3000, image: '' },
    { name: 'Dr. Neha Jain', specialization: 'Nephrologist', hospitalId: 'hosp_008', role: 'senior', isAvailable: true, experience: '11 years', qualification: 'MBBS, MD, DM Nephrology', consultFee: 1600, image: '' }
  ];

  const practitionerDoctors = [
    { name: 'Dr. Amit Joshi', role: 'practitioner', hospitalId: 'hosp_001', specialization: 'General Medicine', isAvailable: true, experience: '5 years', qualification: 'MBBS', consultFee: 500 },
    { name: 'Dr. Kavitha Rajan', role: 'practitioner', hospitalId: 'hosp_001', specialization: 'General Medicine', isAvailable: true, experience: '4 years', qualification: 'MBBS', consultFee: 500 },
    { name: 'Dr. Rohan Pillai', role: 'practitioner', hospitalId: 'hosp_002', specialization: 'General Medicine', isAvailable: true, experience: '3 years', qualification: 'MBBS', consultFee: 400 },
    { name: 'Dr. Deepa Nambiar', role: 'practitioner', hospitalId: 'hosp_002', specialization: 'General Medicine', isAvailable: true, experience: '6 years', qualification: 'MBBS, DNB', consultFee: 600 },
    { name: 'Dr. Suresh Babu', role: 'practitioner', hospitalId: 'hosp_003', specialization: 'General Medicine', isAvailable: true, experience: '4 years', qualification: 'MBBS', consultFee: 500 },
    { name: 'Dr. Pallavi Hegde', role: 'practitioner', hospitalId: 'hosp_004', specialization: 'General Medicine', isAvailable: true, experience: '3 years', qualification: 'MBBS', consultFee: 400 },
    { name: 'Dr. Arjun Shetty', role: 'practitioner', hospitalId: 'hosp_005', specialization: 'General Medicine', isAvailable: true, experience: '5 years', qualification: 'MBBS', consultFee: 500 },
    { name: 'Dr. Nandini Kulkarni', role: 'practitioner', hospitalId: 'hosp_006', specialization: 'General Medicine', isAvailable: true, experience: '2 years', qualification: 'MBBS', consultFee: 400 },
    { name: 'Dr. Rahul Mishra', role: 'practitioner', hospitalId: 'hosp_008', specialization: 'General Medicine', isAvailable: true, experience: '4 years', qualification: 'MBBS', consultFee: 500 },
    { name: 'Dr. Smita Patil', role: 'practitioner', hospitalId: 'hosp_012', specialization: 'General Medicine', isAvailable: true, experience: '3 years', qualification: 'MBBS', consultFee: 400 }
  ];

  // ═══════════════════════════════════════
  // 10 REVIEWS PER HOSPITAL (90 total)
  // ═══════════════════════════════════════
  const hospitals = [
    { id: 'hosp_001', name: 'Apollo Hospitals Bannerghatta' },
    { id: 'hosp_002', name: 'Fortis Hospital Bannerghatta Road' },
    { id: 'hosp_003', name: 'Narayana Health City' },
    { id: 'hosp_004', name: 'Manipal Hospital Old Airport Road' },
    { id: 'hosp_005', name: 'Columbia Asia Hospital Hebbal' },
    { id: 'hosp_006', name: 'Sakra World Hospital' },
    { id: 'hosp_007', name: 'BGS Gleneagles Global Hospital' },
    { id: 'hosp_008', name: 'Aster CMI Hospital' },
    { id: 'hosp_012', name: 'Jayadeva Institute of Cardiology' },
  ];

  const names = [
    'Rahul Verma', 'Sneha Rao', 'Mohammed Ashraf', 'Divya Krishnan', 'Vikram Singh',
    'Ananya Bhatt', 'Sunil Kapoor', 'Preethi Mohan', 'Ganesh Hegde', 'Meera Joshi',
    'Ravi Shankar', 'Pooja Agarwal', 'Arun Prasad', 'Nirmala Devi', 'Kiran Desai',
    'Lakshmi Sundaram', 'Ajay Malhotra', 'Rekha Nair', 'Siddharth Bose', 'Tanya Khanna',
    'Manoj Tiwari', 'Swathi Reddy', 'Nikhil Saxena', 'Fatima Sheikh', 'Harish Gowda',
    'Deepika Chauhan', 'Ramesh Yadav', 'Kavya Sharma', 'Surya Prakash', 'Aditi Menon',
    'Venkatesh Murthy', 'Shreya Das', 'Naveen Kumar', 'Jaya Lakshmi', 'Prakash Shetty',
    'Isha Gupta', 'Mohan Raj', 'Shalini Iyer', 'Amit Verma', 'Rashmi Kulkarni',
    'Santosh Patil', 'Varsha Hegde', 'Dinesh Babu', 'Sowmya Rangan', 'Raj Kumar',
    'Padma Devi', 'Ashok Reddy', 'Nandita Bhat', 'Vijay Anand', 'Sunitha Rao',
    'Mahesh Goud', 'Anjali Pillai', 'Srinivas Murthy', 'Usha Kumari', 'Praveen Joshi',
    'Bhavana Shetty', 'Girish Nair', 'Rohini Deshmukh', 'Chetan Kulkarni', 'Lavanya Reddy',
    'Prashanth Rao', 'Deepa Mohan', 'Anil Kumar', 'Shweta Singh', 'Rajendra Hegde',
    'Suman Jain', 'Vinod Sharma', 'Pallavi Rajan', 'Kishore Babu', 'Madhavi Devi',
    'Sachin Gupta', 'Priyanka Nair', 'Ramya Krishnan', 'Bhaskar Rao', 'Sharada Menon',
    'Navya Reddy', 'Arjun Malhotra', 'Chitra Sundaram', 'Ranjith Kumar', 'Geeta Sharma',
    'Umesh Patil', 'Swapna Rao', 'Nitin Joshi', 'Kamala Devi', 'Sameer Khan',
    'Poornima Iyer', 'Raghav Shetty', 'Anu Prasad', 'Tarun Bose', 'Manju Latha'
  ];

  const comments = {
    5: [
      'Outstanding experience! The doctors were incredibly thorough and the staff made me feel comfortable throughout.',
      'World-class medical facility. The treatment was exceptional and the recovery was faster than expected.',
      'Best hospital experience I have ever had. The entire team was professional, caring, and highly skilled.',
      'Absolutely wonderful care from admission to discharge. The nurses were attentive and the doctors explained everything clearly.',
      'Life-saving treatment at this hospital. My family and I are forever grateful for the care received here.',
      'Exceeded all expectations. Clean facilities, modern equipment, and compassionate healthcare professionals.',
      'The emergency team was incredibly fast and efficient. Got treated within minutes of arrival.',
      'Highly recommend this hospital. The doctors took their time to explain the diagnosis and treatment options thoroughly.',
      'Five-star treatment in every way. From the reception desk to the operating room, everything was seamless.',
      'The post-operative care was exceptional. Regular follow-ups and the recovery support team was always available.',
      'Cannot praise this hospital enough. The cardiology department saved my husband\'s life with their expertise.',
      'Brilliant medical team. They diagnosed a rare condition that three other hospitals missed. Truly grateful.',
    ],
    4: [
      'Very good hospital with professional staff. Minor wait time but the quality of care was excellent.',
      'Good experience overall. The facilities are modern and well-maintained. Doctors are knowledgeable.',
      'Satisfied with the treatment received. The billing was transparent and the staff was helpful.',
      'Professional and efficient. The only downside was parking, but the medical care was top-notch.',
      'Great doctors and nursing staff. The hospital food could be better, but treatment quality was excellent.',
      'Reliable healthcare institution. Have been coming here for years and the quality has been consistent.',
      'Good diagnostic facilities and competent doctors. The appointment system works well most of the time.',
      'Impressed with the cleanliness and hygiene standards. The medical team was experienced and reassuring.',
      'Positive experience. The physiotherapy department was especially helpful in my recovery.',
      'Efficient hospital with good infrastructure. The pharmacy section was well-stocked and affordable.',
    ],
    3: [
      'Decent hospital but the waiting time was excessive. The treatment itself was satisfactory.',
      'Average experience. Good doctors but the administrative process needs significant improvement.',
      'The medical care was okay but the billing department was confusing and unhelpful.',
      'Mixed experience. Some departments are excellent while others need improvement in service.',
      'Hospital is good but overcrowded. Would appreciate better crowd management and scheduling.',
    ],
  };

  const sampleReviews = [];
  let nameIndex = 0;

  hospitals.forEach(hosp => {
    // Each hospital gets: 4 five-star, 4 four-star, 2 three-star reviews
    const ratingDist = [5, 5, 5, 5, 4, 4, 4, 4, 3, 3];
    ratingDist.forEach((rating, i) => {
      const pool = comments[rating];
      const comment = pool[(nameIndex + i) % pool.length];
      const month = ((i % 4) + 1); // Jan-Apr spread
      const day = Math.min(28, (i * 3) + 1);
      sampleReviews.push({
        patientName: names[nameIndex % names.length],
        hospitalId: hosp.id,
        hospitalName: hosp.name,
        rating,
        comment,
        verified: Math.random() > 0.2,
        helpfulCount: Math.floor(Math.random() * 50) + 1,
        createdAt: `2026-0${month}-${String(day).padStart(2, '0')}T${String(8 + i).padStart(2, '0')}:${String(i * 5).padStart(2, '0')}:00Z`
      });
      nameIndex++;
    });
  });

  // Build appointments with proper doctorSpecialization from the assigned doctor
  const sampleAppointments = sampleReviews.slice(0, 20).map((review, i) => {
    const doctor = seniorDoctors.find(d => d.hospitalId === review.hospitalId);
    return {
      patientName: review.patientName, hospitalId: review.hospitalId, hospitalName: review.hospitalName,
      originalDoctor: 'Auto-assigned',
      assignedDoctor: doctor?.name || 'Dr. General',
      assignedDoctorId: `senior_${String((i % seniorDoctors.length) + 1).padStart(3, '0')}`,
      doctorSpecialization: doctor?.specialization || 'General',
      handlingType: 'senior', time: review.createdAt, status: i < 14 ? 'completed' : 'booked',
      createdAt: review.createdAt, updatedAt: review.createdAt
    };
  });

  // Additional disease-specific treated patients (all completed, real specializations)
  const diseasePatients = [
    { patientName: 'Arjun Mehta', hospitalId: 'hosp_001', hospitalName: 'Apollo Hospitals Bannerghatta', assignedDoctor: 'Dr. Arun Sharma', doctorSpecialization: 'Cardiologist', status: 'completed', createdAt: '2026-03-10T09:00:00Z' },
    { patientName: 'Lakshmi Devi', hospitalId: 'hosp_012', hospitalName: 'Jayadeva Institute of Cardiology', assignedDoctor: 'Dr. Vivek Krishnan', doctorSpecialization: 'Cardiac Surgeon', status: 'completed', createdAt: '2026-03-12T10:00:00Z' },
    { patientName: 'Ramesh Gupta', hospitalId: 'hosp_008', hospitalName: 'Aster CMI Hospital', assignedDoctor: 'Dr. Neha Jain', doctorSpecialization: 'Cardiologist', status: 'completed', createdAt: '2026-02-20T08:30:00Z' },
    { patientName: 'Sunita Bose', hospitalId: 'hosp_011', hospitalName: 'Vikram Hospital Millers Road', assignedDoctor: 'Dr. Arun Sharma', doctorSpecialization: 'Cardiologist', status: 'completed', createdAt: '2026-01-15T11:00:00Z' },
    { patientName: 'Kiran Rao', hospitalId: 'hosp_005', hospitalName: 'Columbia Asia Hospital Hebbal', assignedDoctor: 'Dr. Anita Deshmukh', doctorSpecialization: 'Oncologist', status: 'completed', createdAt: '2026-03-05T14:00:00Z' },
    { patientName: 'Fatima Sheikh', hospitalId: 'hosp_001', hospitalName: 'Apollo Hospitals Bannerghatta', assignedDoctor: 'Dr. Anita Deshmukh', doctorSpecialization: 'Oncologist', status: 'completed', createdAt: '2026-02-18T09:30:00Z' },
    { patientName: 'Deepak Verma', hospitalId: 'hosp_005', hospitalName: 'Columbia Asia Hospital Hebbal', assignedDoctor: 'Dr. Anita Deshmukh', doctorSpecialization: 'Oncologist', status: 'completed', createdAt: '2026-01-22T16:00:00Z' },
    { patientName: 'Meera Nambiar', hospitalId: 'hosp_001', hospitalName: 'Apollo Hospitals Bannerghatta', assignedDoctor: 'Dr. Priya Patel', doctorSpecialization: 'Neurologist', status: 'completed', createdAt: '2026-03-18T10:30:00Z' },
    { patientName: 'Suresh Iyer', hospitalId: 'hosp_011', hospitalName: 'Vikram Hospital Millers Road', assignedDoctor: 'Dr. Priya Patel', doctorSpecialization: 'Neurologist', status: 'completed', createdAt: '2026-02-25T08:00:00Z' },
    { patientName: 'Anjali Sharma', hospitalId: 'hosp_003', hospitalName: 'Narayana Health City', assignedDoctor: 'Dr. Priya Patel', doctorSpecialization: 'Neurologist', status: 'completed', createdAt: '2026-01-10T13:00:00Z' },
    { patientName: 'Prakash Shetty', hospitalId: 'hosp_002', hospitalName: 'Fortis Hospital Bannerghatta Road', assignedDoctor: 'Dr. Rajesh Kumar', doctorSpecialization: 'Orthopedic Surgeon', status: 'completed', createdAt: '2026-03-22T09:00:00Z' },
    { patientName: 'Nirmala Hegde', hospitalId: 'hosp_009', hospitalName: 'Sparsh Hospital Yeshwanthpur', assignedDoctor: 'Dr. Rajesh Kumar', doctorSpecialization: 'Orthopedic Surgeon', status: 'completed', createdAt: '2026-02-14T11:30:00Z' },
    { patientName: 'Mohan Das', hospitalId: 'hosp_002', hospitalName: 'Fortis Hospital Bannerghatta Road', assignedDoctor: 'Dr. Rajesh Kumar', doctorSpecialization: 'Orthopedic Surgeon', status: 'completed', createdAt: '2026-01-28T15:00:00Z' },
    { patientName: 'Divya Menon', hospitalId: 'hosp_006', hospitalName: 'Sakra World Hospital', assignedDoctor: 'Dr. Karthik Nair', doctorSpecialization: 'Pulmonologist', status: 'completed', createdAt: '2026-03-08T10:00:00Z' },
    { patientName: 'Rajendra Patil', hospitalId: 'hosp_005', hospitalName: 'Columbia Asia Hospital Hebbal', assignedDoctor: 'Dr. Karthik Nair', doctorSpecialization: 'Pulmonologist', status: 'completed', createdAt: '2026-02-05T14:30:00Z' },
    { patientName: 'Kavya Reddy', hospitalId: 'hosp_008', hospitalName: 'Aster CMI Hospital', assignedDoctor: 'Dr. Neha Jain', doctorSpecialization: 'Nephrologist', status: 'completed', createdAt: '2026-03-15T08:00:00Z' },
    { patientName: 'Tarun Bhat', hospitalId: 'hosp_003', hospitalName: 'Narayana Health City', assignedDoctor: 'Dr. Neha Jain', doctorSpecialization: 'Nephrologist', status: 'completed', createdAt: '2026-02-28T12:00:00Z' },
    { patientName: 'Priya Kulkarni', hospitalId: 'hosp_004', hospitalName: 'Manipal Hospital Old Airport Road', assignedDoctor: 'Dr. Sanjay Gupta', doctorSpecialization: 'Dermatologist', status: 'completed', createdAt: '2026-03-20T09:30:00Z' },
    { patientName: 'Anil Gowda', hospitalId: 'hosp_004', hospitalName: 'Manipal Hospital Old Airport Road', assignedDoctor: 'Dr. Sanjay Gupta', doctorSpecialization: 'Dermatologist', status: 'completed', createdAt: '2026-01-18T11:00:00Z' },
    { patientName: 'Rekha Bhat', hospitalId: 'hosp_007', hospitalName: 'BGS Gleneagles Global Hospital', assignedDoctor: 'Dr. Lakshmi Menon', doctorSpecialization: 'ENT Specialist', status: 'completed', createdAt: '2026-03-25T10:00:00Z' },
    { patientName: 'Vinod Nair', hospitalId: 'hosp_007', hospitalName: 'BGS Gleneagles Global Hospital', assignedDoctor: 'Dr. Lakshmi Menon', doctorSpecialization: 'ENT Specialist', status: 'completed', createdAt: '2026-02-10T14:00:00Z' },
    { patientName: 'Shweta Joshi', hospitalId: 'hosp_002', hospitalName: 'Fortis Hospital Bannerghatta Road', assignedDoctor: 'Dr. Sunita Reddy', doctorSpecialization: 'Gynecologist', status: 'completed', createdAt: '2026-03-14T09:00:00Z' },
    { patientName: 'Padma Rao', hospitalId: 'hosp_002', hospitalName: 'Fortis Hospital Bannerghatta Road', assignedDoctor: 'Dr. Sunita Reddy', doctorSpecialization: 'Gynecologist', status: 'completed', createdAt: '2026-02-22T10:30:00Z' },
    { patientName: 'Shalini Kapoor', hospitalId: 'hosp_003', hospitalName: 'Narayana Health City', assignedDoctor: 'Dr. Meena Iyer', doctorSpecialization: 'Pediatrician', status: 'completed', createdAt: '2026-03-28T08:00:00Z' },
    { patientName: 'Ravi Prasad', hospitalId: 'hosp_003', hospitalName: 'Narayana Health City', assignedDoctor: 'Dr. Meena Iyer', doctorSpecialization: 'Pediatrician', status: 'completed', createdAt: '2026-01-30T15:00:00Z' },
    { patientName: 'Geeta Sharma', hospitalId: 'hosp_003', hospitalName: 'Narayana Health City', assignedDoctor: 'Dr. Venkat Rao', doctorSpecialization: 'General Surgeon', status: 'completed', createdAt: '2026-03-02T11:00:00Z' },
  ].map(p => ({ ...p, originalDoctor: 'Auto-assigned', assignedDoctorId: 'senior_001', handlingType: 'senior', updatedAt: p.createdAt }));

  console.log('👨‍⚕️ Adding senior doctors...');
  for (let i = 0; i < seniorDoctors.length; i++) {
    await db.collection('doctors').doc(`senior_${String(i + 1).padStart(3, '0')}`).set(seniorDoctors[i]);
  }
  console.log(`   ✅ Added ${seniorDoctors.length} senior doctors`);

  console.log('👩‍⚕️ Adding practitioner doctors...');
  for (let i = 0; i < practitionerDoctors.length; i++) {
    await db.collection('practitionerDoctors').doc(`pract_${String(i + 1).padStart(3, '0')}`).set(practitionerDoctors[i]);
  }
  console.log(`   ✅ Added ${practitionerDoctors.length} practitioner doctors`);

  console.log('📅 Adding sample appointments...');
  for (const appt of sampleAppointments) { await db.collection('appointments').add(appt); }
  for (const appt of diseasePatients) { await db.collection('appointments').add(appt); }
  console.log(`   ✅ Added ${sampleAppointments.length + diseasePatients.length} sample appointments`);

  console.log('⭐ Adding sample reviews...');
  for (const review of sampleReviews) { await db.collection('reviews').add(review); }
  console.log(`   ✅ Added ${sampleReviews.length} sample reviews (${sampleReviews.length / hospitals.length} per hospital)`);

  console.log('\n🎉 Seeding complete!');
  console.log(`   📊 Total: ${seniorDoctors.length} seniors, ${practitionerDoctors.length} practitioners, ${sampleAppointments.length} appointments, ${sampleReviews.length} reviews`);
}

module.exports = seed;
