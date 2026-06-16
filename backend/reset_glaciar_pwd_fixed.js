const { Client } = require('ssh2');
const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('glaciar123', 10);
  const escapedHash = hash.replace(/\$/g, '\\$');
  
  const conn = new Client();
  const config = {
    host: '137.184.155.133',
    port: 22,
    username: 'root',
    password: 'ELj@rge79137h'
  };

  // We use single quotes around the command for bash, so we don't have to escape double quotes and $ signs.
  // Wait, if we use single quotes for the bash command, how do we pass single quotes for the SQL?
  // Let's just stick to escaping $ signs inside double quotes.
  
  const command = `docker exec facturapro-db psql -U postgres -d facturapro -c "UPDATE \\"User\\" SET \\"passwordHash\\" = '${escapedHash}', \\"posPin\\" = '1234' WHERE email = 'admin@glaciar.com';"`;

  conn.on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        console.log('Update completed successfully. Hash was:', hash);
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
