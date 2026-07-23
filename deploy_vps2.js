const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const commands = [
    'cd /root/FacturaPro && docker compose build backend frontend',
    'cd /root/FacturaPro && docker compose up -d backend frontend'
  ];
  
  conn.exec(commands.join(' && '), (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', data => console.log(data.toString())).stderr.on('data', data => console.error(data.toString()));
  });
}).connect({ host: '137.184.155.133', port: 22, username: 'root', password: 'ELj@rge79137h' });
