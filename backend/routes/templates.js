'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/templatesController');

router.get('/', ctrl.getAllTemplates);
router.get('/:id', ctrl.getTemplateById);
router.post('/', ctrl.createTemplate);
router.put('/:id', ctrl.updateTemplate);
router.delete('/:id', ctrl.deleteTemplate);
router.post('/:id/default', ctrl.setDefaultTemplate);

module.exports = router;
