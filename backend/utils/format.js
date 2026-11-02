// Converts web3 1.x struct results (numeric + named keys) into clean JSON.
const STATUS = ['Created', 'In Transit', 'At Distributor', 'At Retailer', 'Sold', 'Recalled'];
const ROLES = ['None', 'Manufacturer', 'Distributor', 'Retailer', 'Inspector'];

function product(p) {
  return {
    id: Number(p.id),
    name: p.name,
    batchNumber: p.batchNumber,
    origin: p.origin,
    manufacturer: p.manufacturer,
    manufacturedAt: Number(p.manufacturedAt),
    expiryDate: Number(p.expiryDate),
    status: Number(p.status),
    statusLabel: STATUS[Number(p.status)],
  };
}

function checkpoint(c) {
  return {
    actor: c.actor,
    location: c.location,
    notes: c.notes,
    status: Number(c.status),
    statusLabel: STATUS[Number(c.status)],
    timestamp: Number(c.timestamp),
  };
}

module.exports = { STATUS, ROLES, product, checkpoint };
