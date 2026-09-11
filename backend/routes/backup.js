'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/backupController');

router.post('/backup/local', ctrl.createLocalBackup);
router.post('/backup', ctrl.createBackup);
router.post('/restore', ctrl.restoreBackup);

module.exports = router;
