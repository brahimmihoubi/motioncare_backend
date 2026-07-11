const PatientModel = require('./src/models/patient.model');
PatientModel.findAll().then(console.log).catch(console.error);
