// import the module
var mdns = require('mdns');

// advertise a http server on port 4321
var ad = mdns.createAdvertisement(mdns.tcp('mqtt'), 1883);
ad.start();

// watch all http servers
//var browser = mdns.createBrowser(mdns.tcp('http'));
var sequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
    mdns.rst.makeAddressesUnique()
];
var browser = mdns.createBrowser(mdns.tcp('http'), {resolverSequence: sequence});

browser.on('serviceUp', function(service) {
  console.log("service up: ", service);
});

browser.on('serviceDown', function(service) {
  console.log("service down: ", service);
});

//browser.start();

// discover all available service types
//var all_the_types = mdns.browseThemAll(); // all_the_types is just another browser...

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://10.30.1.101')

client.subscribe('building/bell');
client.subscribe('building/rf');

var last = '0';

client.on('connect', function () {
  console.log('Connected to MQTT');
  //client.subscribe('presence')

  setInterval(function() {
    //console.log('Publish...');
    //client.publish('building/bell', last)

    last = last === '0' ? '1' : '0';
  }, 1000);
})

client.on('message', async function (topic, message) {
  // message is Buffer
  console.log('Received: ', topic, message.toString())
  //client.end()

  switch (message.toString()) {
    case "15345183":
    case "15345182":
    case "15345175":
    case "15345174":
    case "15345179":
    case "15345178":
    case "15345171":
    case "15345170":
    case "15345181":
    case "15345180":
      client.publish('building/bell', '100');
      await sleep(0.50);
      client.publish('building/bell', '100');
      break;

  }
})

function sleep(n) {
  return new Promise(function (resolve) {
    setTimeout(resolve, n * 1000);
  });
}

