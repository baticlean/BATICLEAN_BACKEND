const Client = require('../models/Client');

const findOrCreateClient = async (clientData) => {
  const { email, phone, contactName, companyName, requesterType, city, commune, address, whatsapp } = clientData;

  let client = await Client.findOne({ $or: [{ email }, { phone }] });

  if (client) {
    client.contactName = contactName || client.contactName;
    if (companyName) client.companyName = companyName;
    if (whatsapp) client.whatsapp = whatsapp;
    if (city) client.city = city;
    if (commune) client.commune = commune;
    if (address) client.address = address;
    await client.save();
    return client;
  }

  client = await Client.create({
    type: requesterType,
    companyName: companyName || null,
    contactName,
    phone,
    whatsapp: whatsapp || null,
    email,
    city: city || null,
    commune: commune || null,
    address: address || null,
  });

  return client;
};

module.exports = {
  findOrCreateClient,
};
