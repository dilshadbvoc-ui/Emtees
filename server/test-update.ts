import { appRouter } from './src/routers/_app.js';
import { db } from './src/db/index.js';

async function run() {
  const caller = appRouter.createCaller({ db, req: {} as any, res: {} as any, user: { id: 1, role: 'super_admin' } as any });
  try {
    await caller.students.update({ id: 89, password: 'newpassword123' });
    console.log('Update success');
  } catch (e) {
    console.error('Update failed:', e);
  }
  process.exit(0);
}
run();
