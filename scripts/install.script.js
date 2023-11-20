import { Service } from 'node-windows'
import path from 'path'

const dir = path.join(process.cwd(), 'server.js');

const svc = new Service({
  name:'Modbus Logger App',
  description: 'Monitor Modbus slave devices.',
  script: dir,
  env:{
    name: "NODE_ENV",
    value: "production"
  }
})

svc.on('install', () => svc.start());
svc.on('alreadyinstalled', () => console.log('This service is already installed.'));
svc.on('start', () => console.log('Service started!'));

console.log("Installing to", dir);
svc.install();