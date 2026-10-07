const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_PATH = path.join(ROOT, 'data', 'solar-data.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.ico':'image/x-icon', '.webp':'image/webp'
};

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type':type, 'Cache-Control':'no-store'});
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let body='';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch(e){ reject(e); } });
  });
}
function api(req,res,pathname){
  if(req.method==='GET' && pathname==='/api/health') return send(res,200,{ok:true,project:'SolarScope India',timestamp:new Date().toISOString()});
  if(req.method==='GET' && pathname==='/api/overview') return send(res,200,data.overview);
  if(req.method==='GET' && pathname==='/api/regions') return send(res,200,data.regions);
  if(req.method==='GET' && pathname==='/api/states') return send(res,200,data.states);
  if(req.method==='GET' && pathname==='/api/capacity') return send(res,200,{capacity:data.capacity,timeline:data.timeline});
  if(req.method==='GET' && pathname==='/api/sources') return send(res,200,data.sources);
  if(req.method==='POST' && pathname==='/api/calculate'){
    return jsonBody(req).then(b=>{
      const size=Number(b.size), sunHours=Number(b.sunHours), performanceRatio=Number(b.performanceRatio);
      if(!Number.isFinite(size)||!Number.isFinite(sunHours)||!Number.isFinite(performanceRatio)||size<=0||sunHours<=0||performanceRatio<=0||performanceRatio>1){
        return send(res,400,{error:'Invalid calculator input'});
      }
      const annual=size*sunHours*365*performanceRatio;
      send(res,200,{annualKWh:Math.round(annual),dailyKWh:Number((annual/365).toFixed(1)),formula:'PV Capacity × Peak-Sun-Hours × 365 × Performance Ratio'});
    }).catch(()=>send(res,400,{error:'Invalid JSON body'}));
  }
  return false;
}

const server=http.createServer((req,res)=>{
  const parsed=url.parse(req.url);
  const pathname=decodeURIComponent(parsed.pathname);
  if(pathname.startsWith('/api/')){
    const handled=api(req,res,pathname);
    if(handled!==false) return;
    return send(res,404,{error:'API endpoint not found'});
  }
  let filePath = pathname==='/' ? path.join(PUBLIC,'index.html') : path.join(PUBLIC, pathname.replace(/^\/+/,''));
  if(!filePath.startsWith(PUBLIC)) return send(res,403,'Forbidden','text/plain');
  fs.stat(filePath,(err,stat)=>{
    if(err || !stat.isFile()) filePath=path.join(PUBLIC,'index.html');
    fs.readFile(filePath,(readErr,content)=>{
      if(readErr) return send(res,500,'Server error','text/plain');
      res.writeHead(200,{'Content-Type':mime[path.extname(filePath).toLowerCase()]||'application/octet-stream'});
      res.end(content);
    });
  });
});
server.listen(PORT,()=>console.log(`SolarScope India running at http://localhost:${PORT}`));
