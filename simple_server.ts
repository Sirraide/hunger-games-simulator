const http = require("http")
const fs = require("fs")
const pwd = process.cwd()

const port = 24000

// @formatter:off
function ResolveMimeType(filename: string): string {
    if (!filename.includes('.')) return 'text'
    const extension = filename.slice(filename.lastIndexOf('.') + 1)
    switch (extension) {
        case 'html': return 'text/html; charset=utf-8'
        case 'css': return 'text/css; charset=utf-8'
        case 'js': return 'text/javascript; charset=utf-8'
        case 'png': return 'image/png'
        case 'jpg': return 'image/jpeg'
        case 'svg': return 'image/svg+xml'
        case 'woff': return 'font/woff; charset=utf-8'
        case 'pdf': return 'application/pdf'
        case 'ico': return 'image/ico'
        case 'gif': return 'image/gif'
        case 'jpeg': return 'image/jpeg'
        case 'mjs': return 'text/javascript; charset=utf-8'
        case 'cjs': return 'text/javascript; charset=utf-8'
        default: return 'text'
    }
}
// @formatter:on

http.createServer((req, res) => {
    if (req.method != 'GET' && req.method != 'HEAD') {
        res.statusCode = 501
        res.end()
        return
    }
    const uri = decodeURI(req.url)
    let filename: string
    if (uri === '/') filename = 'hunger_games_simulator.html'
    else filename = pwd + '/' + uri
    if (!filename.includes('.')) filename += '.html'
    if (!fs.existsSync(filename)) {
        res.statusCode = 404;
        res.end();
        return
    }
    const contents = fs.readFileSync(filename)
    const mime = ResolveMimeType(filename)
    res.setHeader('Content-Length', contents.length)
    res.setHeader('Content-Type', mime)
    if (mime === 'text/html; charset=utf-8')
        res.setHeader('Content-Security-Policy',
            "default-src 'self' nguh.org *.nguh.org data:; " +
            "img-src * data: blob:; frame-src *; media-src * data: blob:; " +
            "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
    if (req.method === 'HEAD') res.end()
    else res.end(contents)
}).listen(port, 'localhost', () => {
    console.log(`Listening on http://localhost:${port}`)
    console.log('This is not a secure web server');
    console.log('Only use this for testing!')
})

