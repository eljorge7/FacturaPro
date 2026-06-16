const { Client } = require('ssh2');
const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('glaciar123', 10);
  
  const conn = new Client();
  const config = {
    host: '137.184.155.133',
    port: 22,
    username: 'root',
    password: 'ELj@rge79137h'
  };

  const commands = `
docker exec facturapro-db psql -U postgres -d facturapro -c "UPDATE \\"User\\" SET \\"passwordHash\\" = '${hash}', \\"posPin\\" = '1234' WHERE email = 'admin@glaciar.com';"
docker exec facturapro-db psql -U postgres -d facturapro -c "UPDATE \\"Tenant\\" SET \\"hasPosAccess\\" = true, \\"storeEnabled\\" = true WHERE id = '93611792-5560-402f-b753-458e0e43b837';"
  `;

  conn.on('ready', () => {
    conn.exec(commands, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        console.log('Update completed successfully.');
        conn.end();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }).connect(config);
}

main().catch(console.error);
