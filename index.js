const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['SLOWGEE-BOT', 'Chrome', '1.0']
  });
  sock.ev.on('creds.update', saveCreds);

  // Namba inatoka kwenye Render, sio kuandikwa hapa
  const number = process.env.PHONE_NUMBER;

  if (!sock.authState.creds.registered) {
    if (!number) {
      console.log('WEKA Namba kwanza kwenye Render: PHONE_NUMBER=2547XXXXXXX');
      return;
    }
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(number);
        console.log('PAIRING CODE YAKO YA ' + number + ' NI: ' + code);
      } catch (e) {
        console.log('Imeshindikana kuomba code, jaribu tena: ' + e.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') console.log('SLOWGEE-BOT IMEWAKA ✅');
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const from = m.key.remoteJid;
    if (text === '.menu' || text === 'hi' || text === 'hello') {
      await sock.sendMessage(from, { text: 'SLOWGEE-BOT IMEWAKA!\n\nCommands:\n.ping\n.menu\n.owner' });
    }
    if (text === '.ping') {
      await sock.sendMessage(from, { text: 'Pong! Bot iko online!' });
    }
    if (text === '.owner') {
      await sock.sendMessage(from, { text: 'Mmiliki ni Slowgee' });
    }
  });
}
start();
