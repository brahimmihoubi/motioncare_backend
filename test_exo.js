const { initDB } = require('./src/config/database');
const ExoskeletonService = require('./src/services/exoskeleton.service');

async function test() {
  try {
    await initDB();
    console.log('DB init');
    await ExoskeletonService.initSession(1, 0);
    console.log('Session init');
    await ExoskeletonService.start(1);
    console.log('Started session 1');
    setTimeout(() => {
        console.log('Still alive after 10s');
        process.exit(0);
    }, 10000);
  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
