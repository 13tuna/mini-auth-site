// Basit sekme kontrolü ve form işlemleri
const tabs = document.querySelectorAll('.sekme-dugme');
const panels = document.querySelectorAll('.icerik');
tabs.forEach(b => {
  b.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('aktif'));
    panels.forEach(p => p.classList.remove('aktif'));
    b.classList.add('aktif');
    document.querySelector(b.dataset.target).classList.add('aktif');
  });
});

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2500);
}

async function postJSON(url, data){
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data),
    credentials: 'include'
  });
  const json = await r.json().catch(()=>({}));
  if(!r.ok || !json.ok){
    throw new Error(json.error || 'Bir hata oluştu.');
  }
  return json;
}

document.getElementById('formGiris').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = fd.get('email').trim();
  const password = fd.get('password').trim();
  try {
    await postJSON('/api/login', { email, password });
    toast('Giriş başarılı, yönlendiriliyor...');
    setTimeout(() => location.href = '/dashboard', 600);
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById('formKayit').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = fd.get('name').trim();
  const email = fd.get('email').trim();
  const password = fd.get('password').trim();
  try {
    await postJSON('/api/register', { name, email, password });
    toast('Kayıt başarılı, panele alınıyorsunuz...');
    setTimeout(() => location.href = '/dashboard', 600);
  } catch (err) {
    toast(err.message);
  }
});
