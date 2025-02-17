import { Inspector } from '@cmmv/inspector';
import httpmini from './main';

process.on('SIGINT', async () => {
  console.log(Inspector.getInstance());
  await Inspector.stop();
  await Inspector.saveProfile('./profiles');
  process.exit(0);
});

(async () => {
  await Inspector.start();

  const app = httpmini({
    debug: false,
    etag: false,
    lastModified: false,
  });

  app.get('/', (req, res) => {
    return 'Hello World';
  });

  app.get('/user/:id', (req, res) => {
    return `user ${req.params['id']}`;
  });

  app.get('/json', (req, res) => {
    res.json({
      Hello: 'World',
    });
  });

  app
    .listen({ host: '0.0.0.0', port: 3500 })
    .then((address: any) =>
      console.log(`Server started on ${address.host}:${address.port}`),
    )
    .catch((err) => console.error(err));
})();
