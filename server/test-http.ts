import fetch from 'node-fetch';

async function testMutation() {
  const payload = {
    studentId: 27, // Ensure this student exists
    allocation: {
      oneToOne: {
        teacherId: 25,
        designatedTime: "14:30",
        sessions30: 10,
        sessions45: 0,
        sessions60: 0
      },
      group: {
        teacherId: null,
        batchId: null,
        designatedTime: "",
        sessions30: 0,
        sessions45: 0,
        sessions60: 0
      }
    }
  };

  const url = 'http://localhost:3000/trpc/students.updateClassAllocation';
  
  // We need a valid token. Let's just create a token for the admin user.
  // Actually, wait, bypassing auth might be hard without a token.
  // Let me just fetch the data and see.
}
