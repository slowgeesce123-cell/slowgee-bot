const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let sock = null;
let currentNumber = '';

async function start(number) {
  const { state, saveCreds } = await useMultiFileAuthState('auth-' + number);
  sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['SLOWGEE-BOT', 'Chrome', '1.0']
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') console.log('IMEWAKA: ' + number);
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start(number);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const from = m.key.remoteJid;
    if (text === '.menu' || text === 'hi' || text === 'hello') {
      await sock.sendMessage(from, { text: 'SLOWGEE-BOT IMEWAKA!\n\n.ping\n.menu\n.owner' });
    }
    if (text === '.ping') await sock.sendMessage(from, { text: 'Pong! Bot iko online!' });
    if (text === '.owner') await sock.sendMessage(from, { text: 'Mmiliki ni Slowgee' });
  });
  return sock;
}

// SITE YA KUWEKA NAMBA
app.get('/', (req, res) => {
  res.send(`
  <html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  body{background:#111;color:white;text-align:center;font-family:sans-serif;padding:30px}
  input{padding:15px;width:90%;border-radius:10px;border:none;font-size:18px}
  button{padding:15px 30px;background:#25D366;color:white;border:none;border-radius:10px;font-size:18px;margin-top:15px}
  .box{background:#222;padding:20px;border-radius:15px;margin-top:20px}
  </style></head><body>
  <h1>🔥 SLOWGEE-BOT</h1>
  <p>Weka namba yako ya WhatsApp ili kupata Pairing Code</p>
  <div class="box">
  <input id="num" placeholder="254712345678" />
  <br><button onclick="getCode()">PATA CODE</button>
  <h2 id="code" style="color:#25D366"></h2>
  <p id="msg"></p>
  </div>
  <script>
  async function getCode(){
    let n=document.getElementById('num').value;
    document.getElementById('msg').innerText='Tafadhali subiri...';
    let r=await fetch('/pair?number='+n);
    let d=await r.json();
    if(d.code){ document.getElementById('code').innerText=d.code; document.getElementById('msg').innerText='Ingia WhatsApp > Linked Devices > Link with phone number > weka hii code'; }
    else document.getElementById('msg').innerText=d.error;
  }
  </script></body></html>`);
});

app.get('/pair', async (req, res) => {
  let number = req.query.number;
  if(!number) return res.json({error:'Weka namba'});
  number = number.replace(/[^0-9]/g,'');
  try {
    if(!sock) await start(number);
    let code = await sock.requestPairingCode(number);
    res.json({code: code});
  } catch(e){ res.json({error:'Imeshindikana, jaribu tena. '+e.message}); }
});

app.listen(PORT, ()=> console.log('Site iko live kwenye port '+PORT));
