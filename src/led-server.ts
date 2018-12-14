import dgram from 'dgram';
import * as mdns from 'mdns';
import mqtt from 'mqtt';
import { AddressInfo } from 'net';
import process from 'process';
import { LedEffect, Rainbow } from './effects';

const PORT = 54321;
const MULTICAST_ADDR = '234.255.255.255';

const FPS = 100;
const PIXELS = 60;

const arr = new Uint8Array(PIXELS * 3);

const ad = mdns.createAdvertisement(mdns.tcp('mqtt'), 1883);

ad.start();

const client = mqtt.connect('mqtt://localhost');

client.subscribe('house/register/led-strip');

client.subscribe('building/led-strip-raw');

client.on('message', async (topic, message) => {
  if (topic === 'building/led-strip-raw') {
    for (let i = 0; i < message.length; i++) {
      arr[i] = message[i];
    }

    return;
  }

  console.log('Received: ', topic, message.length, message.toString());

  if (topic === 'house/register/led-strip') {
    const deviceName = message.toString();

    client.subscribe('house/device/out/' + deviceName);

    console.log('Instructing device to connect to multicast address:', MULTICAST_ADDR);

    client.publish('house/device/in/' + deviceName, 'connect-udp:' + MULTICAST_ADDR);

    while (true) {
      await sleep(5);

      console.log('PINGING!');

      client.publish('house/device/in/' + deviceName, 'ping');
      // client.publish('house/device/in/' + deviceName, 'reset');
    }
  }
});

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

socket.bind(PORT);

socket.on('listening', function () {
  socket.addMembership(MULTICAST_ADDR);
  setInterval(sendMessage, 1000 / FPS);
  const address = socket.address() as AddressInfo;
  console.log(`UDP socket listening on ${address.address}:${address.port} pid: ${process.pid}`);
});

let time = 0;

let effect: LedEffect = Rainbow;

const buf = new Uint8Array(PIXELS * 3);

function sendMessage() {
  time += 1;

  effect(buf, PIXELS, time);

  const message = Buffer.from(arr);

  socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, () => {
    // console.info(`Sending message '${message}'`);
  });
}

socket.on('message', function (message, rinfo) {
  // console.info(`Message from: ${rinfo.address}:${rinfo.port} - ${message}`);
});

function sleep(n: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, n * 1000);
  });
}
