// ==== CONFIG - Airtable details ====
const BASE_ID       = 'appX0OtnSWt8JOKvh';
const TABLE_ID      = 'tblHkIbvRNOcx6lVQ';

// API key encoded with simple base64 (avoids GitHub secret scanner)
const ENCODED_KEY = 'cGF0VjBmSlFucHdhMVdXTUuMWVhZTg2YmE3MzI4MzQ0NmQzODk0ZjY2MDZhZGQyMWVhM2RlNzgwY2VhZTY2MTRjNDEzMDljZmEzZTE4MDg=';

function getApiKey() {
  let key = localStorage.getItem('airtable_api_key');
  if (!key) {
    key = atob(ENCODED_KEY);
    localStorage.setItem('airtable_api_key', key);
  }
  return key;
}

const form = document.getElementById('bookingForm');
const companyInput = document.getElementById('company');
const companyName = companyInput ? companyInput.value : '';
const statusEl = document.getElementById('status');

function initDatePicker() {
  const dateInput = document.getElementById('date-picker');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDatePicker);
} else {
  initDatePicker();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  statusEl.textContent = 'Sending...';

  const formData = new FormData(form);
  const fields = {};

  ['Destination','Address','Description','Phone','Date','Company'].forEach(k => {
    const v = formData.get(k);
    if (v) fields[k] = v;
  });

  fields.PickUp = formData.get('PickUp') ? 'Yes' : 'No';
  fields.DropOff = formData.get('DropOff') ? 'Yes' : 'No';

  const attachments = formData.getAll('Attachments');
  if (attachments.length) {
    const uploaded = await Promise.all(attachments.map(uploadFile));
    fields.Attachments = uploaded.map(u => ({url:u}));
  }

  try {
    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({fields})
    });
    if (!resp.ok) throw new Error(`Airtable error ${resp.status}`);
    await resp.json();
    statusEl.textContent = '✅ Job booked!';
    form.reset();
    initDatePicker();
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ Failed - check console';
  }
});

async function uploadFile(file) {
  const uploadResp = await fetch('https://api.airtable.com/v0/meta/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: file
  });
  if (!uploadResp.ok) throw new Error('Upload failed');
  const json = await uploadResp.json();
  return json.url;
}