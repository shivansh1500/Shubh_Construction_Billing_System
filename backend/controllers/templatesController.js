'use strict';

const Template = require('../models/Template');

async function getAllTemplates(req, res) {
  try {
    const templates = await Template.find().sort({ is_default: -1, name: 1 });
    res.json(templates);
  } catch (err) {
    console.error('getAllTemplates error:', err);
    res.status(500).json({ error: 'Failed to load templates' });
  }
}

async function getTemplateById(req, res) {
  try {
    const t = await Template.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    res.json(t);
  } catch (err) {
    console.error('getTemplateById error:', err);
    res.status(500).json({ error: 'Failed to load template' });
  }
}

async function createTemplate(req, res) {
  try {
    const {
      name, company_name, company_address, company_phone, company_email,
      gst_number, logo_path, logo_url, signature_path, signature_url,
      footer_text, template_html, template_css,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Template name is required.' });
    if (!company_name?.trim()) return res.status(400).json({ error: 'Company name is required.' });

    const newTemplate = await Template.create({
      name: name.trim(),
      company_name: company_name.trim(),
      company_address: company_address || '',
      company_phone: company_phone || '',
      company_email: company_email || '',
      gst_number: gst_number || '',
      logo_url: logo_url || logo_path || '',
      signature_url: signature_url || signature_path || '',
      footer_text: footer_text || '',
      template_html: template_html || '',
      template_css: template_css || '',
      is_default: 0,
    });

    res.status(201).json(newTemplate);
  } catch (err) {
    console.error('createTemplate error:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
}

async function updateTemplate(req, res) {
  try {
    const t = await Template.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    const {
      name, company_name, company_address, company_phone, company_email,
      gst_number, logo_path, logo_url, signature_path, signature_url,
      footer_text, template_html, template_css,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (company_name !== undefined) updateData.company_name = company_name.trim();
    if (company_address !== undefined) updateData.company_address = company_address;
    if (company_phone !== undefined) updateData.company_phone = company_phone;
    if (company_email !== undefined) updateData.company_email = company_email;
    if (gst_number !== undefined) updateData.gst_number = gst_number;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    else if (logo_path !== undefined) updateData.logo_url = logo_path;
    if (signature_url !== undefined) updateData.signature_url = signature_url;
    else if (signature_path !== undefined) updateData.signature_url = signature_path;
    if (footer_text !== undefined) updateData.footer_text = footer_text;
    if (template_html !== undefined) updateData.template_html = template_html;
    if (template_css !== undefined) updateData.template_css = template_css;

    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.json(updated);
  } catch (err) {
    console.error('updateTemplate error:', err);
    res.status(500).json({ error: 'Failed to update template' });
  }
}

async function deleteTemplate(req, res) {
  try {
    const t = await Template.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    const count = await Template.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining template.' });
    }

    if (t.is_default) {
      return res.status(400).json({
        error: 'Please set another template as default before deleting this one.',
      });
    }

    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

async function setDefaultTemplate(req, res) {
  try {
    const t = await Template.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    await Template.updateMany({}, { $set: { is_default: 0 } });
    t.is_default = 1;
    await t.save();

    res.json({ success: true, message: 'Default template updated' });
  } catch (err) {
    console.error('setDefaultTemplate error:', err);
    res.status(500).json({ error: 'Failed to set default template' });
  }
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};
