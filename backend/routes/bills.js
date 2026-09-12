'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/billsController');

router.get('/next-number', ctrl.getNextNumber);
router.get('/', ctrl.getAllBills);
router.get('/:id', ctrl.getBillById);
router.post('/', ctrl.createBill);
router.put('/:id', ctrl.updateBill);
router.delete('/:id', ctrl.deleteBill);
router.get('/:id/pdf', ctrl.getBillPdf);
router.post('/:id/pdf', ctrl.generateBillPdf);

module.exports = router;
