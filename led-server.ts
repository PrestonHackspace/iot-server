import dgram from 'dgram';
import * as mdns from 'mdns';
import mqtt from 'mqtt';
import { AddressInfo } from 'net';
import process from 'process';
import { Gamma, hslToRgb } from './util';

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

let i = 0;

// const allOn = new Uint8Array(PIXELS * 3);
// const allOff = new Uint8Array(PIXELS * 3);

// for (let idx = 0; idx < allOn.length; idx += 1) {
//   allOn[idx] = 1;
//   allOff[idx] = 0;
// }

function sendMessage() {
  // const message = Buffer.from(`Message from process ${process.pid}`);

  i += 1;

  // const arr = (i % 2 === 0) ? allOff : allOn;

  for (let idx = 0; idx < PIXELS; idx += 1) {
    const hue = ((idx + i * 0.25) % PIXELS) / PIXELS;

    const [r, g, b] = hslToRgb(hue, 1, (Math.sin(i / 25) + 1) * 0.06125);

    // const [r, g, b] = hslToRgb(hue, 1, Math.random() / 5 + 0.5);

    arr[idx * 3 + 0] = Gamma[g];
    arr[idx * 3 + 1] = Gamma[r];
    arr[idx * 3 + 2] = Gamma[b];

    // if (idx < (i * 3 % arr.length)) {
    //   arr[idx] = 31;
    // }

    // arr[idx] = i % 128;
    // arr[100] = 2;
  }

  const message = Buffer.from(arr);

  socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, function () {
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
