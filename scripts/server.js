// Production entry point. Wraps the adapter-node handler for typical self-hosting:
//
// - adapter-node assumes HTTPS unless a proxy says otherwise, which makes SvelteKit's
//   CSRF check reject every form post on a plain http://host:3000 install. Requests
//   that don't say which protocol they came in on are marked as plain HTTP here; a
//   TLS-terminating proxy that sends X-Forwarded-Proto still wins.
// - The default 512K body limit is smaller than a year of CSV export, so it is raised.
import http from 'node:http';

process.env.PROTOCOL_HEADER ||= 'x-forwarded-proto';
process.env.BODY_SIZE_LIMIT ||= '11M';
const protocolHeader = process.env.PROTOCOL_HEADER.toLowerCase();

const { handler } = await import('../build/handler.js');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
	req.headers[protocolHeader] ||= req.socket.encrypted ? 'https' : 'http';
	handler(req, res, () => {
		res.statusCode = 404;
		res.end('Not found');
	});
});

server.listen(port, host, () => console.log(`dkb-dash listening on http://${host}:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => server.close(() => process.exit(0)));
}
