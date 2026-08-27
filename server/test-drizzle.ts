const { db } = require('./src/db/index.ts');
const { users } = require('./src/db/schema.ts');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const password = await bcrypt.hash('newpassword123', 10);
    const updateData = { password, rawPassword: 'newpassword123' };
    console.log('Update Data:', updateData);
    await db.update(users).set(updateData).where(eq(users.id, 89));
    console.log('Success!');
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
run();
