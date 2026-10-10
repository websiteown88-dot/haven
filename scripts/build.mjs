import fs from 'node:fs';
fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist/server',{recursive:true});
fs.cpSync('public','dist/client',{recursive:true});
fs.cpSync('worker','dist/server',{recursive:true});
fs.mkdirSync('dist/.openai',{recursive:true});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');

fs.writeFileSync('dist/server/dashboard-page.js','export default '+JSON.stringify(fs.readFileSync('public/analytics.html','utf8'))+';\n');
fs.rmSync('dist/client/analytics.html');
